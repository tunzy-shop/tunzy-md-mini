module.exports = {
    execute: async ({ sock, msg, from, isGroup }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        await reply(`✓ *Goodbye messages* toggled!`);
    }
};