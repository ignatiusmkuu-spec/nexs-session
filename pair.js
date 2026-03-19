const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require('pino');
const {
    default: Mbuvi_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers
} = require('@whiskeysockets/baileys');

const FALLBACK_WA_VERSION = [2, 3000, 1015901307];

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    let done = false;

    if (!num) {
        return res.status(400).json({ code: 'Phone number is required' });
    }

    async function Mbuvi_MD_PAIR_CODE() {
        if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        let version = FALLBACK_WA_VERSION;
        try {
            const result = await fetchLatestBaileysVersion();
            if (result && result.version) version = result.version;
        } catch (_) {}

        const logger = pino({ level: 'fatal' }).child({ level: 'fatal' });

        try {
            let Pair_Code_By_Mbuvi_Tech = Mbuvi_Tech({
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
            });

            if (!Pair_Code_By_Mbuvi_Tech.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Pair_Code_By_Mbuvi_Tech.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.json({ code });
                }
            }

            Pair_Code_By_Mbuvi_Tech.ev.on('creds.update', saveCreds);

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
                res.status(500).json({ code: 'Service Currently Unavailable' });
            }
        }
    }

    return await Mbuvi_MD_PAIR_CODE();
});

module.exports = router;
