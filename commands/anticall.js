module.exports = {
    execute: async ({ sock, msg, from, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        await reply(`✓ *Anti-Call* toggled!`);
    }
};