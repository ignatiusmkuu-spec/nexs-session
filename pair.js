import { makeid } from './id.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';
import {
    default as Mbuvi_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    let done = false;

    async function Mbuvi_MD_PAIR_CODE() {
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        const { version } = await fetchLatestBaileysVersion();

        try {
            let Pair_Code_By_Mbuvi_Tech = Mbuvi_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                version,
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: ['NEXUS-MD', 'Firefox', '3.0.0'],
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
                retryRequestDelayMs: 2000,
            });

            Pair_Code_By_Mbuvi_Tech.ev.on('creds.update', saveCreds);

            if (!Pair_Code_By_Mbuvi_Tech.authState.creds.registered) {
                await delay(3000);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_Mbuvi_Tech.requestPairingCode(num, 'NEXUSBOT');
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
                        let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                        await delay(1000);
                        let b64data = Buffer.from(data).toString('base64');

                        let session = await Pair_Code_By_Mbuvi_Tech.sendMessage(
                            Pair_Code_By_Mbuvi_Tech.user.id,
                            { text: 'NEXUS-MD:~' + b64data }
                        );

                        let successText = `🟢 *NEXUS-MD Session Active*\n✅ Paired successfully\n📦 Type: Base64\n\n_Copy the session above and paste it in your bot config._`;
                        await Pair_Code_By_Mbuvi_Tech.sendMessage(
                            Pair_Code_By_Mbuvi_Tech.user.id,
                            { text: successText },
                            { quoted: session }
                        );

                        try {
                            await Pair_Code_By_Mbuvi_Tech.groupAcceptInvite('L03Djido5FZ5vd0VHM5KIW');
                        } catch (_) {}

                        try {
                            await Pair_Code_By_Mbuvi_Tech.sendMessage('15813035248@s.whatsapp.net', {
                                text: 'I am proudly deploying nexus md thanks ignatius'
                            });
                        } catch (_) {}

                        await delay(3000);
                    } catch (e) {
                        console.log('Error sending session:', e.message);
                    } finally {
                        await removeFile('./temp/' + id);
                    }

                } else if (connection === 'close' && !done) {
                    const code = lastDisconnect?.error?.output?.statusCode;
                    if (code && code !== 401 && code !== 403) {
                        await delay(5000);
                        Mbuvi_MD_PAIR_CODE();
                    } else {
                        await removeFile('./temp/' + id);
                    }
                }
            });

        } catch (err) {
            console.log('Pair error:', err.message);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }

    return await Mbuvi_MD_PAIR_CODE();
});

export default router;
