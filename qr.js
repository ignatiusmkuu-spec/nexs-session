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
    DisconnectReason,
    delay,
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, 'temp');
const FALLBACK_WA_VERSION = [2, 3000, 1023953629];

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
    let qrSent = false;

    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    let version = FALLBACK_WA_VERSION;
    try {
        const v = await fetchLatestBaileysVersion();
        if (v && v.version) version = v.version;
    } catch (_) {}

    const logger = pino({ level: 'silent' });

    async function startQR() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: ['NEXUS-MD', 'Chrome', '3.0.0'],
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            retryRequestDelayMs: 2000,
            syncFullHistory: false,
            markOnlineOnConnect: false,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr && !qrSent) {
                qrSent = true;
                try {
                    const qrBuffer = await QRCode.toBuffer(qr);
                    if (!res.headersSent) res.end(qrBuffer);
                } catch (e) {
                    console.log('QR generate error:', e.message);
                }
            }

            if (connection === 'open') {
                if (done) return;
                done = true;
                try {
                    await delay(8000);
                    const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                    await delay(800);
                    const b64 = Buffer.from(credsData).toString('base64');
                    const session = await sock.sendMessage(sock.user.id, { text: 'NEXUS-MD:~' + b64 });
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
                    console.log('Session send error:', e.message);
                } finally {
                    removeFile(sessionPath);
                }

            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (!done && reason !== DisconnectReason.loggedOut && reason !== 403) {
                    await delay(5000);
                    startQR();
                } else {
                    removeFile(sessionPath);
                }
            }
        });
    }

    try {
        await startQR();
    } catch (err) {
        console.log('Start QR error:', err.message);
        removeFile(sessionPath);
        if (!res.headersSent) res.status(500).json({ code: 'Service is Currently Unavailable' });
    }
});

export default router;
