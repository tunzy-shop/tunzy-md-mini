require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const TG_CHANNEL = 'https://t.me/tunzy_md';
const TG_GROUP = 'https://t.me/tunzymd_tech';
const TG_CHANNEL_ID = '@tunzy_md';
const TG_GROUP_ID = '@tunzymd_tech';
const MAX_SESSIONS = 2;
const MAX_TOTAL = 300;
const SESSIONS_DIR = './sessions';
const OWNER_NAME = 'TUNZY SHOP';
const BOT_NAME = 'TUNZY-MD-MINI';
const BOT_PIC = './botpic.jpeg';

const usersFile = './data/users.json';
fs.ensureDirSync('./data');
fs.ensureDirSync(SESSIONS_DIR);

function loadUsers() {
  try { return fs.readJsonSync(usersFile); } catch { return {}; }
}
function saveUsers(data) {
  fs.writeJsonSync(usersFile, data, { spaces: 2 });
}
function getUser(userId) {
  const users = loadUsers();
  return users[String(userId)] || null;
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

const pendingPair = {};

async function isMember(userId, chatId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    console.log(`Check ${userId} in ${chatId}: ${member.status}`);
    return ['member', 'administrator', 'creator', 'restricted'].includes(member.status);
  } catch (err) {
    console.log(`Membership check failed for ${chatId}:`, err.message);
    return true;
  }
}

async function sendBotPic(chatId, caption, opts = {}) {
  try {
    if (fs.existsSync(BOT_PIC)) {
      return await bot.sendPhoto(chatId, BOT_PIC, { caption, parse_mode: 'HTML', ...opts });
    }
  } catch {}
  return await bot.sendMessage(chatId, caption, { parse_mode: 'HTML', ...opts });
}

// ── /start ──
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
    `┃  To continue:\n` +
    `┃  1️⃣ Join our Channel\n` +
    `┃  2️⃣ Join our Group\n` +
    `┃  3️⃣ Click ✅ Verify\n` +
    `┃\n` +
    `╰══════════════════════⊷`;

  await sendBotPic(userId, caption, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📢 Join Channel', url: TG_CHANNEL },
          { text: '👥 Join Group', url: TG_GROUP }
        ],
        [{ text: '✅ Verify Membership', callback_data: 'verify' }]
      ]
    }
  });
});

// ── CALLBACKS ──
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const data = query.data;
  const firstName = query.from.first_name || 'User';

  // ── VERIFY ──
  if (data === 'verify') {
    try { await bot.answerCallbackQuery(query.id, { text: '⏳ Checking...' }); } catch {}

    const checkMsg = await bot.sendMessage(userId, '⏳ Checking your membership...');

    const inChannel = await isMember(userId, TG_CHANNEL_ID);
    const inGroup = await isMember(userId, TG_GROUP_ID);

    console.log(`User ${userId} | Channel: ${inChannel} | Group: ${inGroup}`);

    try { await bot.deleteMessage(userId, checkMsg.message_id); } catch {}

    if (!inChannel || !inGroup) {
      let txt = `❌ <b>Verification Failed!</b>\n\n`;
      if (!inChannel) txt += `• You have NOT joined the Channel\n`;
      if (!inGroup) txt += `• You have NOT joined the Group\n`;
      txt += `\nPlease join both then click Verify again.`;

      return bot.sendMessage(userId, txt, {
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
    const sessions = getUser(userId)?.sessions || [];

    const caption =
      `╭═════${BOT_NAME}═════⊷\n` +
      `┃\n` +
      `┃  ✅ <b>Verified!</b>\n` +
      `┃  Welcome, <b>${firstName}</b>!\n` +
      `┃\n` +
      `┃ ━━━ HOW TO USE ━━━\n` +
      `┃\n` +
      `┃  📌 <b>Pair your WhatsApp:</b>\n` +
      `┃  /pair +234XXXXXXXXXX\n` +
      `┃\n` +
      `┃  🗑️ <b>Delete your bot:</b>\n` +
      `┃  /delpair +234XXXXXXXXXX\n` +
      `┃\n` +
      `┃  📋 Sessions: ${sessions.length}/${MAX_SESSIONS}\n` +
      `┃  ⚠️ Max ${MAX_SESSIONS} numbers only\n` +
      `┃\n` +
      `╰══════════════════════⊷`;

    return sendBotPic(userId, caption, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 My Sessions', callback_data: 'mysessions' }],
          [{ text: '❓ Help', callback_data: 'help' }]
        ]
      }
    });
  }

  // ── MY SESSIONS ──
  if (data === 'mysessions') {
    try { await bot.answerCallbackQuery(query.id); } catch {}
    const user = getUser(userId);
    if (!user?.verified) {
      return bot.sendMessage(userId, '❌ Please /start and verify first.');
    }
    const sessions = user?.sessions || [];
    if (!sessions.length) {
      return bot.sendMessage(userId,
        `📋 <b>Your Sessions</b>\n\nNo active sessions.\nUse /pair +234XXXXXXXXXX to add one.`,
        { parse_mode: 'HTML' }
      );
    }
    let text = `╭═══ YOUR SESSIONS ═══⊷\n┃\n`;
    for (const num of sessions) text += `┃  📱 +${num}\n┃\n`;
    text += `┃  Total: ${sessions.length}/${MAX_SESSIONS}\n╰══════════════════════⊷`;
    const buttons = sessions.map(num => ([{ text: `🗑️ Delete +${num}`, callback_data: `del_${num}` }]));
    return bot.sendMessage(userId, text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // ── DELETE SESSION ──
  if (data.startsWith('del_')) {
    try { await bot.answerCallbackQuery(query.id); } catch {}
    const num = data.replace('del_', '');
    const user = getUser(userId);
    if (!user?.sessions?.includes(num)) {
      return bot.sendMessage(userId, `❌ Session not found.`);
    }
    try {
      const { deleteWhatsAppSession } = require('./whatsapp');
      await deleteWhatsAppSession(num);
    } catch {}
    setUser(userId, { sessions: (user.sessions || []).filter(s => s !== num) });
    return bot.sendMessage(userId,
      `✅ Session <b>+${num}</b> deleted!`,
      { parse_mode: 'HTML' }
    );
  }

  // ── HELP ──
  if (data === 'help') {
    try { await bot.answerCallbackQuery(query.id); } catch {}
    return bot.sendMessage(userId,
      `╭═════ HELP ═════⊷\n` +
      `┃\n` +
      `┃  /start - Start the bot\n` +
      `┃  /pair +number - Pair WhatsApp\n` +
      `┃  /delpair +number - Delete bot\n` +
      `┃  /mysessions - View sessions\n` +
      `┃  /status - Bot status\n` +
      `┃\n` +
      `┃  ⚠️ Max 2 numbers per user\n` +
      `┃\n` +
      `┃  📢 ${TG_CHANNEL}\n` +
      `┃  👥 ${TG_GROUP}\n` +
      `┃\n` +
      `╰══════════════════════⊷`,
      { parse_mode: 'HTML' }
    );
  }
});

