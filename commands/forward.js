module.exports = {
    execute: async ({ sock, msg, from, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return reply(`〆 _Reply to a message to forward._`);
        await reply(`〆 _Forward coming soon!_`);
    }
};