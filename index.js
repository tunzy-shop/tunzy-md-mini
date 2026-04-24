require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const { startWhatsAppSession, stopWhatsAppSession, deleteWhatsAppSession, getSessionStatus } = require('./whatsapp');

// ── INIT ──
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const TG_CHANNEL = process.env.TG_CHANNEL;
const TG_GROUP = process.env.TG_GROUP;
const TG_CHANNEL_ID = process.env.TG_CHANNEL_ID;
const TG_GROUP_ID = process.env.TG_GROUP_ID;
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS_PER_USER) || 2;
const MAX_TOTAL = parseInt(process.env.MAX_TOTAL_SESSIONS) || 300;
const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions';
const OWNER_NAME = process.env.OWNER_NAME;
const BOT_NAME = process.env.BOT_NAME;
const BOT_PIC = path.join(__dirname, 'botpic.jpeg');

// ── USER DATA STORE ──
// Format: { userId: { name, verified, sessions: ['+2348...', '+2349...'], state } }
const usersFile = path.join(__dirname, 'data', 'users.json');
fs.ensureDirSync(path.join(__dirname, 'data'));
fs.ensureDirSync(SESSIONS_DIR);

function loadUsers() {
  try { return fs.readJsonSync(usersFile); } catch { return {}; }
}
function saveUsers(data) {
  fs.writeJsonSync(usersFile, data, { spaces: 2 });
}
function getUser(userId) {
  const users = loadUsers();
  return users[userId] || null;
}
function setUser(userId, data) {
  const users = loadUsers();
  users[userId] = { ...users[userId], ...data };
  saveUsers(users);
}
function totalSessions() {
  const users = loadUsers();
  let count = 0;
  for (const u of Object.values(users)) count += (u.sessions || []).length;
  return count;
}

// ── PENDING PAIR STATE ──
// Track users currently in pairing process
const pendingPair = {}; // { userId: true }

// ── CHECK MEMBER ──
async function isMember(userId, chatId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch {
    return false;
  }
}

// ── SEND BOT PIC ──
async function sendBotPic(chatId, caption, opts = {}) {
  if (fs.existsSync(BOT_PIC)) {
    return bot.sendPhoto(chatId, BOT_PIC, { caption, parse_mode: 'HTML', ...opts });
  } else {
    return bot.sendMessage(chatId, caption, { parse_mode: 'HTML', ...opts });
  }
}

// ─────────────────────────────────────────
// ── /start COMMAND ──
// ─────────────────────────────────────────
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'User';

  const caption =
    `╭═════${BOT_NAME}═════⊷\n` +
    `┃\n` +
    `┃  👋 Welcome, <b>${firstName}</b>!\n` +
    `┃\n` +
    `┃  I am <b>${BOT_NAME}</b>\n` +
    `┃  Owner: <b>${OWNER_NAME}</b>\n` +
    `┃\n` +
    `┃  To continue, please:\n` +
    `┃  1️⃣ Join our Channel\n` +
    `┃  2️⃣ Join our Group\n` +
    `┃  3️⃣ Click ✅ Verify\n` +
    `┃\n` +
    `╰══════════════════════⊷`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📢 Join Channel', url: TG_CHANNEL },
        { text: '👥 Join Group', url: TG_GROUP }
      ],
      [
        { text: '✅ Verify Membership', callback_data: 'verify' }
      ]
    ]
  };

  await sendBotPic(userId, caption, { reply_markup: keyboard });
});

