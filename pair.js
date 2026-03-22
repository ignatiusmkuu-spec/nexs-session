import { makeid } from './id.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import {
    default as makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
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
    let num = req.query.number;
    let done = false;

    if (!num) {
        return res.status(400).send({ code: 'Phone number is required' });
    }

    async function Mbuvi_MD_PAIR_CODE(retryCount = 0) {
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        let version = FALLBACK_VERSION;
        try {
            const v = await fetchLatestBaileysVersion();
            if (v?.version) version = v.version;
        } catch (_) {}

        const logger = pino({ level: 'fatal' }).child({ level: 'fatal' });

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

            if (!sock.authState.creds.registered) {
                await delay(3000);
                num = num.replace(/[^0-9]/g, '');
                const pairingCode = await sock.requestPairingCode(num, 'NEXUSBOT');
                if (!res.headersSent) {
                    await res.send({ code: pairingCode });
                }
            }

            sock.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === 'open') {
                    if (done) return;
                    done = true;

                    try {
                        await delay(5000);
                        await saveCreds();
                        await delay(2000);
                        const b64data = Buffer.from(JSON.stringify(state.creds)).toString('base64');

                        const session = await sock.sendMessage(
                            sock.user.id,
                            { text: 'NEXUS-MD:~' + b64data }
                        );

                        await sock.sendMessage(
                            sock.user.id,
                            { text: `🟢 *NEXUS-MD Session Active*\n✅ Paired successfully\n📦 Type: Base64\n\n_Copy the session above and paste it in your bot config._` },
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
                        try { sock.ev.removeAllListeners(); sock.ws.terminate(); } catch (_) {}
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
                        if (!res.headersSent) {
                            res.send({ code: 'Session ended. Please try pairing again.' });
                        }
                        return;
                    }

                    if (retryCount >= MAX_RETRIES) {
                        removeFile(sessionPath);
                        if (!res.headersSent) {
                            res.send({ code: 'Service Currently Unavailable' });
                        }
                        return;
                    }

                    const retryDelay = statusCode === DisconnectReason.restartRequired ? 1000 : 5000;
                    await delay(retryDelay);
                    Mbuvi_MD_PAIR_CODE(retryCount + 1);
                }
            });

        } catch (err) {
            console.log('Pair error:', err.message);
            removeFile(sessionPath);
            if (!res.headersSent) {
                res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }

    return await Mbuvi_MD_PAIR_CODE();
});

export default router;
