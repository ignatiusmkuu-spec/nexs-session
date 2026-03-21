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

    async function Mbuvi_MD_PAIR_CODE() {
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        let version = FALLBACK_VERSION;
        try {
            const v = await fetchLatestBaileysVersion();
            if (v?.version) version = v.version;
        } catch (_) {}

        const logger = pino({ level: 'fatal' }).child({ level: 'fatal' });

        try {
            let Pair_Code_By_Mbuvi_Tech = makeWASocket({
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

            Pair_Code_By_Mbuvi_Tech.ev.on('creds.update', saveCreds);

            if (!Pair_Code_By_Mbuvi_Tech.authState.creds.registered) {
                await delay(3000);
                num = num.replace(/[^0-9]/g, '');
                await Pair_Code_By_Mbuvi_Tech.requestPairingCode(num, 'NEXUSBOT');
                if (!res.headersSent) {
                    await res.send({ code: 'NEXUS-BOT' });
                }
            }

            Pair_Code_By_Mbuvi_Tech.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === 'open') {
                    if (done) return;
                    done = true;

                    try {
                        await delay(8000);
                        const credsData = fs.readFileSync(path.join(sessionPath, 'creds.json'));
                        await delay(1000);
                        const b64data = Buffer.from(credsData).toString('base64');

                        const session = await Pair_Code_By_Mbuvi_Tech.sendMessage(
                            Pair_Code_By_Mbuvi_Tech.user.id,
                            { text: 'NEXUS-MD:~' + b64data }
                        );

                        await Pair_Code_By_Mbuvi_Tech.sendMessage(
                            Pair_Code_By_Mbuvi_Tech.user.id,
                            { text: `🟢 *NEXUS-MD Session Active*\n✅ Paired successfully\n📦 Type: Base64\n\n_Copy the session above and paste it in your bot config._` },
                            { quoted: session }
                        );

                        try { await Pair_Code_By_Mbuvi_Tech.groupAcceptInvite('L03Djido5FZ5vd0VHM5KIW'); } catch (_) {}
                        try {
                            await Pair_Code_By_Mbuvi_Tech.sendMessage('15813035248@s.whatsapp.net', {
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
                        Mbuvi_MD_PAIR_CODE();
                    }
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