// ── /pair ──
bot.onText(/\/pair (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const rawNumber = match[1].trim();
  const user = getUser(userId);

  if (!user?.verified) {
    return bot.sendMessage(userId, `❌ Please /start and verify first!`);
  }

  const number = rawNumber.replace(/[^0-9]/g, '');
  if (number.length < 10 || number.length > 15) {
    return bot.sendMessage(userId,
      `❌ Invalid number!\n\nUsage: /pair +2349XXXXXXXX\nExample: /pair +2349067345425`
    );
  }

  const sessions = user.sessions || [];
  if (sessions.includes(number)) {
    return bot.sendMessage(userId,
      `⚠️ <b>+${number}</b> is already paired!\nUse /mysessions to manage.`,
      { parse_mode: 'HTML' }
    );
  }
  if (sessions.length >= MAX_SESSIONS) {
    return bot.sendMessage(userId,
      `❌ Max ${MAX_SESSIONS} sessions reached!\nDelete one first with /delpair +number`
    );
  }
  if (totalSessions() >= MAX_TOTAL) {
    return bot.sendMessage(userId, `❌ Server full! Try again later.`);
  }
  if (pendingPair[userId]) {
    return bot.sendMessage(userId, `⏳ Pairing in progress. Please wait.`);
  }

  pendingPair[userId] = true;
  const loadingMsg = await bot.sendMessage(userId,
    `⏳ <b>Connecting to WhatsApp...</b>\n\nGenerating pairing code for:\n📱 <b>+${number}</b>\n\nPlease wait 15 seconds...`,
    { parse_mode: 'HTML' }
  );

  try {
    const { startWhatsAppSession } = require('./whatsapp');
    const pairingCode = await startWhatsAppSession(number, userId, bot);
    setUser(userId, { sessions: [...sessions, number] });
    delete pendingPair[userId];
    try { await bot.deleteMessage(userId, loadingMsg.message_id); } catch {}

    await bot.sendMessage(userId,
      `╭═════${BOT_NAME}═════⊷\n` +
      `┃\n` +
      `┃  ✅ <b>Pairing Code Ready!</b>\n` +
      `┃\n` +
      `┃  📱 Number: <b>+${number}</b>\n` +
      `┃\n` +
      `┃  🔑 Your Code:\n` +
      `┃  <code>${pairingCode}</code>\n` +
      `┃\n` +
      `┃ ━━━ HOW TO PAIR ━━━\n` +
      `┃\n` +
      `┃  1. Open WhatsApp\n` +
      `┃  2. Tap ⋮ Menu\n` +
      `┃  3. Tap Linked Devices\n` +
      `┃  4. Tap Link a Device\n` +
      `┃  5. Tap Link with phone number\n` +
      `┃  6. Enter the code above\n` +
      `┃\n` +
      `┃  ⏰ Code expires in 60 secs!\n` +
      `┃  Enter it FAST!\n` +
      `┃\n` +
      `╰══════════════════════⊷`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    delete pendingPair[userId];
    try { await bot.deleteMessage(userId, loadingMsg.message_id); } catch {}
    console.error('Pair error:', err.message);
    await bot.sendMessage(userId,
      `❌ <b>Pairing Failed!</b>\n\n${err.message}\n\nPlease try again.`,
      { parse_mode: 'HTML' }
    );
  }
});

bot.onText(/^\/pair$/, (msg) => {
  bot.sendMessage(msg.from.id, `❌ Usage: /pair +2349XXXXXXXX`);
});

// ── /delpair ──
bot.onText(/\/delpair (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const number = match[1].trim().replace(/[^0-9]/g, '');
  const user = getUser(userId);

  if (!user?.verified) return bot.sendMessage(userId, `❌ Please /start and verify first!`);
  if (!user?.sessions?.includes(number)) {
    return bot.sendMessage(userId,
      `❌ +${number} not found in your sessions!\nUse /mysessions to check.`
    );
  }

  await bot.sendMessage(userId, `⏳ Deleting session for +${number}...`);
  try {
    const { deleteWhatsAppSession } = require('./whatsapp');
    await deleteWhatsAppSession(number);
  } catch {}
  setUser(userId, { sessions: (user.sessions || []).filter(s => s !== number) });
  await bot.sendMessage(userId,
    `✅ <b>+${number}</b> deleted successfully!`,
    { parse_mode: 'HTML' }
  );
});

bot.onText(/^\/delpair$/, (msg) => {
  bot.sendMessage(msg.from.id, `❌ Usage: /delpair +2349XXXXXXXX`);
});

// ── /mysessions ──
bot.onText(/\/mysessions/, async (msg) => {
  const userId = msg.from.id;
  const user = getUser(userId);
  if (!user?.verified) return bot.sendMessage(userId, `❌ Please /start and verify first!`);
  const sessions = user?.sessions || [];
  if (!sessions.length) {
    return bot.sendMessage(userId, `📋 No sessions.\nUse /pair +number to add one.`);
  }
  let text = `╭═══ YOUR SESSIONS ═══⊷\n┃\n`;
  for (const num of sessions) text += `┃  📱 +${num}\n┃\n`;
  text += `┃  Total: ${sessions.length}/${MAX_SESSIONS}\n╰══════════════════════⊷`;
  const buttons = sessions.map(num => ([{ text: `🗑️ Delete +${num}`, callback_data: `del_${num}` }]));
  bot.sendMessage(userId, text, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons }
  });
});