// ─────────────────────────────────────────
// ── VERIFY CALLBACK ──
// ─────────────────────────────────────────
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const data = query.data;
  const firstName = query.from.first_name || 'User';

  // ── VERIFY ──
  if (data === 'verify') {
    await bot.answerCallbackQuery(query.id, { text: '⏳ Checking membership...' });

    let inChannel = false;
    let inGroup = false;

    try { inChannel = await isMember(userId, TG_CHANNEL_ID); } catch {}
    try { inGroup = await isMember(userId, TG_GROUP_ID); } catch {}

    if (!inChannel || !inGroup) {
      let msg = `❌ <b>Verification Failed!</b>\n\n`;
      if (!inChannel) msg += `• You have NOT joined the Channel\n`;
      if (!inGroup) msg += `• You have NOT joined the Group\n`;
      msg += `\nPlease join both and try again.`;

      return bot.sendMessage(userId, msg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📢 Join Channel', url: TG_CHANNEL },
              { text: '👥 Join Group', url: TG_GROUP }
            ],
            [{ text: '✅ Try Again', callback_data: 'verify' }]
          ]
        }
      });
    }

    // ── VERIFIED ──
    setUser(userId, { verified: true, name: firstName });

    const user = getUser(userId);
    const sessions = user?.sessions || [];

    const caption =
      `╭═════${BOT_NAME}═════⊷\n` +
      `┃\n` +
      `┃  ✅ <b>Verified Successfully!</b>\n` +
      `┃  Welcome, <b>${firstName}</b>!\n` +
      `┃\n` +
      `┃ ━━━━━ HOW TO USE ━━━━━\n` +
      `┃\n` +
      `┃  📌 <b>Pair your WhatsApp:</b>\n` +
      `┃  /pair +234XXXXXXXXXX\n` +
      `┃  (Use your full number with +)\n` +
      `┃\n` +
      `┃  🗑️ <b>Delete your bot:</b>\n` +
      `┃  /delpair +234XXXXXXXXXX\n` +
      `┃\n` +
      `┃  📋 <b>Your sessions:</b> ${sessions.length}/${MAX_SESSIONS}\n` +
      `┃\n` +
      `┃  ⚠️ Max ${MAX_SESSIONS} numbers per user\n` +
      `┃\n` +
      `╰══════════════════════⊷`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 My Sessions', callback_data: 'mysessions' }],
        [{ text: '❓ Help', callback_data: 'help' }]
      ]
    };

    return sendBotPic(userId, caption, { reply_markup: keyboard });
  }

  // ── MY SESSIONS ──
  if (data === 'mysessions') {
    await bot.answerCallbackQuery(query.id);
    const user = getUser(userId);
    if (!user?.verified) {
      return bot.sendMessage(userId, '❌ Please /start and verify first.');
    }
    const sessions = user?.sessions || [];
    if (sessions.length === 0) {
      return bot.sendMessage(userId,
        `📋 <b>Your Sessions</b>\n\nYou have no active sessions.\nUse /pair +234XXXXXXXXXX to add one.`,
        { parse_mode: 'HTML' }
      );
    }

    let text = `╭═══ YOUR SESSIONS ═══⊷\n┃\n`;
    for (const num of sessions) {
      const status = getSessionStatus(num) ? '🟢 Online' : '🔴 Offline';
      text += `┃  📱 ${num}\n┃  Status: ${status}\n┃\n`;
    }
    text += `┃  Total: ${sessions.length}/${MAX_SESSIONS}\n╰══════════════════════⊷`;

    const inlineButtons = sessions.map(num => ([
      { text: `🗑️ Delete ${num}`, callback_data: `del_${num}` }
    ]));

    return bot.sendMessage(userId, text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: inlineButtons }
    });
  }

  // ── DELETE SESSION FROM BUTTON ──
  if (data.startsWith('del_')) {
    await bot.answerCallbackQuery(query.id);
    const num = data.replace('del_', '');
    const user = getUser(userId);
    if (!user?.sessions?.includes(num)) {
      return bot.sendMessage(userId, `❌ Session ${num} not found.`);
    }
    await deleteWhatsAppSession(num);
    const sessions = (user.sessions || []).filter(s => s !== num);
    setUser(userId, { sessions });
    return bot.sendMessage(userId,
      `✅ Session <b>${num}</b> deleted successfully!`,
      { parse_mode: 'HTML' }
    );
  }

  // ── HELP ──
  if (data === 'help') {
    await bot.answerCallbackQuery(query.id);
    const helpText =
      `╭═════ HELP ═════⊷\n` +
      `┃\n` +
      `┃  /start - Start the bot\n` +
      `┃  /pair +2349XXXXXXXX - Pair WhatsApp\n` +
      `┃  /delpair +2349XXXXXXXX - Delete bot\n` +
      `┃  /mysessions - View your sessions\n` +
      `┃  /status - Check bot status\n` +
      `┃\n` +
      `┃  ⚠️ Max 2 numbers per user\n` +
      `┃  ⚠️ Use full number with +\n` +
      `┃\n` +
      `┃  📢 Channel: ${TG_CHANNEL}\n` +
      `┃  👥 Group: ${TG_GROUP}\n` +
      `┃\n` +
      `╰══════════════════════⊷`;
    return bot.sendMessage(userId, helpText, { parse_mode: 'HTML' });
  }
});

