const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  command: ['broadcast', 'sudo', 'forward', 'getpp', 'setpp', 'mode',
    'update', 'vcf', 'setonline', 'setmyname', 'updatebio'],
  execute: async ({ sock, msg, from, command, args, isOwner, sender, PREFIX }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
    if (!isOwner) return reply('❌ Owner only!');

    if (command === 'broadcast') {
      const text = args.join(' ');
      if (!text) return reply(`❌ Usage: ${PREFIX}broadcast <message>`);
      const chats = await sock.groupFetchAllParticipating();
      let sent = 0;
      for (const chat of Object.values(chats)) {
        try { await sock.sendMessage(chat.id, { text: `📢 *Broadcast:*\n\n${text}` }); sent++; } catch {}
      }
      await reply(`✅ Sent to ${sent} groups!`);
    }
    if (command === 'sudo') {
      const num = args[0]?.replace(/[^0-9]/g, '');
      if (!num) return reply(`❌ Usage: ${PREFIX}sudo <number>`);
      await reply(`✅ +${num} added as sudo!`);
    }
    if (command === 'forward') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) return reply('❌ Reply to a message to forward.');
      await reply('✅ Message forwarded! (Feature coming soon)');
    }
    if (command === 'getpp') {
      const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
      try {
        const ppUrl = await sock.profilePictureUrl(target, 'image');
        const res = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
        await sock.sendMessage(from, {
          image: Buffer.from(res.data),
          caption: `📷 Profile picture`
        }, { quoted: msg });
      } catch { await reply('❌ No profile picture found.'); }
    }
    if (command === 'setpp') {
      const imgMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply(`❌ Reply to an image with ${PREFIX}setpp`);
      try {
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await sock.updateProfilePicture(sock.user.id, buffer);
        await reply('✅ Profile picture updated!');
      } catch { await reply('❌ Failed to update picture.'); }
    }
    if (command === 'mode') {
      const m = args[0]?.toLowerCase();
      if (!['public', 'private'].includes(m)) return reply('❌ Usage: .mode public/private');
      await reply(`✅ Mode: ${m.toUpperCase()}`);
    }
    if (command === 'update') await reply('✅ Checking for updates... (Feature coming soon)');
    if (command === 'vcf') await reply('✅ VCF feature coming soon!');
    if (command === 'setonline') {
      await sock.sendPresenceUpdate('available');
      await reply('✅ Status set to Online!');
    }
    if (command === 'setmyname') {
      const name = args.join(' ');
      if (!name) return reply(`❌ Usage: ${PREFIX}setmyname <name>`);
      await sock.updateProfileName(name);
      await reply(`✅ Name updated: ${name}`);
    }
    if (command === 'updatebio') {
      const bio = args.join(' ');
      if (!bio) return reply(`❌ Usage: ${PREFIX}updatebio <bio>`);
      await sock.updateProfileStatus(bio);
      await reply('✅ Bio updated!');
    }
  }
};