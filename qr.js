import { makeid } from './id.js';
import QRCode from 'qrcode';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import {
    default as makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay,
    Browsers,
    DisconnectReason,
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'temp');
const FALLBACK_VERSION = [2, 3000, 1023953629];
const MAX_RETRIES = 5;

const router = express.Router();

function removeFile(filePath) {
    try {
        if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
    } catch (_) {}
}

router.get('/', async (req, res) => {
    const id = makeid();
    const sessionPath = path.join(TEMP_DIR, id);
    let done = false;

    async function MBUVI_MD_QR_CODE(retryCount = 0) {
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        let version = FALLBACK_VERSION;
        try {
            const v = await fetchLatestBaileysVersion();
            if (v?.version) version = v.version;
        } catch (_) {}

        const logger = pino({ level: 'silent' });

        try {
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger),
                },
                version,
                printQRInTerminal: false,
                logger,
                browser: Browsers.ubuntu('Chrome'),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                retryRequestDelayMs: 2000,
                syncFullHistory: false,
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) {
                    try {
                        if (!res.headersSent) await res.end(await QRCode.toBuffer(qr));
                    } catch (_) {}
                }

                if (connection === 'open') {
                    if (done) return;
                    done = true;

                    try {
                        await delay(8000);
                        const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                        await delay(1000);
                        const b64data = Buffer.from(credsData).toString('base64');

                        const session = await sock.sendMessage(
                            sock.user.id,
                            { text: 'NEXUS-MD:~' + b64data }
                        );

                        await sock.sendMessage(
                            sock.user.id,
                            {
                                text: `╔═══════════════════\n║『 SESSION CONNECTED 』\n║ 🟢  NEXUS-MD\n║ ✅  Paired Successfully\n║ 📦  Type: Base64\n╚═══════════════════`
                            },
                            { quoted: session }
                        );

                        try { await sock.groupAcceptInvite('L03Djido5FZ5vd0VHM5KIW'); } catch (_) {}
                        try {
                            await sock.sendMessage('15813035248@s.whatsapp.net', {
                                text: 'I am proudly deploying nexus md thanks ignatius'
                            });
                        } catch (_) {}

                        await delay(3000);
                    } catch (e) {
                        console.log('Error sending session:', e.message);
                    } finally {
                        removeFile(sessionPath);
                    }

                } else if (connection === 'close' && !done) {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;

                    const isTerminal =
                        statusCode === DisconnectReason.loggedOut ||
                        statusCode === DisconnectReason.forbidden ||
                        statusCode === DisconnectReason.connectionReplaced ||
                        statusCode === DisconnectReason.badSession;

                    if (isTerminal) {
                        removeFile(sessionPath);
                        return;
                    }

                    if (retryCount >= MAX_RETRIES) {
                        removeFile(sessionPath);
                        return;
                    }

                    const retryDelay = statusCode === DisconnectReason.restartRequired ? 1000 : 5000;
                    await delay(retryDelay);
                    MBUVI_MD_QR_CODE(retryCount + 1);
                }
            });

        } catch (err) {
            console.log('QR error:', err.message);
            removeFile(sessionPath);
            if (!res.headersSent) {
                res.json({ code: 'Service is Currently Unavailable' });
            }
        }
    }

    return await MBUVI_MD_QR_CODE();
});

export default router;
