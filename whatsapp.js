require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');

const SESSIONS_DIR = './sessions';
const OWNER_NUMBER = '2349067345425';
const OWNER_NAME = 'TUNZY SHOP';
const BOT_NAME = 'TUNZY-MD-MINI';
const PREFIX = '.';
const BOT_VERSION = '1.00';
const WA_CHANNEL_JID = '120363422591784062@newsletter';

const activeSessions = {};
const logger = pino({ level: 'silent' });

function getSessionStatus(number) {
  return !!activeSessions[number];
}

async function deleteWhatsAppSession(number) {
  if (activeSessions[number]) {
    try { activeSessions[number].sock.end(); } catch {}
    delete activeSessions[number];
  }
  await fs.remove(path.join(SESSIONS_DIR, number)).catch(() => {});
}

async function startWhatsAppSession(number, telegramUserId, tgBot) {
  if (activeSessions[number]) {
    try { activeSessions[number].sock.end(); } catch {}
    delete activeSessions[number];
  }

  const sessionPath = path.join(SESSIONS_DIR, number);
  await fs.remove(sessionPath).catch(() => {});
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['TUNZY-MD-MINI', 'Safari', '1.0.0'],
    markOnlineOnConnect: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
  });

  const pairingCode = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout! Please try again.'));
    }, 60000);

    setTimeout(async () => {
      try {
        const formattedNumber = number.replace(/[^0-9]/g, '');
        const code = await sock.requestPairingCode(formattedNumber);
        clearTimeout(timeout);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
        resolve(formatted);
      } catch (err) {
        clearTimeout(timeout);
        reject(new Error('Could not get code: ' + err.message));
      }
    }, 10000);
  });

  activeSessions[number] = { sock, startTime: Date.now(), telegramUserId };

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(`✅ Connected: +${number}`);
      if (tgBot && telegramUserId) {
        try {
          await tgBot.sendMessage(telegramUserId,
            `╭═════${BOT_NAME}═════⊷\n` +
            `┃\n` +
            `┃  🟢 *Bot Connected!*\n` +
            `┃\n` +
            `┃  📱 Number: +${number}\n` +
            `┃  ✅ Status: LIVE\n` +
            `┃\n` +
            `┃  Send .menu on WhatsApp\n` +
            `┃  to see all commands!\n` +
            `┃\n` +
            `╰══════════════════════⊷`
          );
        } catch (e) { console.log('TG notify error:', e.message); }
      }
      try {
        await sock.followNewsletter(WA_CHANNEL_JID);
        console.log(`📢 Joined WA channel: ${number}`);
      } catch (e) { console.log('Channel join error:', e.message); }
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`❌ Disconnected: ${number} | Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(() => startWhatsAppSession(number, telegramUserId, tgBot), 5000);
      } else {
        delete activeSessions[number];
        if (tgBot && telegramUserId) {
          try {
            await tgBot.sendMessage(telegramUserId,
              `⚠️ +${number} was logged out!\nUse /pair to reconnect.`
            );
          } catch {}
        }
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;
      await handleMessage(sock, msg, number);
    }
  });

  return pairingCode;
}

async function handleMessage(sock, msg, ownerNumber) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
    const senderNumber = sender?.replace(/[^0-9]/g, '');
    const isOwner = senderNumber === ownerNumber || senderNumber === OWNER_NUMBER;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption || '';

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    const session = activeSessions[ownerNumber];
    const uptimeMs = session ? Date.now() - session.startTime : 0;
    const h = Math.floor(uptimeMs / 3600000);
    const m = Math.floor((uptimeMs % 3600000) / 60000);
    const s = Math.floor((uptimeMs % 60000) / 1000);
    const uptimeStr = `${h}h ${m}m ${s}s`;

    // Count all commands for plugin count
    const cmdPath = path.join(__dirname, 'commands');
    let pluginCount = 0;
    if (fs.existsSync(cmdPath)) {
      const files = fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        try {
          const cmd = require(`${cmdPath}/${file}`);
          const cmds = Array.isArray(cmd.command) ? cmd.command : [cmd.command];
          pluginCount += cmds.length;
        } catch {}
      }
    }

    const ctx = {
      sock, msg, from, sender, senderNumber,
      isOwner, isGroup, args, command,
      uptimeStr, pluginCount,
      BOT_NAME, OWNER_NAME, BOT_VERSION, PREFIX,
      reply: (text) => sock.sendMessage(from, { text }, { quoted: msg })
    };

    if (fs.existsSync(cmdPath)) {
      const files = fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        delete require.cache[require.resolve(`${cmdPath}/${file}`)];
        const cmd = require(`${cmdPath}/${file}`);
        const cmds = Array.isArray(cmd.command) ? cmd.command : [cmd.command];
        if (cmds.includes(command)) {
          return await cmd.execute(ctx);
        }
      }
    }
  } catch (err) {
    console.error('Handler error:', err.message);
  }
}

module.exports = { startWhatsAppSession, deleteWhatsAppSession, getSessionStatus };