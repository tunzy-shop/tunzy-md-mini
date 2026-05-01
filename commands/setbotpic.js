module.exports = {
    execute: async ({ sock, msg, from, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        await reply(`〆 _Set bot picture coming soon!_`);
    }
};