const { isAdmin, isBotAdmin } = require('../lib/isAdmin');
module.exports = {
    execute: async ({ sock, msg, from, sender, isGroup, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        const senderIsAdmin = await isAdmin(sock, from, sender);
        if (!senderIsAdmin && !senderIsOwner) return reply(`〆 _You must be an admin to use this command._`);
        if (!await isBotAdmin(sock, from)) return reply(`〆 _Bot must be an admin to use this command._`);
        await sock.groupSettingUpdate(from, 'not_announcement');
        await reply(`✓ *Group unmuted.* _Everyone can send messages._`);
    }
};