module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const url = args[0];
        if (!url) return reply(`〆 _Usage : ${PREFIX}gitclone <url>_`);
        await reply(`〆 _Git clone coming soon!_`);
    }
};