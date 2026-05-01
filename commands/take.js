const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
module.exports = {
    execute: async ({ sock, msg, from, BOT_NAME, OWNER_NAME, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const stickerMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
        if (!stickerMsg) return reply(`〆 _Reply to a sticker with ${PREFIX}take_`);
        try {
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buf = Buffer.from([]);
            for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
            await sock.sendMessage(from, {
                sticker: buf,
                stickerMetadata: { packname: BOT_NAME, author: OWNER_NAME }
            }, { quoted: msg });
        } catch { await reply(`〆 _Failed to take sticker._`); }
    }
};