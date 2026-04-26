const axios = require('axios');
module.exports = {
  command: ['lyrics', 'savestatus'],
  execute: async ({ sock, msg, from, command, args, PREFIX }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    if (command === 'lyrics') {
      const song = args.join(' ');
      if (!song) return reply(`❌ Usage: ${PREFIX}lyrics <song name>`);
      await reply('🎵 Searching lyrics...');
      try {
        const res = await axios.get(`https://some-random-api.com/lyrics?title=${encodeURIComponent(song)}`, { timeout: 15000 });
        if (!res.data?.lyrics) throw new Error();
        const lyrics = res.data.lyrics.substring(0, 3000);
        await reply(`🎵 *${res.data.title}* by *${res.data.author}*\n\n${lyrics}`);
      } catch { await reply('❌ Lyrics not found. Try another song.'); }
    }
    if (command === 'savestatus') {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!quoted) return reply('❌ Reply to a status to save it.');
      await reply('✅ Status saved!');
    }
  }
};