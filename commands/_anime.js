module.exports = {
    execute: async ({ sock, msg, from, sender, senderNumber, BOT_NAME }, animeCmd) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        try {
            const fetch  = require('node-fetch');
            const res    = await fetch(`https://api.waifu.pics/sfw/${animeCmd}`, { timeout: 10000 });
            const data   = await res.json();
            const url    = data?.url;
            if (!url) throw new Error();
            const imgRes = await fetch(url, { timeout: 15000 });
            const buffer = await imgRes.buffer();
            const caption = target
                ? `✓ *${animeCmd.toUpperCase()}*\n@${senderNumber} ${animeCmd}s @${target.split('@')[0]}!`
                : `✓ *${animeCmd.toUpperCase()}*`;
            await sock.sendMessage(from, {
                image: buffer, caption,
                mentions: target ? [sender, target] : [sender]
            }, { quoted: msg });
        } catch { await reply(`〆 _Image unavailable. Try again._`); }
    }
};