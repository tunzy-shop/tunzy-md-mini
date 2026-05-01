const { isAdmin } = require('../lib/isAdmin');
module.exports = {
    execute: async ({ sock, msg, from, sender, isGroup, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!isGroup) return reply(`〆 _This command is for groups only._`);
        const senderIsAdmin = await isAdmin(sock, from, sender);
        if (!senderIsAdmin && !senderIsOwner) return reply(`〆 _You must be an admin to use this command._`);
        try {
            const requests = await sock.groupRequestParticipantsList(from);
            if (!requests.length) return reply(`〆 _No pending join requests._`);
            await sock.groupRequestParticipantsUpdate(from, requests.map(r => r.jid), 'reject');
            await reply(`✓ *Rejected* \`${requests.length}\` join requests.`);
        } catch { await reply(`〆 _Could not fetch requests._`); }
    }
};