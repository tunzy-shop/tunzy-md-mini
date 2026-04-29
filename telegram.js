require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios       = require('axios');
const path        = require('path');
const fs          = require('fs');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
const BOT_NAME       = 'TUNZY-MD-MINI';
const LOGO_PATH      = path.join(__dirname, 'public', 'logo.jpg');
const TG_CHANNEL     = process.env.TG_CHANNEL    || 'https://t.me/tunzy_md';
const TG_GROUP       = process.env.TG_GROUP      || 'https://t.me/tunzymd_tech';
const TG_CHANNEL_ID  = process.env.TG_CHANNEL_ID || '@tunzy_md';
const TG_GROUP_ID    = process.env.TG_GROUP_ID   || '@tunzymd_tech';
const MAX_SESSIONS   = parseInt(process.env.MAX_SESSIONS_PER_USER) || 2;
const MAX_TOTAL      = parseInt(process.env.MAX_TOTAL_SESSIONS)    || 300;
const OWNER_NAME     = process.env.OWNER_NAME || 'TUNZY SHOP';

const USERS_FILE = './data/users.json';

function loadUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return {}; }
}
function saveUsers(data) {
    try { fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2)); } catch {}
}
function getUser(userId) {
    return loadUsers()[String(userId)] || null;
}
function setUser(userId, data) {
    const users = loadUsers();
    users[String(userId)] = { ...users[String(userId)], ...data };
    saveUsers(users);
}
function totalSessions() {
    const users = loadUsers();
    let count = 0;
    for (const u of Object.values(users)) count += (u.sessions || []).length;
    return count;
}

let bot;
let API_BASE;

async function isMember(userId, chatId) {
    try {
        const member = await bot.getChatMember(chatId, userId);
        return ['member', 'administrator', 'creator', 'restricted'].includes(member.status);
    } catch (e) {
        console.log(`Membership check failed ${chatId}:`, e.message);
        return false;
    }
}

async function sendLogo(chatId, caption, opts = {}) {
    try {
        if (fs.existsSync(LOGO_PATH)) {
            return await bot.sendPhoto(chatId, LOGO_PATH, { caption, parse_mode: 'Markdown', ...opts });
        }
    } catch {}
    return await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown', ...opts });
}

