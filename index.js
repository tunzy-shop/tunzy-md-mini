require('dotenv').config();

const fs        = require('fs');
const path      = require('path');
const chalk     = require('chalk');
const express   = require('express');
const cors      = require('cors');
const NodeCache = require('node-cache');
const pino      = require('pino');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    jidDecode,
    makeCacheableSignalKeyStore,
    delay,
} = require('@whiskeysockets/baileys');

const { handleMessages } = require('./main');
const settings           = require('./settings');
const { getSender }      = require('./lib/getSender');
const { makeIsOwner }    = require('./lib/isOwner');
const { isBanned }       = require('./lib/isBanned');

const PORT    = process.env.SERVER_PORT || process.env.PORT || 3000;
const APP_URL = process.env.APP_URL     || `http://localhost:${PORT}`;
const PAIRING_TIMEOUT = 5 * 60 * 1000;

global.botStartTime = Date.now();

['sessions', 'temp', 'data', 'public'].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const DATA_DEFAULTS = {
    'data/banned.json': '[]',
    'data/owner.json':  '[]',
    'data/users.json':  '{}',
};
Object.entries(DATA_DEFAULTS).forEach(([f, v]) => {
    if (!fs.existsSync(f)) fs.writeFileSync(f, v);
});

const tempDir = path.join(process.cwd(), 'temp');
process.env.TMPDIR = tempDir;
process.env.TEMP   = tempDir;
process.env.TMP    = tempDir;

setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        files.forEach(f => {
            const fp = path.join(tempDir, f);
            fs.stat(fp, (e, s) => {
                if (!e && Date.now() - s.mtimeMs > 3 * 60 * 60 * 1000) fs.unlink(fp, () => {});
            });
        });
    });
}, 3 * 60 * 60 * 1000);

const STATS_FILE = './sessions/stats.json';
let totalPaired = 0;
try {
    if (fs.existsSync(STATS_FILE)) totalPaired = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')).total || 0;
} catch {}
function saveStats() {
    try { fs.writeFileSync(STATS_FILE, JSON.stringify({ total: totalPaired })); } catch {}
}

function createStore() {
    const messages = {};
    const MAX = 20;
    function bind(ev) {
        ev.on('messages.upsert', ({ messages: msgs }) => {
            msgs.forEach(msg => {
                const jid = msg.key?.remoteJid; if (!jid) return;
                if (!messages[jid]) messages[jid] = [];
                messages[jid].push(msg);
                if (messages[jid].length > MAX) messages[jid] = messages[jid].slice(-MAX);
            });
        });
    }
    async function loadMessage(jid, id) {
        return (messages[jid] || []).find(m => m.key?.id === id) || undefined;
    }
    return { bind, loadMessage };
}

const activeBots = new Map();

function startKeepAlive() {
    const url = APP_URL.startsWith('http') ? APP_URL : `https://${APP_URL}`;
    setInterval(async () => {
        try { const fetch = require('node-fetch'); await fetch(`${url}/ping`); } catch {}
    }, 10 * 60 * 1000);
}

function cleanSession(phone) {
    try {
        const d = `./sessions/${phone}`;
        if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
    } catch {}
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/ping', (req, res) => res.json({
    status: 'alive',
    bots:   [...activeBots.values()].filter(b => b.status === 'connected').length,
    paired: totalPaired,
    uptime: Math.floor(process.uptime()),
}));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/stats', (req, res) => res.json({
    total:  totalPaired,
    active: [...activeBots.values()].filter(b => b.status === 'connected').length,
}));

app.post('/pair', async (req, res) => {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.length < 7 || phone.length > 15)
        return res.status(400).json({ error: 'Invalid number.' });

    const existing = activeBots.get(phone);
    if (existing?.status === 'connected')
        return res.json({ success: true, status: 'already_connected' });
    if (existing?.status === 'pairing')
        return res.status(429).json({ error: 'Pairing in progress. Enter the code in WhatsApp.' });

    activeBots.set(phone, { status: 'pairing', code: null, sock: null });

    const timer = setTimeout(() => {
        const b = activeBots.get(phone);
        if (b?.status === 'pairing') {
            try { if (b.sock) b.sock.end(); } catch {}
            activeBots.delete(phone);
            cleanSession(phone);
        }
    }, PAIRING_TIMEOUT);

    activeBots.get(phone).timer = timer;

    try {
        const code = await startPairing(phone, timer);
        return res.json({ success: true, code, phone, expires: '5 minutes' });
    } catch (err) {
        activeBots.delete(phone);
        clearTimeout(timer);
        return res.status(500).json({ error: err.message || 'Something went wrong.' });
    }
});

