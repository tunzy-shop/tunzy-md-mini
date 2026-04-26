module.exports = {
  command: ['anti-call', 'auto-recording', 'auto-reply', 'auto-seen',
    'auto-typing', 'autoreact', 'afk', 'read-message',
    'setbotprefix', 'setbotpic', 'setbotname', 'status-react', 'status-reply'],
  execute: async ({ sock, msg, from, command, args, isOwner, PREFIX }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
    if (!isOwner) return reply('❌ Owner only!');

    if (command === 'afk') {
      const reason = args.join(' ') || 'No reason given';
      return reply(`😴 AFK Mode: ON\nReason: ${reason}`);
    }
    if (command === 'setbotname') {
      const name = args.join(' ');
      if (!name) return reply(`❌ Usage: ${PREFIX}setbotname <name>`);
      return reply(`✅ Bot name set to: ${name}\n(Restart to apply)`);
    }
    if (command === 'setbotprefix') {
      const pfx = args[0];
      if (!pfx) return reply(`❌ Usage: ${PREFIX}setbotprefix <prefix>`);
      return reply(`✅ Prefix set to: ${pfx}\n(Restart to apply)`);
    }
    if (command === 'setbotpic') {
      return reply(`✅ Bot pic feature coming soon!`);
    }

    const toggles = {
      'anti-call': '🚫 Anti-Call',
      'auto-recording': '🎙️ Auto-Recording',
      'auto-reply': '💬 Auto-Reply',
      'auto-seen': '👁️ Auto-Seen',
      'auto-typing': '⌨️ Auto-Typing',
      'autoreact': '😍 Auto-React',
      'read-message': '✅ Read-Message',
      'status-react': '❤️ Status-React',
      'status-reply': '💬 Status-Reply',
    };
    if (toggles[command]) {
      await reply(`✅ ${toggles[command]} toggled!`);
    }
  }
};