function startTelegramBot(port) {
    API_BASE = `http://localhost:${port}`;
    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    // ── /start ──
    bot.onText(/\/start/, async (msg) => {
        const chatId    = msg.chat.id;
        const firstName = msg.from.first_name || 'User';

        const caption =
            `╭═════*${BOT_NAME}*═════⊷\n` +
            `┃\n` +
            `┃  👋 Welcome, *${firstName}*!\n` +
            `┃\n` +
            `┃  I am *${BOT_NAME}*\n` +
            `┃  Owner: *${OWNER_NAME}*\n` +
            `┃\n` +
            `┃  To continue:\n` +
            `┃  1️⃣ Join our Channel\n` +
            `┃  2️⃣ Join our Group\n` +
            `┃  3️⃣ Click ✅ Verify\n` +
            `┃\n` +
            `╰══════════════════════⊷`;

        await sendLogo(chatId, caption, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📢 Join Channel', url: TG_CHANNEL },
                        { text: '👥 Join Group',   url: TG_GROUP }
                    ],
                    [{ text: '✅ Verify Membership', callback_data: 'verify' }]
                ]
            }
        });
    });

    // ── /help ──
    bot.onText(/\/help/, (msg) => {
        bot.sendMessage(msg.chat.id,
            `╭═════ HELP ═════⊷\n` +
            `┃\n` +
            `┃  /start - Start & verify\n` +
            `┃  /pair +number - Pair WhatsApp\n` +
            `┃  /delpair +number - Delete bot\n` +
            `┃  /mysessions - View sessions\n` +
            `┃  /status - Bot status\n` +
            `┃  /stop - Stop your bot\n` +
            `┃\n` +
            `┃  ⚠️ Max ${MAX_SESSIONS} numbers per user\n` +
            `┃\n` +
            `╰══════════════════════⊷`,
            { parse_mode: 'Markdown' }
        );
    });

    // ── /pair ──
    bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
        const chatId   = msg.chat.id;
        const phoneArg = match[1]?.trim();
        const user     = getUser(chatId);

        if (!user?.verified) {
            return bot.sendMessage(chatId,
                `❌ Please /start and verify first!`
            );
        }

        if (phoneArg) {
            await processPairing(chatId, phoneArg);
        } else {
            bot.sendMessage(chatId,
                `📱 *Enter your WhatsApp number:*\n\n` +
                `Include country code, no + symbol.\n\n` +
                `*Example:* \`2349067345425\``,
                { parse_mode: 'Markdown' }
            );
        }
    });

    // ── /delpair ──
    bot.onText(/\/delpair(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const user   = getUser(chatId);

        if (!user?.verified) {
            return bot.sendMessage(chatId, `❌ Please /start and verify first!`);
        }

        const phoneArg = match[1]?.trim();
        if (!phoneArg) {
            return bot.sendMessage(chatId, `❌ Usage: /delpair +2349XXXXXXXX`);
        }

        const number = phoneArg.replace(/[^0-9]/g, '');
        if (!user?.sessions?.includes(number)) {
            return bot.sendMessage(chatId, `❌ +${number} not in your sessions!\nUse /mysessions to check.`);
        }

        try {
            await axios.post(`${API_BASE}/disconnect`, { phone: number }, { timeout: 8000 });
        } catch {}

        setUser(chatId, { sessions: (user.sessions || []).filter(s => s !== number) });
        bot.sendMessage(chatId, `✅ Session *+${number}* deleted!`, { parse_mode: 'Markdown' });
    });

    // ── /mysessions ──
    bot.onText(/\/mysessions/, async (msg) => {
        const chatId = msg.chat.id;
        const user   = getUser(chatId);

        if (!user?.verified) {
            return bot.sendMessage(chatId, `❌ Please /start and verify first!`);
        }

        const sessions = user?.sessions || [];
        if (!sessions.length) {
            return bot.sendMessage(chatId, `📋 No active sessions.\nUse /pair to add one.`);
        }

        let text = `╭═══ YOUR SESSIONS ═══⊷\n┃\n`;
        for (const num of sessions) {
            text += `┃  📱 +${num}\n┃\n`;
        }
        text += `┃  Total: ${sessions.length}/${MAX_SESSIONS}\n╰══════════════════════⊷`;

        const buttons = sessions.map(num => ([
            { text: `🗑️ Delete +${num}`, callback_data: `del_${num}` }
        ]));

        bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
    });

    // ── /status ──
    bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        const user   = getUser(chatId);

        if (!user?.sessions?.length) {
            return bot.sendMessage(chatId, `❌ No active sessions.\nUse /pair to connect.`);
        }

        for (const num of user.sessions) {
            try {
                const r = await axios.get(`${API_BASE}/status/${num}`, { timeout: 5000 });
                const s = r.data.status;
                const label =
                    s === 'connected'    ? '✅ *Connected* — Active!' :
                    s === 'pairing'      ? '⏳ *Pairing* — Enter code...' :
                    s === 'reconnecting' ? '🔄 *Reconnecting*...' :
                    '❌ *Offline*';
                bot.sendMessage(chatId, `📊 *+${num}*\n${label}`, { parse_mode: 'Markdown' });
            } catch {
                bot.sendMessage(chatId, `📊 *+${num}*\n❌ Offline`, { parse_mode: 'Markdown' });
            }
        }
    });

    // ── /stop ──
    bot.onText(/\/stop/, async (msg) => {
        const chatId = msg.chat.id;
        const user   = getUser(chatId);

        if (!user?.sessions?.length) {
            return bot.sendMessage(chatId, `❌ No active sessions.`);
        }

        for (const num of user.sessions) {
            try {
                await axios.post(`${API_BASE}/disconnect`, { phone: num }, { timeout: 8000 });
            } catch {}
        }

        setUser(chatId, { sessions: [] });
        bot.sendMessage(chatId, `✅ All sessions stopped!\nSend /pair to reconnect.`);
    });

    // ── CALLBACKS ──
    bot.on('callback_query', async (query) => {
        const chatId    = query.message.chat.id;
        const userId    = query.from.id;
        const data      = query.data;
        const firstName = query.from.first_name || 'User';

        // ── VERIFY ──
        if (data === 'verify') {
            try { await bot.answerCallbackQuery(query.id, { text: '⏳ Checking...' }); } catch {}

            await bot.sendMessage(chatId, '⏳ Verifying your membership...');

            let inChannel = false;
            let inGroup   = false;

            try {
                const cm1 = await bot.getChatMember(TG_CHANNEL_ID, userId);
                inChannel = ['member', 'administrator', 'creator', 'restricted'].includes(cm1.status);
            } catch (e) { console.log('Channel check error:', e.message); }

            try {
                const cm2 = await bot.getChatMember(TG_GROUP_ID, userId);
                inGroup = ['member', 'administrator', 'creator', 'restricted'].includes(cm2.status);
            } catch (e) { console.log('Group check error:', e.message); }

            console.log(`User ${userId} | Channel: ${inChannel} | Group: ${inGroup}`);

            if (!inChannel || !inGroup) {
                let txt = `❌ *Verification Failed!*\n\n`;
                if (!inChannel) txt += `• Not joined the Channel\n`;
                if (!inGroup)   txt += `• Not joined the Group\n`;
                txt += `\nJoin both then click Verify again!`;

                return bot.sendMessage(chatId, txt, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '📢 Join Channel', url: TG_CHANNEL },
                                { text: '👥 Join Group',   url: TG_GROUP }
                            ],
                            [{ text: '✅ Try Again', callback_data: 'verify' }]
                        ]
                    }
                });
            }

            // ── VERIFIED ──
            setUser(userId, { verified: true, name: firstName, sessions: getUser(userId)?.sessions || [] });
            const sessions = getUser(userId)?.sessions || [];

            const caption =
                `╭═════*${BOT_NAME}*═════⊷\n` +
                `┃\n` +
                `┃  ✅ *Verified!*\n` +
                `┃  Welcome, *${firstName}*!\n` +
                `┃\n` +
                `┃ ━━━ HOW TO USE ━━━\n` +
                `┃\n` +
                `┃  📌 *Pair your WhatsApp:*\n` +
                `┃  /pair 234XXXXXXXXXX\n` +
                `┃\n` +
                `┃  🗑️ *Delete your bot:*\n` +
                `┃  /delpair 234XXXXXXXXXX\n` +
                `┃\n` +
                `┃  📋 Sessions: ${sessions.length}/${MAX_SESSIONS}\n` +
                `┃  ⚠️ Max ${MAX_SESSIONS} numbers only\n` +
                `┃\n` +
                `╰══════════════════════⊷`;

            return sendLogo(chatId, caption, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📋 My Sessions', callback_data: 'mysessions' }],
                        [{ text: '❓ Help',         callback_data: 'help'       }]
                    ]
                }
            });
        }

        // ── MY SESSIONS ──
        if (data === 'mysessions') {
            try { await bot.answerCallbackQuery(query.id); } catch {}
            const user = getUser(userId);
            if (!user?.verified) return bot.sendMessage(chatId, '❌ Please /start and verify first.');
            const sessions = user?.sessions || [];
            if (!sessions.length) return bot.sendMessage(chatId, `📋 No sessions.\nUse /pair to add one.`);
            let text = `╭═══ YOUR SESSIONS ═══⊷\n┃\n`;
            for (const num of sessions) text += `┃  📱 +${num}\n┃\n`;
            text += `┃  Total: ${sessions.length}/${MAX_SESSIONS}\n╰══════════════════════⊷`;
            const buttons = sessions.map(num => ([{ text: `🗑️ Delete +${num}`, callback_data: `del_${num}` }]));
            return bot.sendMessage(chatId, text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
        }

        // ── DELETE SESSION ──
        if (data.startsWith('del_')) {
            try { await bot.answerCallbackQuery(query.id); } catch {}
            const num  = data.replace('del_', '');
            const user = getUser(userId);
            if (!user?.sessions?.includes(num)) return bot.sendMessage(chatId, `❌ Session not found.`);
            try { await axios.post(`${API_BASE}/disconnect`, { phone: num }, { timeout: 8000 }); } catch {}
            setUser(userId, { sessions: (user.sessions || []).filter(s => s !== num) });
            return bot.sendMessage(chatId, `✅ Session *+${num}* deleted!`, { parse_mode: 'Markdown' });
        }

        // ── HELP ──
        if (data === 'help') {
            try { await bot.answerCallbackQuery(query.id); } catch {}
            return bot.sendMessage(chatId,
                `╭═════ HELP ═════⊷\n` +
                `┃\n` +
                `┃  /start - Start & verify\n` +
                `┃  /pair +number - Pair WhatsApp\n` +
                `┃  /delpair +number - Delete bot\n` +
                `┃  /mysessions - View sessions\n` +
                `┃  /status - Bot status\n` +
                `┃  /stop - Stop all bots\n` +
                `┃\n` +
                `┃  ⚠️ Max ${MAX_SESSIONS} numbers only\n` +
                `┃\n` +
                `╰══════════════════════⊷`,
                { parse_mode: 'Markdown' }
            );
        }
    });

    // ── Handle plain text (phone number input) ──
    bot.on('message', async (msg) => {
        if (!msg.text || msg.text.startsWith('/')) return;
        const chatId = msg.chat.id;
        const user   = getUser(chatId);
        if (user?.verified && /^\d{7,15}$/.test(msg.text.trim())) {
            await processPairing(chatId, msg.text.trim());
        }
    });

    bot.on('polling_error', (err) => {
        if (!err.message?.includes('ETELEGRAM') && !err.message?.includes('terminated')) {
            console.error('[Telegram] Polling error:', err.message);
        }
    });

    console.log(`⚡ ${BOT_NAME} Telegram bot started!`);
    return bot;
}