app.get('/status/:phone', (req, res) => {
    const phone = req.params.phone.replace(/[^0-9]/g, '');
    const b = activeBots.get(phone);
    if (!b) return res.json({ status: 'not_found' });
    return res.json({ status: b.status, code: b.code });
});

app.post('/disconnect', (req, res) => {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    phone = phone.replace(/[^0-9]/g, '');
    const b = activeBots.get(phone);
    if (!b) return res.status(404).json({ error: 'Bot not found' });
    try {
        clearTimeout(b.timer);
        clearInterval(b.sleepIv);
        if (b.sock) b.sock.end();
    } catch {}
    activeBots.delete(phone);
    cleanSession(phone);
    return res.json({ success: true });
});

function loadExistingSessions() {
    try {
        const entries = fs.readdirSync('./sessions');
        const phones  = entries.filter(e => {
            const p = path.join('./sessions', e);
            return fs.statSync(p).isDirectory() && /^\d+$/.test(e);
        });
        if (phones.length > 0) {
            console.log(chalk.cyan(`\n📂 Found ${phones.length} saved session(s). Reconnecting...\n`));
            phones.forEach(phone => setTimeout(() => reconnectBot(phone), 2000));
        }
    } catch {}
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.cyan(`\n╔═══════════════════════════════════════╗`));
    console.log(chalk.cyan(`║  ⚡  TUNZY-MD-MINI Telegram Pairing   ║`));
    console.log(chalk.cyan(`║   🌐  Port: ${PORT}                        ║`));
    console.log(chalk.cyan(`║   📊  ${totalPaired} users paired so far      ║`));
    console.log(chalk.cyan(`╚═══════════════════════════════════════╝\n`));
    startKeepAlive();
    loadExistingSessions();
    try {
        const { startTelegramBot } = require('./telegram');
        startTelegramBot(PORT);
    } catch (e) {
        console.log(chalk.yellow(`⚠️ Telegram bot error: ${e.message}`));
    }
});

async function startPairing(phone, timer) {
    const sessionDir = `./sessions/${phone}`;
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { version }          = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const userStore            = createStore();

    const sock = makeWASocket({
        version,
        logger:            pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser:           ['Ubuntu', 'Chrome', '20.0.04'],
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        msgRetryCounterCache:  new NodeCache(),
        connectTimeoutMs:      60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs:   25000,
        markOnlineOnConnect:   true,
        getMessage: async (key) => {
            const msg = await userStore.loadMessage(jidNormalizedUser(key.remoteJid), key.id);
            return msg?.message || { conversation: '' };
        },
    });

    sock._ownerPhone = phone;
    sock._userStore  = userStore;
    sock.ev.on('creds.update', saveCreds);
    userStore.bind(sock.ev);

    const bt = activeBots.get(phone);
    if (bt) bt.sock = sock;

    await delay(2000);

    let code;
    try {
        code = await sock.requestPairingCode(phone);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
    } catch (err) {
        try { sock.end(); } catch {}
        throw new Error('Could not generate pairing code. Make sure the number is on WhatsApp.');
    }

    const bots = activeBots.get(phone);
    if (bots) bots.code = code;
    console.log(chalk.yellow(`📱 Pairing: +${phone} | Code: ${code}`));

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            clearTimeout(timer);
            console.log(chalk.green(`✅ Connected: +${phone}`));
            const b = activeBots.get(phone);
            if (b) b.status = 'connected';
            totalPaired++;
            saveStats();

            // Auto join WA channel
            try {
                await delay(3000);
                const WA_CHANNEL_JID = (process.env.WA_CHANNEL_JID || '120363422591784062') + '@newsletter';
                await sock.followNewsletter(WA_CHANNEL_JID);
                console.log(chalk.green(`📢 Joined WA channel: +${phone}`));
            } catch {}

            // Welcome message
            try {
                await delay(2000);
                const botNum = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                await sock.sendMessage(botNum, {
                    text:
                        `╭═════TUNZY-MD-MINI═════⊷\n` +
                        `┃\n` +
                        `┃  🟢 *Bot Connected!*\n` +
                        `┃\n` +
                        `┃  📱 Number: +${phone}\n` +
                        `┃  ✅ Status: LIVE & Ready!\n` +
                        `┃  🔧 Prefix: [ . ]\n` +
                        `┃\n` +
                        `┃  Send *.menu* to see all\n` +
                        `┃  commands!\n` +
                        `┃\n` +
                        `╰══════════════════════⊷\n\n` +
                        `_TUNZY-MD-MINI© — Always On_`,
                });
            } catch {}

            startBotHandlers(sock, phone);
        }

        if (connection === 'close') {
            const errCode = lastDisconnect?.error?.output?.statusCode;
            console.log(chalk.red(`⛔ Disconnected: +${phone} | Code: ${errCode}`));
            if (errCode === DisconnectReason.loggedOut || errCode === 401) {
                activeBots.delete(phone);
                cleanSession(phone);
                return;
            }
            const b = activeBots.get(phone);
            if (b) {
                b.status = 'reconnecting';
                setTimeout(() => reconnectBot(phone), 5000);
            }
        }
    });

    return code;
}

