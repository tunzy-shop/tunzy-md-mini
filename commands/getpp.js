const axios = require('axios');
module.exports = {
    execute: async ({ sock, msg, from, sender, args, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
        try {
            const ppUrl = await sock.profilePictureUrl(target, 'image');
            const res   = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 });
            await sock.sendMessage(from, {
                image:   Buffer.from(res.data),
                caption: `✓ *Profile picture* of @${target.split('@')[0]}`
            }, { quoted: msg });
        } catch { await reply(`〆 _No profile picture found._`); }
    }
};