// ─────────────────────────────────────────
// ── /pair COMMAND ──
// ─────────────────────────────────────────
bot.onText(/\/pair (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const rawNumber = match[1].trim();

  // Check verified
  const user = getUser(userId);
  if (!user?.verified) {
    return bot.sendMessage(userId,
      `❌ You need to verify first!\nUse /start to begin.`
    );
  }

  // Clean number
  const number = rawNumber.replace(/[^0-9]/g, '');
  if (number.length < 10 || number.length > 15) {
    return bot.sendMessage(userId,
      `❌ Invalid number format!\n\nUse: /pair +2349XXXXXXXX\nExample: /pair +2349067345425`
    );
  }

  // Check session limit per user
  const sessions = user.sessions || [];
  if (sessions.includes(number)) {
    return bot.sendMessage(userId,
      `⚠️ This number <b>${rawNumber}</b> is already paired!\n\nUse /mysessions to manage.`,
      { parse_mode: 'HTML' }
    );
  }
  if (sessions.length >= MAX_SESSIONS) {
    return bot.sendMessage(userId,
      `❌ <b>Session Limit Reached!</b>\n\nYou can only pair <b>${MAX_SESSIONS}</b> numbers.\nDelete one first with /delpair +number`,
      { parse_mode: 'HTML' }
    );
  }

  // Check global limit
  if (totalSessions() >= MAX_TOTAL) {
    return bot.sendMessage(userId,
      `❌ <b>Server Full!</b>\n\nThe bot has reached its maximum capacity of ${MAX_TOTAL} sessions.\nPlease try again later.`,
      { parse_mode: 'HTML' }
    );
  }

  // Prevent double-pairing
  if (pendingPair[userId]) {
    return bot.sendMessage(userId, `⏳ You already have a pairing in progress. Please wait.`);
  }
  pendingPair[userId] = true;

  const loadingMsg = await bot.sendMessage(userId,
    `⏳ <b>Connecting to WhatsApp...</b>\n\nPlease wait while we generate your pairing code for:\n📱 <b>+${number}</b>`,
    { parse_mode: 'HTML' }
  );

  try {
    const pairingCode = await startWhatsAppSession(number, userId, bot);

    // Save session
    const updatedSessions = [...sessions, number];
    setUser(userId, { sessions: updatedSessions });
    delete pendingPair[userId];

    await bot.deleteMessage(userId, loadingMsg.message_id).catch(() => {});

    const codeMsg =
      `╭═════${BOT_NAME}═════⊷\n` +
      `┃\n` +
      `┃  ✅ <b>Pairing Code Generated!</b>\n` +
      `┃\n` +
      `┃  📱 Number: <b>+${number}</b>\n` +
      `┃\n` +
      `┃  🔑 Your Code:\n` +
      `┃\n` +
      `┃  <code>${pairingCode}</code>\n` +
      `┃\n` +
      `┃ ━━━━━ HOW TO PAIR ━━━━━\n` +
      `┃\n` +
      `┃  1. Open WhatsApp on your phone\n` +
      `┃  2. Tap ⋮ (3 dots) → Linked Devices\n` +
      `┃  3. Tap "Link a Device"\n` +
      `┃  4. Tap "Link with phone number"\n` +
      `┃  5. Enter the code above\n` +
      `┃\n` +
      `┃  ⏰ Code expires in 2 minutes!\n` +
      `┃\n` +
      `╰══════════════════════⊷`;

    await bot.sendMessage(userId, codeMsg, { parse_mode: 'HTML' });

  } catch (err) {
    delete pendingPair[userId];
    await bot.deleteMessage(userId, loadingMsg.message_id).catch(() => {});
    console.error('Pairing error:', err);
    return bot.sendMessage(userId,
      `❌ <b>Pairing Failed!</b>\n\nError: ${err.message || 'Unknown error'}\n\nPlease try again.`,
      { parse_mode: 'HTML' }
    );
  }
});

// No number provided
bot.onText(/^\/pair$/, async (msg) => {
  bot.sendMessage(msg.from.id,
    `❌ Please provide a number!\n\nUsage: /pair +2349XXXXXXXX\nExample: /pair +2349067345425`
  );
});

