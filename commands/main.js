module.exports = {
  command: ['alive', 'ping', 'uptime', 'repo', 'jid', 'screenshot'],
  execute: async ({ sock, msg, from, command, sender, uptimeStr, BOT_NAME, OWNER_NAME, BOT_VERSION }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    if (command === 'alive') {
      await reply(
        `╭═════${BOT_NAME}═════⊷\n` +
        `┃  🟢 Bot is ALIVE!\n` +
        `┃  ⏰ Uptime: ${uptimeStr}\n` +
        `┃  👑 Owner: ${OWNER_NAME}\n` +
        `┃  📦 Version: ${BOT_VERSION}\n` +
        `╰═════════════════════⊷`
      );
    }
    if (command === 'ping') {
      const start = Date.now();
      await reply(`🏓 Pong!\n⚡ Speed: ${Date.now() - start}ms`);
    }
    if (command === 'uptime') {
      await reply(`⏰ Uptime: ${uptimeStr}`);
    }
    if (command === 'repo') {
      await reply(`📦 ${BOT_NAME} v${BOT_VERSION}\n🔗 github.com/tunzy-shop/tunzy-md-mini`);
    }
    if (command === 'jid') {
      await reply(`📌 Chat JID: ${from}\n👤 Sender: ${sender}`);
    }
    if (command === 'screenshot') {
      await reply(`📸 Screenshot feature coming soon!`);
    }
  }
};