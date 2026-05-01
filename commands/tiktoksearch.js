module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const q = args.join(' ');
        if (!q) return reply(`〆 _Usage : ${PREFIX}tiktoksearch <query>_`);
        await reply(`〆 _TikTok search coming soon!_`);
    }
};