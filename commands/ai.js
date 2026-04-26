const axios = require('axios');
module.exports = {
  command: ['ai', 'deepseek'],
  execute: async ({ sock, msg, from, args, command, PREFIX }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
    const q = args.join(' ');
    if (!q) return reply(`❌ Usage: ${PREFIX}${command} <question>`);
    await reply('🤖 Thinking...');
    try {
      const res = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(q)}`, { timeout: 20000 });
      await reply(res.data?.result || 'No response.');
    } catch {
      await reply('❌ AI unavailable. Try later.');
    }
  }
};