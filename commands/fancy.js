module.exports = {
    execute: async ({ sock, msg, from, args, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const t = args.join(' ');
        if (!t) return reply(`〆 _Usage : ${PREFIX}fancy <text>_`);
        const fancy = t.split('').map(c => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + code - 65);
            if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97);
            return c;
        }).join('');
        await reply(`✓ *Fancy Text :*\n\`${fancy}\``);
    }
};