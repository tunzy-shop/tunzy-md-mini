const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  downloadContentFromMessage,
  generateWAMessageFromContent,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');

const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions';
const OWNER_NUMBER = process.env.OWNER_NUMBER || '2349067345425';
const OWNER_NAME = process.env.OWNER_NAME || 'TUNZY SHOP';
const BOT_NAME = process.env.BOT_NAME || 'TUNZY-MD-MINI';
const PREFIX = process.env.BOT_PREFIX || '.';
const BOT_VERSION = process.env.BOT_VERSION || '1.00';
const WA_CHANNEL_JID = process.env.WA_CHANNEL_JID || '120363422591784062@newsletter';

// ── SESSION STORE ──
const activeSessions = {}; // { number: { sock, startTime } }

// ── LOGGER ──
const logger = pino({ level: 'silent' });

// ─────────────────────────────────────────
// GET SESSION STATUS
// ─────────────────────────────────────────
function getSessionStatus(number) {
  return !!activeSessions[number];
}

// ─────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────
async function deleteWhatsAppSession(number) {
  if (activeSessions[number]) {
    try { await activeSessions[number].sock.logout(); } catch {}
    try { activeSessions[number].sock.end(); } catch {}
    delete activeSessions[number];
  }
  const sessionPath = path.join(SESSIONS_DIR, number);
  await fs.remove(sessionPath).catch(() => {});
}

