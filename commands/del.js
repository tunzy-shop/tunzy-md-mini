const { isAdmin } = require('../lib/isAdmin');
module.exports = {
    execute: async ({ sock, msg, from, sender, isGroup, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const senderIsAdmin = isGroup ? await isAdmin(sock, from, sender) : false;
        if (!senderIsAdmin && !senderIsOwner) return reply(`〆 _You must be an admin to delete messages._`);
        const key         = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const participant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!key) return reply(`〆 _Reply to a message to delete it._`);
        await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: key, participant } });
    }
};