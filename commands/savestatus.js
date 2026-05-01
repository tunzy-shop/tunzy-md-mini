module.exports = {
    execute: async ({ sock, msg, from }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return reply(`〆 _Reply to a status to save it._`);
        await reply(`✓ *Status saved!*`);
    }
};