const { isAdmin } = require('../lib/isAdmin');
module.exports = {
    execute: async ({ sock, msg, from, sender, isGroup, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        const senderIsAdmin = await isAdmin(sock, from, sender);
        if (!senderIsAdmin && !senderIsOwner) return reply(`〆 _You must be an admin to use this command._`);
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) return reply(`〆 _Reply to a user's message to warn._`);
        await sock.sendMessage(from, { text: `✓ *@${target.split('@')[0]}* has been warned!`, mentions: [target] }, { quoted: msg });
    }
};