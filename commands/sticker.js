module.exports = {
    execute: async ({ sock, msg, from, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const imgMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message?.imageMessage;
        if (!imgMsg) return reply(`〆 _Reply to an image with ${PREFIX}sticker_`);
        await reply(`〆 _Sticker creation coming soon!_`);
    }
};