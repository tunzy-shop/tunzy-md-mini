const axios = require('axios');
module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const song = args.join(' ');
        if (!song) return reply(`〆 _Usage : ${PREFIX}lyrics <song name>_`);
        await reply('`searching....`');
        try {
            const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(song)}`, { timeout: 15000 });
            if (!res.data?.lyrics) throw new Error();
            await reply(
                `✓ *Title :* ${res.data.title}\n` +
                `✓ *Artist :* ${res.data.author}\n\n` +
                `${res.data.lyrics.substring(0, 3000)}`
            );
        } catch { await reply(`〆 _Lyrics not found. Try another song._`); }
    }
};