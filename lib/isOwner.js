function makeIsOwner(ownerPhone) {
    return async function isOwner(senderId, sock, chatId) {
        try {
            const senderNum = senderId.replace(/[^0-9]/g, '').split(':')[0];
            const ownerNum  = (ownerPhone || process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
            if (senderNum === ownerNum) return true;

            // Check sudo list
            const fs = require('fs');
            if (fs.existsSync('./data/owner.json')) {
                const sudoList = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8') || '[]');
                if (sudoList.includes(senderNum) || sudoList.includes(senderId)) return true;
            }
            return false;
        } catch {
            return false;
        }
    };
}

module.exports = { makeIsOwner };