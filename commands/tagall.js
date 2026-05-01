const { isAdmin } = require('../lib/isAdmin');
module.exports = {
    execute: async ({ sock, msg, from, sender, args, isGroup, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        const senderIsAdmin = await isAdmin(sock, from, sender);
        if (!senderIsAdmin && !senderIsOwner) return reply(`〆 _You must be an admin to use this command._`);
        const meta = await sock.groupMetadata(from);
        const members = meta.participants.map(p => p.id);
        const text = args.join(' ') || 'Attention everyone!';
        await sock.sendMessage(from, {
            text: `✓ *${text}*\n\n` + members.map(m => `@${m.split('@')[0]}`).join(' '),
            mentions: members
        });
    }
};