const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
module.exports = {
    execute: async ({ sock, msg, from, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const imgMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message?.imageMessage;
        if (!imgMsg) return reply(`〆 _Reply to an image with ${PREFIX}setpp_`);
        try {
            const stream = await downloadContentFromMessage(imgMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await sock.updateProfilePicture(sock.user.id, buffer);
            await reply(`✓ *Profile picture* updated.`);
        } catch { await reply(`〆 _Failed to update picture._`); }
    }
};