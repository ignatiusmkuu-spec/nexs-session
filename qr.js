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

    async function MBUVI_MD_QR_CODE() {
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        let version = FALLBACK_VERSION;
        try {
            const v = await fetchLatestBaileysVersion();
            if (v?.version) version = v.version;
        } catch (_) {}

        const logger = pino({ level: 'silent' });

        try {
            let Qr_Code_By_Mbuvi_Tech = makeWASocket({
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

            Qr_Code_By_Mbuvi_Tech.ev.on('creds.update', saveCreds);

            Qr_Code_By_Mbuvi_Tech.ev.on('connection.update', async (s) => {
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

                        const session = await Qr_Code_By_Mbuvi_Tech.sendMessage(
                            Qr_Code_By_Mbuvi_Tech.user.id,
                            { text: 'NEXUS-MD:~' + b64data }
                        );

                        await Qr_Code_By_Mbuvi_Tech.sendMessage(
                            Qr_Code_By_Mbuvi_Tech.user.id,
                            {
                                text: `╔═══════════════════\n║『 SESSION CONNECTED 』\n║ 🟢  NEXUS-MD\n║ ✅  Paired Successfully\n║ 📦  Type: Base64\n╚═══════════════════`
                            },
                            { quoted: session }
                        );

                        try { await Qr_Code_By_Mbuvi_Tech.groupAcceptInvite('L03Djido5FZ5vd0VHM5KIW'); } catch (_) {}
                        try {
                            await Qr_Code_By_Mbuvi_Tech.sendMessage('15813035248@s.whatsapp.net', {
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
                    const isLoggedOut = statusCode === DisconnectReason.loggedOut
                        || statusCode === 401
                        || statusCode === 403;
                    if (isLoggedOut) {
                        removeFile(sessionPath);
                    } else {
                        await delay(5000);
                        MBUVI_MD_QR_CODE();
                    }
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