// ── /status ──
bot.onText(/\/status/, (msg) => {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  bot.sendMessage(msg.from.id,
    `╭═════ STATUS ═════⊷\n` +
    `┃\n` +
    `┃  🤖 <b>${BOT_NAME}</b>\n` +
    `┃  👑 Owner: <b>${OWNER_NAME}</b>\n` +
    `┃  📊 Sessions: <b>${totalSessions()}/${MAX_TOTAL}</b>\n` +
    `┃  ⏰ Uptime: <b>${h}h ${m}m ${s}s</b>\n` +
    `┃  🟢 Status: <b>Online</b>\n` +
    `┃\n` +
    `╰══════════════════════⊷`,
    { parse_mode: 'HTML' }
  );
});

// ── /help ──
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.from.id,
    `╭═════ HELP ═════⊷\n` +
    `┃\n` +
    `┃  /start - Start & verify\n` +
    `┃  /pair +number - Pair WhatsApp\n` +
    `┃  /delpair +number - Delete bot\n` +
    `┃  /mysessions - View sessions\n` +
    `┃  /status - Bot status\n` +
    `┃\n` +
    `┃  ⚠️ Max 2 numbers per user\n` +
    `┃\n` +
    `┃  📢 ${TG_CHANNEL}\n` +
    `┃  👥 ${TG_GROUP}\n` +
    `┃\n` +
    `╰══════════════════════⊷`,
    { parse_mode: 'HTML' }
  );
});

// ── ERROR HANDLER ──
bot.on('polling_error', (err) => {
  if (!err.message.includes('query is too old') &&
      !err.message.includes('ETELEGRAM') &&
      !err.message.includes('ECONNRESET')) {
    console.error('Polling error:', err.message);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
});

console.log(`✅ ${BOT_NAME} Telegram bot started!`);
console.log(`📢 Channel: ${TG_CHANNEL}`);
console.log(`👥 Group: ${TG_GROUP}`);