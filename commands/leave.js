module.exports = {
    execute: async ({ sock, msg, from, isGroup, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        await reply(`✓ *Leaving group...*`);
        await sock.groupLeave(from);
    }
};