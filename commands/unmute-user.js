module.exports = {
    execute: async ({ sock, msg, from, isGroup }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply(`〆 _Reply to a user's message._`);
        await reply(`〆 _Unmute user coming soon!_`);
    }
};