async function isAdmin(sock, chatId, senderId) {
    try {
        const meta    = await sock.groupMetadata(chatId);
        const member  = meta.participants.find(p =>
            p.id === senderId ||
            p.id.split(':')[0] + '@s.whatsapp.net' === senderId
        );
        return member?.admin === 'admin' || member?.admin === 'superadmin';
    } catch {
        return false;
    }
}

async function isBotAdmin(sock, chatId) {
    try {
        const meta   = await sock.groupMetadata(chatId);
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const bot    = meta.participants.find(p =>
            p.id === botJid ||
            p.id.split(':')[0] + '@s.whatsapp.net' === botJid
        );
        return bot?.admin === 'admin' || bot?.admin === 'superadmin';
    } catch {
        return false;
    }
}

module.exports = { isAdmin, isBotAdmin };