const { isAdmin, isBotAdmin } = require('../lib/isAdmin');
module.exports = {
    execute: async ({ sock, msg, from, sender, args, isGroup, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        const senderIsAdmin = await isAdmin(sock, from, sender);
        if (!senderIsAdmin && !senderIsOwner) return reply(`〆 _You must be an admin to use this command._`);
        if (!await isBotAdmin(sock, from)) return reply(`〆 _Bot must be an admin to use this command._`);
        const name = args.join(' ');
        if (!name) return reply(`〆 _Usage : ${PREFIX}setgname <name>_`);
        await sock.groupUpdateSubject(from, name);
        await reply(`✓ *Group name* updated to : \`${name}\``);
    }
};