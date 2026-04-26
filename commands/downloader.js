const axios = require('axios');
module.exports = {
  command: ['fb', 'gitclone', 'instagram', 'play', 'tiktok', 'video', 'movie'],
  execute: async ({ sock, msg, from, command, args, PREFIX }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    if (command === 'tiktok') {
      const url = args[0];
      if (!url) return reply(`❌ Usage: ${PREFIX}tiktok <url>`);
      await reply('⏳ Downloading TikTok video...');
      try {
        const res = await axios.get(`https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`, { timeout: 20000 });
        const videoUrl = res.data?.result?.video;
        if (!videoUrl) throw new Error();
        const video = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 30000 });
        await sock.sendMessage(from, { video: Buffer.from(video.data), caption: '✅ TikTok Video' }, { quoted: msg });
      } catch { await reply('❌ Failed to download. Try again.'); }
    }
    if (command === 'play') {
      const q = args.join(' ');
      if (!q) return reply(`❌ Usage: ${PREFIX}play <song name>`);
      await reply(`🎵 Searching: ${q}\n(Feature coming soon!)`);
    }
    if (command === 'fb') {
      const url = args[0];
      if (!url) return reply(`❌ Usage: ${PREFIX}fb <url>`);
      await reply(`📥 FB downloader coming soon!`);
    }
    if (command === 'instagram') {
      const url = args[0];
      if (!url) return reply(`❌ Usage: ${PREFIX}instagram <url>`);
      await reply(`📥 Instagram downloader coming soon!`);
    }
    if (command === 'video') {
      const url = args[0];
      if (!url) return reply(`❌ Usage: ${PREFIX}video <url>`);
      await reply(`📥 Video downloader coming soon!`);
    }
    if (command === 'gitclone') {
      const url = args[0];
      if (!url) return reply(`❌ Usage: ${PREFIX}gitclone <url>`);
      await reply(`📦 Git clone downloader coming soon!`);
    }
    if (command === 'movie') {
      const q = args.join(' ');
      if (!q) return reply(`❌ Usage: ${PREFIX}movie <name>`);
      await reply(`🎬 Movie search coming soon!`);
    }
  }
};