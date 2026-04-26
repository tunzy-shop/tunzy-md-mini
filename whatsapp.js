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
        const code = await sock.requestPairingCode(number);
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
            `┃  🟢 <b>Bot Connected!</b>\n` +
            `┃\n` +
            `┃  📱 Number: <b>+${number}</b>\n` +
            `┃  ✅ Status: <b>LIVE</b>\n` +
            `┃\n` +
            `┃  Send <b>.menu</b> on WhatsApp\n` +
            `┃  to see all commands!\n` +
            `┃\n` +
            `╰══════════════════════⊷`,
            { parse_mode: 'HTML' }
          );
        } catch (e) {
          console.log('TG notify error:', e.message);
        }
      }

      try {
        await sock.followNewsletter(WA_CHANNEL_JID);
        console.log(`📢 Joined WA channel: ${number}`);
      } catch (e) {
        console.log('Channel join error:', e.message);
      }
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`❌ Disconnected: ${number} | Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => {
          startWhatsAppSession(number, telegramUserId, tgBot);
        }, 5000);
      } else {
        delete activeSessions[number];
        if (tgBot && telegramUserId) {
          try {
            await tgBot.sendMessage(telegramUserId,
              `⚠️ <b>+${number}</b> was logged out!\n\nUse /pair to reconnect.`,
              { parse_mode: 'HTML' }
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

    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    const session = activeSessions[ownerNumber];
    const uptimeMs = session ? Date.now() - session.startTime : 0;
    const h = Math.floor(uptimeMs / 3600000);
    const m = Math.floor((uptimeMs % 3600000) / 60000);
    const s = Math.floor((uptimeMs % 60000) / 1000);
    const uptimeStr = `${h}h ${m}m ${s}s`;

    switch (command) {

      case 'menu':
      case 'help':
        await sock.sendMessage(from, {
          text:
            `╭═════${BOT_NAME}═════⊷\n` +
            `✓ Hello : @${senderNumber}\n` +
            `✓ Owner : ${OWNER_NAME}\n` +
            `✓ Version : ${BOT_VERSION}\n` +
            `✓ Prefix : ${PREFIX}\n` +
            `✓ Platform : WhatsApp\n` +
            `✓ Plugin : 80+\n` +
            `✓ Uptime : ${uptimeStr}\n` +
            `╰═════════════════════⊷\n\n` +
            `╭━━━━❮ *DOWNLOADER* ❯━⊷\n` +
            `┃✓ ${PREFIX}fb\n┃✓ ${PREFIX}instagram\n┃✓ ${PREFIX}tiktok\n┃✓ ${PREFIX}play\n` +
            `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
            `╭━━━━❮ *AI* ❯━⊷\n` +
            `┃✓ ${PREFIX}ai\n┃✓ ${PREFIX}deepseek\n` +
            `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
            `╭━━━━❮ *TOOLS* ❯━⊷\n` +
            `┃✓ ${PREFIX}fancy\n┃✓ ${PREFIX}sticker\n┃✓ ${PREFIX}removebg\n` +
            `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
            `╭━━━━❮ *ADMIN* ❯━⊷\n` +
            `┃✓ ${PREFIX}kick\n┃✓ ${PREFIX}promote\n┃✓ ${PREFIX}demote\n┃✓ ${PREFIX}tagall\n┃✓ ${PREFIX}mute\n` +
            `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
            `╭━━━━❮ *OWNER* ❯━⊷\n` +
            `┃✓ ${PREFIX}broadcast\n┃✓ ${PREFIX}mode\n┃✓ ${PREFIX}setpp\n` +
            `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
            `╭━━━━❮ *ANIME* ❯━⊷\n` +
            `┃✓ ${PREFIX}hug\n┃✓ ${PREFIX}kiss\n┃✓ ${PREFIX}slap\n┃✓ ${PREFIX}pat\n` +
            `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
            `╭━━━━❮ *GAME* ❯━⊷\n` +
            `┃✓ ${PREFIX}ttt\n┃✓ ${PREFIX}tod\n` +
            `╰━━━━━━━━━━━━━━━━━⊷`,
          mentions: [sender]
        }, { quoted: msg });
        break;

      case 'alive':
        await reply(
          `╭═════${BOT_NAME}═════⊷\n` +
          `┃  🟢 Bot is ALIVE!\n` +
          `┃  ⏰ Uptime: ${uptimeStr}\n` +
          `┃  👑 Owner: ${OWNER_NAME}\n` +
          `╰═════════════════════⊷`
        );
        break;

      case 'ping': {
        const start = Date.now();
        await reply(`🏓 Pong!\n⚡ Speed: ${Date.now() - start}ms`);
        break;
      }

      case 'uptime':
        await reply(`⏰ Uptime: ${uptimeStr}`);
        break;

      case 'ai':
      case 'deepseek': {
        const q = args.join(' ');
        if (!q) return reply(`❌ Usage: ${PREFIX}${command} <question>`);
        await reply('🤖 Thinking...');
        try {
          const axios = require('axios');
          const res = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(q)}`, { timeout: 15000 });
          await reply(res.data?.result || 'No response.');
        } catch { await reply('❌ AI unavailable. Try later.'); }
        break;
      }

      case 'fancy': {
        const t = args.join(' ');
        if (!t) return reply(`❌ Usage: ${PREFIX}fancy <text>`);
        const fancy = t.split('').map(c => {
          const code = c.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
          return c;
        }).join('');
        await reply(`✨ ${fancy}`);
        break;
      }

      case 'jid':
        await reply(`📌 JID: ${from}\n👤 Sender: ${sender}`);
        break;

      case 'repo':
        await reply(`📦 ${BOT_NAME} v${BOT_VERSION}\ngithub.com/tunzy-shop/tunzy-md-mini`);
        break;

      case 'kick': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('❌ Reply to a message to kick.');
        await sock.groupParticipantsUpdate(from, [target], 'remove');
        await sock.sendMessage(from, { text: `✅ Kicked @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });
        break;
      }

      case 'promote': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('❌ Reply to a message to promote.');
        await sock.groupParticipantsUpdate(from, [target], 'promote');
        await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} promoted!`, mentions: [target] }, { quoted: msg });
        break;
      }

      case 'demote': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('❌ Reply to a message to demote.');
        await sock.groupParticipantsUpdate(from, [target], 'demote');
        await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} demoted!`, mentions: [target] }, { quoted: msg });
        break;
      }

      case 'tagall': {
        if (!isGroup) return reply('❌ Group only!');
        const meta = await sock.groupMetadata(from);
        const members = meta.participants.map(p => p.id);
        const txt = args.join(' ') || '📢 Attention!';
        await sock.sendMessage(from, {
          text: txt + '\n\n' + members.map(m => `@${m.split('@')[0]}`).join(' '),
          mentions: members
        });
        break;
      }

      case 'mute': {
        if (!isGroup) return reply('❌ Group only!');
        await sock.groupSettingUpdate(from, 'announcement');
        await reply('🔇 Group muted!');
        break;
      }

      case 'unmute': {
        if (!isGroup) return reply('❌ Group only!');
        await sock.groupSettingUpdate(from, 'not_announcement');
        await reply('🔊 Group unmuted!');
        break;
      }

      case 'add': {
        if (!isGroup) return reply('❌ Group only!');
        const num = args[0]?.replace(/[^0-9]/g, '');
        if (!num) return reply('❌ Usage: .add +number');
        await sock.groupParticipantsUpdate(from, [num + '@s.whatsapp.net'], 'add');
        await reply(`✅ Added +${num}!`);
        break;
      }

      case 'leave': {
        if (!isOwner) return reply('❌ Owner only!');
        await reply('👋 Leaving...');
        await sock.groupLeave(from);
        break;
      }

      case 'warn': {
        if (!isGroup) return reply('❌ Group only!');
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply('❌ Reply to a message to warn.');
        await sock.sendMessage(from, { text: `⚠️ @${target.split('@')[0]} warned!`, mentions: [target] }, { quoted: msg });
        break;
      }

      case 'del': {
        const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const participant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!key) return reply('❌ Reply to a message to delete.');
        await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: key, participant } });
        break;
      }

      case 'broadcast': {
        if (!isOwner) return reply('❌ Owner only!');
        const bcText = args.join(' ');
        if (!bcText) return reply('❌ Usage: .broadcast <message>');
        const chats = await sock.groupFetchAllParticipating();
        let sent = 0;
        for (const chat of Object.values(chats)) {
          try { await sock.sendMessage(chat.id, { text: `📢 Broadcast:\n\n${bcText}` }); sent++; } catch {}
        }
        await reply(`✅ Sent to ${sent} groups!`);
        break;
      }

      case 'setonline': {
        if (!isOwner) return reply('❌ Owner only!');
        await sock.sendPresenceUpdate('available');
        await reply('✅ Online!');
        break;
      }

      case 'setmyname': {
        if (!isOwner) return reply('❌ Owner only!');
        const name = args.join(' ');
        if (!name) return reply('❌ Usage: .setmyname <name>');
        await sock.updateProfileName(name);
        await reply(`✅ Name updated: ${name}`);
        break;
      }

      case 'updatebio': {
        if (!isOwner) return reply('❌ Owner only!');
        const bio = args.join(' ');
        if (!bio) return reply('❌ Usage: .updatebio <bio>');
        await sock.updateProfileStatus(bio);
        await reply('✅ Bio updated!');
        break;
      }

      case 'tod': {
        const list = [
          'Truth: Biggest secret?',
          'Dare: Send a voice note singing!',
          'Truth: Who is your crush?',
          'Dare: Change status for 1hr!',
          'Truth: Last person you texted?',
          'Dare: Send a selfie!'
        ];
        await reply(`🎮 *TRUTH OR DARE*\n\n${list[Math.floor(Math.random() * list.length)]}`);
        break;
      }

      case 'hug': case 'kiss': case 'slap': case 'pat': case 'dance':
      case 'cry': case 'blush': case 'wave': case 'wink': case 'bite':
      case 'cuddle': case 'poke': case 'lick': case 'bonk': case 'kill':
      case 'highfive': case 'handhold': case 'glomp': case 'yeet':
      case 'nom': case 'bully': case 'cringe': case 'hack': case 'insult': {
        try {
          const axios = require('axios');
          const res = await axios.get(`https://api.waifu.pics/sfw/${command}`, { timeout: 10000 });
          const url = res.data?.url;
          if (!url) throw new Error();
          const imgBuf = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
          await sock.sendMessage(from, {
            image: Buffer.from(imgBuf.data),
            caption: `*${command.toUpperCase()}* 🎌`
          }, { quoted: msg });
        } catch { await reply(`🎌 ${command.toUpperCase()}!`); }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Handler error:', err.message);
  }
}

module.exports = { startWhatsAppSession, deleteWhatsAppSession, getSessionStatus };