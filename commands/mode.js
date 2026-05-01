module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const m = args[0]?.toLowerCase();
        if (!['public', 'private'].includes(m)) return reply(`〆 _Usage : ${PREFIX}mode public/private_`);
        await reply(`✓ *Mode* set to : \`${m.toUpperCase()}\``);
    }
};