module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const q = args.join(' ');
        if (!q) return reply(`〆 _Usage : ${PREFIX}movie <name>_`);
        await reply(`〆 _Movie search coming soon!_`);
    }
};