// ─────────────────────────────────────────
// ── /delpair COMMAND ──
// ─────────────────────────────────────────
bot.onText(/\/delpair (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const rawNumber = match[1].trim();
  const number = rawNumber.replace(/[^0-9]/g, '');

  const user = getUser(userId);
  if (!user?.verified) {
    return bot.sendMessage(userId, `❌ You need to verify first! Use /start`);
  }

  const sessions = user.sessions || [];
  if (!sessions.includes(number)) {
    return bot.sendMessage(userId,
      `❌ Number <b>+${number}</b> is not in your sessions!\n\nUse /mysessions to see your active sessions.`,
      { parse_mode: 'HTML' }
    );
  }

  const loadingMsg = await bot.sendMessage(userId,
    `⏳ <b>Deleting session for +${number}...</b>`,
    { parse_mode: 'HTML' }
  );

  try {
    await deleteWhatsAppSession(number);
    const updatedSessions = sessions.filter(s => s !== number);
    setUser(userId, { sessions: updatedSessions });

    await bot.deleteMessage(userId, loadingMsg.message_id).catch(() => {});
    await bot.sendMessage(userId,
      `╭═════${BOT_NAME}═════⊷\n` +
      `┃\n` +
      `┃  🗑️ <b>Session Deleted!</b>\n` +
      `┃\n` +
      `┃  📱 Number: <b>+${number}</b>\n` +
      `┃  Status: <b>Removed</b>\n` +
      `┃\n` +
      `┃  Remaining: ${updatedSessions.length}/${MAX_SESSIONS}\n` +
      `┃\n` +
      `╰══════════════════════⊷`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    await bot.deleteMessage(userId, loadingMsg.message_id).catch(() => {});
    bot.sendMessage(userId, `❌ Failed to delete: ${err.message}`);
  }
});

bot.onText(/^\/delpair$/, (msg) => {
  bot.sendMessage(msg.from.id,
    `❌ Please provide a number!\n\nUsage: /delpair +2349XXXXXXXX`
  );
});

// ─────────────────────────────────────────
// ── /mysessions COMMAND ──
// ─────────────────────────────────────────
bot.onText(/\/mysessions/, async (msg) => {
  const userId = msg.from.id;
  const user = getUser(userId);

  if (!user?.verified) {
    return bot.sendMessage(userId, `❌ Please /start and verify first.`);
  }

  const sessions = user.sessions || [];
  if (sessions.length === 0) {
    return bot.sendMessage(userId,
      `📋 <b>Your Sessions</b>\n\nNo active sessions.\nUse /pair +234XXXXXXXXXX to add one.`,
      { parse_mode: 'HTML' }
    );
  }

  let text = `╭═══ YOUR SESSIONS ═══⊷\n┃\n`;
  for (const num of sessions) {
    const online = getSessionStatus(num);
    text += `┃  📱 +${num}\n┃  ${online ? '🟢 Online' : '🔴 Offline'}\n┃\n`;
  }
  text += `┃  Total: ${sessions.length}/${MAX_SESSIONS}\n╰══════════════════════⊷`;

  const buttons = sessions.map(num => ([
    { text: `🗑️ Delete +${num}`, callback_data: `del_${num}` }
  ]));

  bot.sendMessage(userId, text, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons }
  });
});

// ─────────────────────────────────────────
// ── /status COMMAND ──
// ─────────────────────────────────────────
bot.onText(/\/status/, async (msg) => {
  const userId = msg.from.id;
  const total = totalSessions();
  const uptime = process.uptime();
  const hrs = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = Math.floor(uptime % 60);

  bot.sendMessage(userId,
    `╭═════ BOT STATUS ═════⊷\n` +
    `┃\n` +
    `┃  🤖 Bot: <b>${BOT_NAME}</b>\n` +
    `┃  👑 Owner: <b>${OWNER_NAME}</b>\n` +
    `┃  📊 Sessions: <b>${total}/${MAX_TOTAL}</b>\n` +
    `┃  ⏰ Uptime: <b>${hrs}h ${mins}m ${secs}s</b>\n` +
    `┃  🟢 Status: <b>Online</b>\n` +
    `┃\n` +
    `╰══════════════════════⊷`,
    { parse_mode: 'HTML' }
  );
});

// ─────────────────────────────────────────
// ── /help COMMAND ──
// ─────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.from.id,
    `╭═════ HELP ═════⊷\n` +
    `┃\n` +
    `┃  /start - Start & verify\n` +
    `┃  /pair +number - Pair WhatsApp bot\n` +
    `┃  /delpair +number - Delete bot\n` +
    `┃  /mysessions - View sessions\n` +
    `┃  /status - Bot status\n` +
    `┃\n` +
    `┃  📢 Channel: ${TG_CHANNEL}\n` +
    `┃  👥 Group: ${TG_GROUP}\n` +
    `┃\n` +
    `╰══════════════════════⊷`,
    { parse_mode: 'HTML' }
  );
});

// ─────────────────────────────────────────
// ── POLLING ERROR HANDLER ──
// ─────────────────────────────────────────
bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log(`✅ ${BOT_NAME} Telegram bot started!`);
console.log(`📢 Channel: ${TG_CHANNEL}`);
console.log(`👥 Group: ${TG_GROUP}`);