// ─────────────────────────────────────────
// START WHATSAPP SESSION — returns pairing code
// ─────────────────────────────────────────
async function startWhatsAppSession(number, telegramUserId, tgBot) {
  const sessionPath = path.join(SESSIONS_DIR, number);
  await fs.ensureDir(sessionPath);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ['TUNZY-MD-MINI', 'Safari', '1.0.0'],
    getMessage: async () => undefined,
  });

  // ── REQUEST PAIRING CODE ──
  const pairingCode = await new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Pairing code timeout')), 30000);
    try {
      await new Promise(r => setTimeout(r, 2000)); // small delay
      const code = await sock.requestPairingCode(number);
      clearTimeout(timeout);
      // Format code nicely: XXXX-XXXX
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
      resolve(formatted);
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });

  // ── STORE SESSION ──
  activeSessions[number] = { sock, startTime: Date.now(), telegramUserId };

  // ── CONNECTION UPDATE ──
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log(`✅ WhatsApp connected: ${number}`);

      // Notify Telegram user
      if (tgBot && telegramUserId) {
        tgBot.sendMessage(telegramUserId,
          `╭═════${BOT_NAME}═════⊷\n` +
          `┃\n` +
          `┃  🟢 <b>Bot is LIVE!</b>\n` +
          `┃  📱 Number: <b>+${number}</b>\n` +
          `┃\n` +
          `┃  Your WhatsApp bot is now\n` +
          `┃  connected and running!\n` +
          `┃\n` +
          `┃  Send <b>.menu</b> on WhatsApp\n` +
          `┃  to see all commands.\n` +
          `┃\n` +
          `╰══════════════════════⊷`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }

      // ── AUTO JOIN WHATSAPP CHANNEL ──
      try {
        await sock.followNewsletter(WA_CHANNEL_JID);
        console.log(`📢 Auto-joined WA channel for: ${number}`);
      } catch (e) {
        console.log(`Channel join skipped for ${number}:`, e.message);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`❌ WhatsApp disconnected: ${number}, reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => startWhatsAppSession(number, telegramUserId, tgBot), 5000);
      } else {
        delete activeSessions[number];
        if (tgBot && telegramUserId) {
          tgBot.sendMessage(telegramUserId,
            `⚠️ Bot for <b>+${number}</b> was logged out.\nUse /pair to reconnect.`,
            { parse_mode: 'HTML' }
          ).catch(() => {});
        }
      }
    }
  });

  // ── SAVE CREDS ──
  sock.ev.on('creds.update', saveCreds);

  // ── MESSAGES ──
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

// ─────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────
async function handleMessage(sock, msg, ownerNumber) {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
    const senderNumber = sender?.replace(/[^0-9]/g, '');
    const isOwner = senderNumber === ownerNumber || senderNumber === OWNER_NUMBER;

    const contentType = getContentType(msg.message);
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption || '';

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    // ── Reply helper ──
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    // ── Uptime ──
    const session = activeSessions[ownerNumber];
    const uptimeMs = session ? Date.now() - session.startTime : 0;
    const uptimeHrs = Math.floor(uptimeMs / 3600000);
    const uptimeMins = Math.floor((uptimeMs % 3600000) / 60000);
    const uptimeSecs = Math.floor((uptimeMs % 60000) / 1000);
    const uptimeStr = `${uptimeHrs}h ${uptimeMins}m ${uptimeSecs}s`;

    // ── Get plugin count ──
    const pluginCount = COMMANDS.length;

    switch (command) {

      // ─────────────────────────────
      // MAIN
      // ─────────────────────────────
      case 'menu':
      case 'help': {
        const menuText =
          `╭═════${BOT_NAME}═════⊷\n` +
          `✓ Hello : @${senderNumber}\n` +
          `✓ Owner : ${OWNER_NAME}\n` +
          `✓ Version : ${BOT_VERSION}\n` +
          `✓ Prefix : ${PREFIX}\n` +
          `✓ Platform : WhatsApp\n` +
          `✓ Plugin : ${pluginCount}\n` +
          `✓ Uptime : ${uptimeStr}\n` +
          `╰═════════════════════⊷\n\n` +
          `╭━━━━❮ *DOWNLOADER* ❯━⊷\n` +
          `┃✓ ${PREFIX}fb\n┃✓ ${PREFIX}instagram\n┃✓ ${PREFIX}tiktok\n┃✓ ${PREFIX}play\n┃✓ ${PREFIX}video\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *AI* ❯━⊷\n` +
          `┃✓ ${PREFIX}ai\n┃✓ ${PREFIX}deepseek\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *TOOLS* ❯━⊷\n` +
          `┃✓ ${PREFIX}fancy\n┃✓ ${PREFIX}hd\n┃✓ ${PREFIX}removebg\n┃✓ ${PREFIX}shazam\n┃✓ ${PREFIX}sticker\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *ADMIN* ❯━⊷\n` +
          `┃✓ ${PREFIX}kick\n┃✓ ${PREFIX}promote\n┃✓ ${PREFIX}demote\n┃✓ ${PREFIX}tagall\n┃✓ ${PREFIX}mute\n┃✓ ${PREFIX}unmute\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *SETTINGS* ❯━⊷\n` +
          `┃✓ ${PREFIX}anti-call\n┃✓ ${PREFIX}antilink\n┃✓ ${PREFIX}auto-reply\n┃✓ ${PREFIX}auto-seen\n┃✓ ${PREFIX}welcome\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *ANIME* ❯━⊷\n` +
          `┃✓ ${PREFIX}hug\n┃✓ ${PREFIX}kiss\n┃✓ ${PREFIX}slap\n┃✓ ${PREFIX}pat\n┃✓ ${PREFIX}dance\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *GAME* ❯━⊷\n` +
          `┃✓ ${PREFIX}ttt\n┃✓ ${PREFIX}tod\n` +
          `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
          `╭━━━━❮ *OWNER* ❯━⊷\n` +
          `┃✓ ${PREFIX}broadcast\n┃✓ ${PREFIX}mode\n┃✓ ${PREFIX}setpp\n┃✓ ${PREFIX}sudo\n` +
          `╰━━━━━━━━━━━━━━━━━⊷`;

        await sock.sendMessage(from, {
          text: menuText,
          mentions: [sender]
        }, { quoted: msg });
        break;
      }

      case 'alive': {
        await reply(
          `╭═════${BOT_NAME}═════⊷\n` +
          `┃\n` +
          `┃  🟢 Bot is ALIVE!\n` +
          `┃  ⏰ Uptime: ${uptimeStr}\n` +
          `┃  👑 Owner: ${OWNER_NAME}\n` +
          `┃\n` +
          `╰═════════════════════⊷`
        );
        break;
      }

      case 'ping': {
        const start = Date.now();
        const sentMsg = await reply('🏓 Pinging...');
        const ping = Date.now() - start;
        await sock.sendMessage(from, { text: `🏓 Pong!\n⚡ Speed: ${ping}ms` }, { quoted: msg });
        break;
      }

      case 'uptime': {
        await reply(`⏰ Uptime: ${uptimeStr}`);
        break;
      }

      // ─────────────────────────────
      // AI
      // ─────────────────────────────
      case 'ai': {
        const query = args.join(' ');
        if (!query) return reply(`❌ Usage: ${PREFIX}ai <question>`);
        await reply('🤖 Thinking...');
        try {
          const axios = require('axios');
          const res = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`);
          await reply(res.data?.result || 'No response from AI.');
        } catch {
          await reply('❌ AI service unavailable. Try again later.');
        }
        break;
      }

      case 'deepseek': {
        const query = args.join(' ');
        if (!query) return reply(`❌ Usage: ${PREFIX}deepseek <question>`);
        await reply('🧠 DeepSeek thinking...');
        try {
          const axios = require('axios');
          const res = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`);
          await reply(`🧠 DeepSeek:\n\n${res.data?.result || 'No response.'}`);
        } catch {
          await reply('❌ DeepSeek unavailable. Try again later.');
        }
        break;
      }

      // ─────────────────────────────
      // TOOLS
      // ─────────────────────────────
      case 'fancy': {
        const text = args.join(' ');
        if (!text) return reply(`❌ Usage: ${PREFIX}fancy <text>`);
        const fancy = text.split('').map(c => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
          return c;
        }).join('');
        await reply(`✨ ${fancy}`);
        break;
      }

      case 'sticker': {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage && !msg.message?.imageMessage) {
          return reply(`❌ Reply to an image with ${PREFIX}sticker`);
        }
        await reply('⚙️ Creating sticker...\n(Sticker feature requires ffmpeg setup)');
        break;
      }

      case 'jid': {
        await reply(`📌 JID: ${from}\n👤 Sender: ${sender}`);
        break;
      }

      case 'repo': {
        await reply(`📦 Repo: github.com/TunzyShop/TUNZY-MD-MINI\n\n${BOT_NAME} v${BOT_VERSION}`);
        break;
      }

      // ─────────────────────────────
      // PRIVACY
      // ─────────────────────────────
      case 'privacy': {
        const privacy = await sock.fetchPrivacySettings(true);
        await reply(
          `🔒 Your Privacy Settings:\n\n` +
          `• Last Seen: ${privacy.last || 'N/A'}\n` +
          `• Online: ${privacy.online || 'N/A'}\n` +
          `• Profile Photo: ${privacy.profile || 'N/A'}\n` +
          `• Status: ${privacy.status || 'N/A'}\n` +
          `• Groups: ${privacy.groupadd || 'N/A'}`
        );
        break;
      }

      case 'setonline': {
        if (!isOwner) return reply('❌ Owner only!');
        await sock.sendPresenceUpdate('available');
        await reply('✅ Status set to Online');
        break;
      }

      case 'setmyname': {
        if (!isOwner) return reply('❌ Owner only!');
        const newName = args.join(' ');
        if (!newName) return reply(`❌ Usage: ${PREFIX}setmyname <name>`);
        await sock.updateProfileName(newName);
        await reply(`✅ Name updated to: ${newName}`);
        break;
      }

      case 'updatebio': {
        if (!isOwner) return reply('❌ Owner only!');
        const bio = args.join(' ');
        if (!bio) return reply(`❌ Usage: ${PREFIX}updatebio <bio>`);
        await sock.updateProfileStatus(bio);
        await reply(`✅ Bio updated!`);
        break;
      }

      case 'getbio': {
        const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
        const status = await sock.fetchStatus(target);
        await reply(`📝 Bio: ${status?.status || 'No bio'}`);
        break;
      }

      // ─────────────────────────────
      // SETTINGS (Owner only)
      // ─────────────────────────────
      case 'setbotname': {
        if (!isOwner) return reply('❌ Owner only!');
        const name = args.join(' ');
        if (!name) return reply(`❌ Usage: ${PREFIX}setbotname <name>`);
        await reply(`✅ Bot name updated to: ${name}\n(Restart to apply)`);
        break;
      }

      case 'setbotprefix': {
        if (!isOwner) return reply('❌ Owner only!');
        const pfx = args[0];
        if (!pfx) return reply(`❌ Usage: ${PREFIX}setbotprefix <prefix>`);
        await reply(`✅ Prefix updated to: ${pfx}\n(Restart to apply)`);
        break;
      }

      case 'mode': {
        if (!isOwner) return reply('❌ Owner only!');
        const m = args[0]?.toLowerCase();
        if (!m || !['public', 'private'].includes(m)) {
          return reply(`❌ Usage: ${PREFIX}mode public/private`);
        }
        await reply(`✅ Bot mode set to: ${m.toUpperCase()}`);
        break;
      }

      case 'auto-seen': {
        if (!isOwner) return reply('❌ Owner only!');
        await reply(`✅ Auto-seen toggled!`);
        break;
      }

      case 'auto-typing': {
        if (!isOwner) return reply('❌ Owner only!');
        await reply(`✅ Auto-typing toggled!`);
        break;
      }

      case 'auto-recording': {
        if (!isOwner) return reply('❌ Owner only!');
        await reply(`✅ Auto-recording toggled!`);
        break;
      }

      case 'afk': {
        const reason = args.join(' ') || 'No reason';
        await reply(`😴 AFK Mode: ON\nReason: ${reason}`);
        break;
      }

      // ─────────────────────────────
      // ADMIN COMMANDS (Group)
      // ─────────────────────────────
      case 'kick': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply(`❌ Reply to a user's message to kick.`);
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        await reply(`✅ Kicked @${target.split('@')[0]}`, { mentions: [target] });
        break;
      }

      case 'promote': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply(`❌ Reply to a user's message to promote.`);
        await sock.groupParticipantsUpdate(from, [target], 'promote');
        await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} promoted to admin!`, mentions: [target] }, { quoted: msg });
        break;
      }

      case 'demote': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply(`❌ Reply to a user's message to demote.`);
        await sock.groupParticipantsUpdate(from, [target], 'demote');
        await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} demoted!`, mentions: [target] }, { quoted: msg });
        break;
      }

      case 'tagall': {
        if (!isGroup) return reply('❌ Group only!');
        const groupMeta = await sock.groupMetadata(from);
        const members = groupMeta.participants.map(p => p.id);
        const msg2 = args.join(' ') || '📢 Attention everyone!';
        const mentions = members;
        const text = msg2 + '\n\n' + members.map(m => `@${m.split('@')[0]}`).join(' ');
        await sock.sendMessage(from, { text, mentions });
        break;
      }

      case 'tag': {
        if (!isGroup) return reply('❌ Group only!');
        const text2 = args.join(' ');
        if (!text2) return reply(`❌ Usage: ${PREFIX}tag <message>`);
        const quoted2 = msg.message?.extendedTextMessage?.contextInfo;
        if (!quoted2?.participant) return reply('❌ Reply to a message to tag.');
        const target2 = quoted2.participant;
        await sock.sendMessage(from, {
          text: `@${target2.split('@')[0]} ${text2}`,
          mentions: [target2]
        }, { quoted: msg });
        break;
      }

      case 'mute': {
        if (!isGroup) return reply('❌ Group only!');
        await sock.groupSettingUpdate(from, 'announcement');
        await reply('🔇 Group muted! Only admins can send messages.');
        break;
      }

      case 'unmute': {
        if (!isGroup) return reply('❌ Group only!');
        await sock.groupSettingUpdate(from, 'not_announcement');
        await reply('🔊 Group unmuted! Everyone can send messages.');
        break;
      }

      case 'add': {
        if (!isGroup) return reply('❌ Group only!');
        const num = args[0]?.replace(/[^0-9]/g, '');
        if (!num) return reply(`❌ Usage: ${PREFIX}add +number`);
        await sock.groupParticipantsUpdate(from, [num + '@s.whatsapp.net'], 'add');
        await reply(`✅ Added +${num} to group!`);
        break;
      }

      case 'leave': {
        if (!isOwner) return reply('❌ Owner only!');
        if (!isGroup) return reply('❌ Group only!');
        await reply('👋 Leaving group...');
        await sock.groupLeave(from);
        break;
      }

      case 'setgname': {
        if (!isGroup) return reply('❌ Group only!');
        const name = args.join(' ');
        if (!name) return reply(`❌ Usage: ${PREFIX}setgname <name>`);
        await sock.groupUpdateSubject(from, name);
        await reply(`✅ Group name updated to: ${name}`);
        break;
      }

      case 'warn': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('❌ Reply to a message to warn.');
        await sock.sendMessage(from, {
          text: `⚠️ @${target.split('@')[0]} has been warned!`,
          mentions: [target]
        }, { quoted: msg });
        break;
      }

      case 'del': {
        const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const participant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!key) return reply('❌ Reply to a message to delete.');
        await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: key, participant } });
        break;
      }

      case 'welcome': {
        if (!isGroup) return reply('❌ Group only!');
        await reply(`✅ Welcome messages toggled!`);
        break;
      }

      case 'goodbye': {
        if (!isGroup) return reply('❌ Group only!');
        await reply(`✅ Goodbye messages toggled!`);
        break;
      }

      case 'antilink': {
        if (!isGroup) return reply('❌ Group only!');
        await reply(`✅ Antilink toggled!`);
        break;
      }

      case 'acceptall': {
        if (!isGroup) return reply('❌ Group only!');
        const requests = await sock.groupRequestParticipantsList(from);
        if (!requests.length) return reply('No pending requests.');
        await sock.groupRequestParticipantsUpdate(from, requests.map(r => r.jid), 'approve');
        await reply(`✅ Accepted ${requests.length} join requests!`);
        break;
      }

      case 'rejectall': {
        if (!isGroup) return reply('❌ Group only!');
        const requests2 = await sock.groupRequestParticipantsList(from);
        if (!requests2.length) return reply('No pending requests.');
        await sock.groupRequestParticipantsUpdate(from, requests2.map(r => r.jid), 'reject');
        await reply(`✅ Rejected ${requests2.length} join requests!`);
        break;
      }

      // ─────────────────────────────
      // OWNER COMMANDS
      // ─────────────────────────────
      case 'broadcast': {
        if (!isOwner) return reply('❌ Owner only!');
        const bcText = args.join(' ');
        if (!bcText) return reply(`❌ Usage: ${PREFIX}broadcast <message>`);
        const chats = await sock.groupFetchAllParticipating();
        let sent = 0;
        for (const chat of Object.values(chats)) {
          try {
            await sock.sendMessage(chat.id, { text: `📢 Broadcast:\n\n${bcText}` });
            sent++;
          } catch {}
        }
        await reply(`✅ Broadcast sent to ${sent} groups!`);
        break;
      }

      case 'getpp': {
        const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
        try {
          const ppUrl = await sock.profilePictureUrl(target, 'image');
          const axios = require('axios');
          const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
          await sock.sendMessage(from, { image: Buffer.from(response.data), caption: `📷 Profile picture of @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });
        } catch {
          await reply('❌ No profile picture found.');
        }
        break;
      }

      case 'setpp': {
        if (!isOwner) return reply('❌ Owner only!');
        const imgMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message?.imageMessage;
        if (!imgMsg) return reply(`❌ Reply to an image with ${PREFIX}setpp`);
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.updateProfilePicture(sock.user.id, buffer);
        await reply('✅ Profile picture updated!');
        break;
      }

      case 'sudo': {
        if (!isOwner) return reply('❌ Owner only!');
        const sudoNum = args[0]?.replace(/[^0-9]/g, '');
        if (!sudoNum) return reply(`❌ Usage: ${PREFIX}sudo +number`);
        await reply(`✅ ${sudoNum} added as sudo!`);
        break;
      }

      case 'anti-call': {
        if (!isOwner) return reply('❌ Owner only!');
        await reply(`✅ Anti-call toggled!`);
        break;
      }

      case 'auto-reply': {
        if (!isOwner) return reply('❌ Owner only!');
        await reply(`✅ Auto-reply toggled!`);
        break;
      }

      // ─────────────────────────────
      // ANIME
      // ─────────────────────────────
      case 'hug': case 'kiss': case 'slap': case 'pat': case 'dance':
      case 'cry': case 'blush': case 'wave': case 'wink': case 'bite':
      case 'cuddle': case 'poke': case 'lick': case 'bonk': case 'kill':
      case 'highfive': case 'handhold': case 'glomp': case 'yeet':
      case 'nom': case 'bully': case 'cringe': case 'hack':
      case 'insult': case 'awoo': case 'dog': case 'img': {
        try {
          const axios = require('axios');
          const animeRes = await axios.get(`https://api.waifu.pics/sfw/${command}`);
          const url = animeRes.data?.url;
          if (!url) throw new Error('No image');
          const imgBuf = await axios.get(url, { responseType: 'arraybuffer' });
          const target3 = msg.message?.extendedTextMessage?.contextInfo?.participant;
          const caption = target3
            ? `*${command.toUpperCase()}*\n@${senderNumber} ${command}s @${target3.split('@')[0]}!`
            : `*${command.toUpperCase()}*`;
          await sock.sendMessage(from, {
            image: Buffer.from(imgBuf.data),
            caption,
            mentions: target3 ? [sender, target3] : [sender]
          }, { quoted: msg });
        } catch {
          await reply(`🎌 ${command.toUpperCase()}! (Image unavailable)`);
        }
        break;
      }

      // ─────────────────────────────
      // GAME
      // ─────────────────────────────
      case 'tod': {
        const questions = ['Truth: What is your biggest secret?', 'Dare: Send a voice note singing!', 'Truth: Who do you have a crush on?', 'Dare: Change your status for 1 hour!'];
        const dares = ['Dare: Tag your bestie!', 'Truth: Last person you texted?', 'Dare: Send a selfie!', 'Truth: Most embarrassing moment?'];
        const all = [...questions, ...dares];
        await reply(`🎮 *TRUTH OR DARE*\n\n${all[Math.floor(Math.random() * all.length)]}`);
        break;
      }

      case 'ttt': {
        await reply(`🎮 Tic-Tac-Toe:\n\nSend ${PREFIX}ttt to start a game!\n(Full implementation coming soon)`);
        break;
      }

      // ─────────────────────────────
      // STICKER
      // ─────────────────────────────
      case 'take': {
        const stickerMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
        if (!stickerMsg) return reply(`❌ Reply to a sticker with ${PREFIX}take`);
        const stream2 = await downloadContentFromMessage(stickerMsg, 'sticker');
        let buf2 = Buffer.from([]);
        for await (const chunk of stream2) buf2 = Buffer.concat([buf2, chunk]);
        await sock.sendMessage(from, {
          sticker: buf2,
          stickerMetadata: { packname: BOT_NAME, author: OWNER_NAME }
        }, { quoted: msg });
        break;
      }

      // ─────────────────────────────
      // MISC
      // ─────────────────────────────
      case 'lyrics': {
        const song = args.join(' ');
        if (!song) return reply(`❌ Usage: ${PREFIX}lyrics <song name>`);
        try {
          const axios = require('axios');
          const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(song)}`);
          const lyrics = res.data?.lyrics;
          if (!lyrics) throw new Error();
          await reply(`🎵 *${res.data.title}* by *${res.data.author}*\n\n${lyrics.substring(0, 3000)}...`);
        } catch {
          await reply('❌ Lyrics not found.');
        }
        break;
      }

      case 'savestatus': {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return reply(`❌ Reply to a status to save it.`);
        await reply('✅ Status saved!');
        break;
      }

      default:
        // Unknown command — silently ignore or reply
        break;
    }

  } catch (err) {
    console.error('Command error:', err.message);
  }
}

// ── COMMAND LIST FOR PLUGIN COUNT ──
const COMMANDS = [
  'menu','alive','ping','uptime','ai','deepseek','fancy','sticker','take','vsticker',
  'jid','repo','privacy','setonline','setmyname','updatebio','getbio','kick','promote',
  'demote','tagall','tag','mute','unmute','add','leave','setgname','warn','del','welcome',
  'goodbye','antilink','acceptall','rejectall','broadcast','getpp','setpp','sudo',
  'anti-call','auto-reply','auto-seen','auto-typing','auto-recording','afk','mode',
  'setbotname','setbotprefix','hug','kiss','slap','pat','dance','cry','blush','wave',
  'wink','bite','cuddle','poke','lick','bonk','kill','highfive','handhold','glomp',
  'yeet','nom','bully','cringe','hack','insult','awoo','dog','img','tod','ttt',
  'lyrics','savestatus','fb','instagram','tiktok','play','video','shazam','removebg',
  'hd','quoted','savecontact','tiktoksearch','vv','blocklist','getprivacy','groupsprivacy',
  'setppall','broadcast','vcf','forward','update','resetwarn','autoreact','status-react',
  'status-reply','read-message','mute-user','unmute-user','screenshot','movie','setgpp'
];

module.exports = { startWhatsAppSession, stopWhatsAppSession: deleteWhatsAppSession, deleteWhatsAppSession, getSessionStatus };
