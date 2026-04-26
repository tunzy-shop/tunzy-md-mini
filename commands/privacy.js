module.exports = {
  command: ['blocklist', 'getbio', 'getprivacy', 'groupsprivacy', 'privacy', 'setppall'],
  execute: async ({ sock, msg, from, command, args, isOwner, sender }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    if (command === 'privacy' || command === 'getprivacy') {
      try {
        const privacy = await sock.fetchPrivacySettings(true);
        await reply(
          `🔒 *Privacy Settings:*\n\n` +
          `• Last Seen: ${privacy.last || 'N/A'}\n` +
          `• Online: ${privacy.online || 'N/A'}\n` +
          `• Profile Photo: ${privacy.profile || 'N/A'}\n` +
          `• Status: ${privacy.status || 'N/A'}\n` +
          `• Groups: ${privacy.groupadd || 'N/A'}`
        );
      } catch { await reply('❌ Could not fetch privacy settings.'); }
    }
    if (command === 'getbio') {
      const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
      try {
        const status = await sock.fetchStatus(target);
        await reply(`📝 Bio: ${status?.status || 'No bio set'}`);
      } catch { await reply('❌ Could not fetch bio.'); }
    }
    if (command === 'blocklist') {
      try {
        const list = await sock.fetchBlocklist();
        if (!list.length) return reply('📋 Block list is empty!');
        await reply(`🚫 Blocked:\n${list.map(n => `• +${n.replace('@s.whatsapp.net', '')}`).join('\n')}`);
      } catch { await reply('❌ Could not fetch blocklist.'); }
    }
    if (command === 'groupsprivacy') await reply('👥 Groups privacy feature coming soon!');
    if (command === 'setppall') {
      if (!isOwner) return reply('❌ Owner only!');
      await reply('🖼️ Set PP All feature coming soon!');
    }
  }
};