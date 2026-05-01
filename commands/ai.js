const axios = require('axios');
module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const q = args.join(' ');
        if (!q) return reply(`〆 _Usage : ${PREFIX}ai <question>_`);
        await reply('`thinking....`');
        try {
            const res = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(q)}`, { timeout: 20000 });
            await reply(`✓ *Question :* ${q}\n\n✓ *Answer :*\n${res.data?.result || 'No response.'}`);
        } catch { await reply(`〆 _AI is unavailable. Try again later._`); }
    }
};