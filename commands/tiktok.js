module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const url = args[0];
        if (!url) return reply(`〆 _Usage : ${PREFIX}tiktok <url>_`);
        await reply('`downloading....`');
        try {
            const fetch = require('node-fetch');
            const apis = [
                `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
                `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            ];
            let videoUrl = null;
            for (const api of apis) {
                try {
                    const r = await fetch(api, { timeout: 15000 });
                    const d = await r.json();
                    videoUrl = d?.video?.noWatermark || d?.data?.play || null;
                    if (videoUrl) break;
                } catch {}
            }
            if (!videoUrl) return reply(`〆 _Could not download. Try another URL._`);
            await sock.sendMessage(from, { video: { url: videoUrl }, caption: `✓ *TikTok Video*` }, { quoted: msg });
        } catch { await reply(`〆 _Download failed. Try again._`); }
    }
};