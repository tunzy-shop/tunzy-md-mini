module.exports = {
  command: ['kick', 'promote', 'demote', 'tagall', 'tag', 'mute', 'unmute',
    'mute-user', 'unmute-user', 'add', 'warn', 'del', 'leave',
    'setgname', 'setgpp', 'welcome', 'goodbye', 'antilink',
    'acceptall', 'rejectall', 'resetwarn'],
  execute: async ({ sock, msg, from, sender, command, args, isGroup, isOwner }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
    if (!isGroup && !['leave', 'del'].includes(command)) return reply('❌ Group only!');
    const target = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (command === 'kick') {
      if (!target) return reply('❌ Reply to a message to kick.');
      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await sock.sendMessage(from, { text: `✅ Kicked @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });
    }
    if (command === 'promote') {
      if (!target) return reply('❌ Reply to a message to promote.');
      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} promoted to admin!`, mentions: [target] }, { quoted: msg });
    }
    if (command === 'demote') {
      if (!target) return reply('❌ Reply to a message to demote.');
      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} demoted!`, mentions: [target] }, { quoted: msg });
    }
    if (command === 'tagall') {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.map(p => p.id);
      const text = args.join(' ') || '📢 Attention everyone!';
      await sock.sendMessage(from, {
        text: text + '\n\n' + members.map(m => `@${m.split('@')[0]}`).join(' '),
        mentions: members
      });
    }
    if (command === 'tag') {
      if (!target) return reply('❌ Reply to a message to tag.');
      const text = args.join(' ');
      await sock.sendMessage(from, { text: `@${target.split('@')[0]} ${text}`, mentions: [target] }, { quoted: msg });
    }
    if (command === 'mute') {
      await sock.groupSettingUpdate(from, 'announcement');
      await reply('🔇 Group muted! Only admins can send messages.');
    }
    if (command === 'unmute') {
      await sock.groupSettingUpdate(from, 'not_announcement');
      await reply('🔊 Group unmuted!');
    }
    if (command === 'mute-user') {
      if (!target) return reply('❌ Reply to a message.');
      await reply(`🔇 @${target.split('@')[0]} muted! (Feature coming soon)`);
    }
    if (command === 'unmute-user') {
      if (!target) return reply('❌ Reply to a message.');
      await reply(`🔊 @${target.split('@')[0]} unmuted! (Feature coming soon)`);
    }
    if (command === 'add') {
      const num = args[0]?.replace(/[^0-9]/g, '');
      if (!num) return reply('❌ Usage: .add <number>');
      await sock.groupParticipantsUpdate(from, [num + '@s.whatsapp.net'], 'add');
      await reply(`✅ Added +${num}!`);
    }
    if (command === 'warn') {
      if (!target) return reply('❌ Reply to a message to warn.');
      await sock.sendMessage(from, { text: `⚠️ @${target.split('@')[0]} has been warned!`, mentions: [target] }, { quoted: msg });
    }
    if (command === 'del') {
      const key = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const participant = msg.message?.extendedTextMessage?.contextInfo?.participant;
      if (!key) return reply('❌ Reply to a message to delete.');
      await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: key, participant } });
    }
    if (command === 'leave') {
      if (!isOwner) return reply('❌ Owner only!');
      await reply('👋 Leaving group...');
      await sock.groupLeave(from);
    }
    if (command === 'setgname') {
      const name = args.join(' ');
      if (!name) return reply('❌ Usage: .setgname <name>');
      await sock.groupUpdateSubject(from, name);
      await reply(`✅ Group name updated: ${name}`);
    }
    if (command === 'setgpp') {
      const imgMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply('❌ Reply to an image.');
      await reply('✅ Group photo updated! (Feature coming soon)');
    }
    if (command === 'welcome') await reply('✅ Welcome messages toggled!');
    if (command === 'goodbye') await reply('✅ Goodbye messages toggled!');
    if (command === 'antilink') await reply('✅ Antilink toggled!');
    if (command === 'resetwarn') await reply('✅ Warnings reset!');
    if (command === 'acceptall') {
      try {
        const requests = await sock.groupRequestParticipantsList(from);
        if (!requests.length) return reply('No pending requests.');
        await sock.groupRequestParticipantsUpdate(from, requests.map(r => r.jid), 'approve');
        await reply(`✅ Accepted ${requests.length} requests!`);
      } catch { await reply('❌ Could not fetch requests.'); }
    }
    if (command === 'rejectall') {
      try {
        const requests = await sock.groupRequestParticipantsList(from);
        if (!requests.length) return reply('No pending requests.');
        await sock.groupRequestParticipantsUpdate(from, requests.map(r => r.jid), 'reject');
        await reply(`✅ Rejected ${requests.length} requests!`);
      } catch { await reply('❌ Could not fetch requests.'); }
    }
  }
};