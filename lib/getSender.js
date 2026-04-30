const { jidNormalizedUser } = require('@whiskeysockets/baileys');

function getSender(sock, message) {
    try {
        const remoteJid = message.key.remoteJid;
        const isGroup   = remoteJid?.endsWith('@g.us');
        if (isGroup) {
            return message.key.participant || message.participant || '';
        }
        return remoteJid || '';
    } catch {
        return '';
    }
}

function getBotJid(sock) {
    try {
        return jidNormalizedUser(sock.user.id);
    } catch {
        return '';
    }
}

function normalizeJid(jid) {
    try {
        return jidNormalizedUser(jid);
    } catch {
        return jid;
    }
}

function extractNum(jid) {
    return jid?.replace(/[^0-9]/g, '') || '';
}

module.exports = { getSender, getBotJid, normalizeJid, extractNum };