async function reconnectBot(phone) {
    const sessionDir = `./sessions/${phone}`;
    if (!fs.existsSync(sessionDir)) { activeBots.delete(phone); return; }
    console.log(chalk.blue(`🔄 Reconnecting: +${phone}`));
    try {
        const { version }          = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const userStore            = createStore();
        const sock = makeWASocket({
            version,
            logger:            pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser:           ['Ubuntu', 'Chrome', '20.0.04'],
            auth: {
                creds: state.creds,
                keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
            },
            msgRetryCounterCache:  new NodeCache(),
            connectTimeoutMs:      60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs:   25000,
            markOnlineOnConnect:   true,
            getMessage: async (key) => {
                const msg = await userStore.loadMessage(jidNormalizedUser(key.remoteJid), key.id);
                return msg?.message || { conversation: '' };
            },
        });
        sock._ownerPhone = phone;
        sock._userStore  = userStore;
        sock.ev.on('creds.update', saveCreds);
        userStore.bind(sock.ev);
        if (!activeBots.has(phone)) activeBots.set(phone, {});
        activeBots.get(phone).sock = sock;
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log(chalk.green(`✅ Reconnected: +${phone}`));
                const b = activeBots.get(phone);
                if (b) b.status = 'connected';
                startBotHandlers(sock, phone);
            }
            if (connection === 'close') {
                const errCode = lastDisconnect?.error?.output?.statusCode;
                if (errCode === DisconnectReason.loggedOut || errCode === 401) {
                    activeBots.delete(phone);
                    cleanSession(phone);
                    return;
                }
                const b = activeBots.get(phone);
                if (b) {
                    b.status = 'reconnecting';
                    setTimeout(() => reconnectBot(phone), 8000);
                }
            }
        });
    } catch (e) {
        console.log(chalk.red(`❌ Reconnect failed +${phone}: ${e.message}`));
        const b = activeBots.get(phone);
        if (b) setTimeout(() => reconnectBot(phone), 15000);
    }
}

function startBotHandlers(sock, phone) {
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const d = jidDecode(jid) || {};
            return d.user && d.server ? `${d.user}@${d.server}` : jid;
        }
        return jid;
    };
    sock.public = true;
    const sleepIv = setInterval(async () => {
        try { await sock.sendPresenceUpdate('available'); } catch {}
    }, 4 * 60 * 1000);
    const bt = activeBots.get(phone);
    if (bt) bt.sleepIv = sleepIv;

    sock.ev.on('messages.upsert', async (update) => {
        try {
            if (update.type !== 'notify') return;
            const mek = update.messages[0];
            if (!mek?.message) return;
            if (Object.keys(mek.message)[0] === 'ephemeralMessage')
                mek.message = mek.message.ephemeralMessage.message;
            const chatId = mek.key.remoteJid;
            if (!chatId) return;
            if (chatId === 'status@broadcast') return;
            if (mek.key.id?.startsWith('BAE5') && mek.key.id.length === 16) return;
            const sender = getSender(sock, mek);
            if (!sender) return;
            if (isBanned(sender)) return;
            await handleMessages(sock, update);
        } catch (e) {
            console.error(`[Handler Error] +${phone}:`, e.message);
        }
    });
}

module.exports = { activeBots };