// ── PROCESS PAIRING ──
async function processPairing(chatId, phoneInput) {
    const phone = (phoneInput || '').replace(/[^0-9]/g, '');

    if (!phone || phone.length < 7 || phone.length > 15) {
        return bot.sendMessage(chatId,
            `❌ *Invalid number.*\n\nUse format without + or spaces.\n*Example:* \`2349067345425\``,
            { parse_mode: 'Markdown' }
        );
    }

    const user     = getUser(chatId);
    const sessions = user?.sessions || [];

    if (sessions.includes(phone)) {
        return bot.sendMessage(chatId,
            `⚠️ *+${phone}* is already paired!\nUse /mysessions to manage.`,
            { parse_mode: 'Markdown' }
        );
    }

    if (sessions.length >= MAX_SESSIONS) {
        return bot.sendMessage(chatId,
            `❌ Max *${MAX_SESSIONS}* sessions reached!\nDelete one first with /delpair +number`,
            { parse_mode: 'Markdown' }
        );
    }

    if (totalSessions() >= MAX_TOTAL) {
        return bot.sendMessage(chatId, `❌ Server full! Try again later.`);
    }

    const loadingMsg = await bot.sendMessage(chatId,
        `⏳ Generating pairing code for *+${phone}*...\n\nPlease wait...`,
        { parse_mode: 'Markdown' }
    );

    try {
        const r = await axios.post(`${API_BASE}/pair`, { phone }, { timeout: 35000 });

        if (r.data.status === 'already_connected') {
            await bot.editMessageText(
                `✅ *Already Connected!*\n\nYour bot for *+${phone}* is already running!\n\nSend *.menu* in WhatsApp to use commands.`,
                { chat_id: chatId, message_id: loadingMsg.message_id, parse_mode: 'Markdown' }
            );
            return;
        }

        const code = r.data.code;
        setUser(chatId, { sessions: [...sessions, phone] });

        try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch {}

        const caption =
            `╭═════*${BOT_NAME}*═════⊷\n` +
            `┃\n` +
            `┃  ✅ *Pairing Code Ready!*\n` +
            `┃\n` +
            `┃  📱 Number: *+${phone}*\n` +
            `┃\n` +
            `┃  🔑 Code:\n` +
            `┃  \`${code}\`\n` +
            `┃\n` +
            `┃ ━━━ HOW TO PAIR ━━━\n` +
            `┃\n` +
            `┃  1. Open WhatsApp\n` +
            `┃  2. Tap ⋮ Menu\n` +
            `┃  3. Tap Linked Devices\n` +
            `┃  4. Tap Link a Device\n` +
            `┃  5. Link with phone number\n` +
            `┃  6. Enter code above\n` +
            `┃\n` +
            `┃  ⏰ Expires in *5 minutes*!\n` +
            `┃  Enter it FAST!\n` +
            `┃\n` +
            `╰══════════════════════⊷`;

        await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });

        // Poll for connection
        let attempts = 0;
        const pollTimer = setInterval(async () => {
            attempts++;
            if (attempts > 20) { clearInterval(pollTimer); return; }
            try {
                const sr = await axios.get(`${API_BASE}/status/${phone}`, { timeout: 5000 });
                if (sr.data.status === 'connected') {
                    clearInterval(pollTimer);
                    await bot.sendMessage(chatId,
                        `╭═════*${BOT_NAME}*═════⊷\n` +
                        `┃\n` +
                        `┃  🟢 *Successfully Connected!*\n` +
                        `┃\n` +
                        `┃  📱 Number: *+${phone}*\n` +
                        `┃  ✅ Status: *LIVE*\n` +
                        `┃\n` +
                        `┃  Send *.menu* in WhatsApp\n` +
                        `┃  to see all commands!\n` +
                        `┃\n` +
                        `┃  _TUNZY-MD-MINI© — Always On_\n` +
                        `┃\n` +
                        `╰══════════════════════⊷`,
                        { parse_mode: 'Markdown' }
                    );
                }
            } catch {}
        }, 6000);

    } catch (err) {
        const errMsg = err.response?.data?.error || err.message || 'Unknown error';
        try { await bot.deleteMessage(chatId, loadingMsg.message_id); } catch {}
        bot.sendMessage(chatId,
            `❌ *Pairing Failed*\n\n${errMsg}\n\nTry again: /pair`,
            { parse_mode: 'Markdown' }
        );
    }
}

module.exports = { startTelegramBot };