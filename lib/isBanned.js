const fs = require('fs');

function isBanned(senderId) {
    try {
        if (!fs.existsSync('./data/banned.json')) return false;
        const banned = JSON.parse(fs.readFileSync('./data/banned.json', 'utf8') || '[]');
        const senderNum = senderId.replace(/[^0-9]/g, '');
        return banned.includes(senderId) || banned.includes(senderNum);
    } catch {
        return false;
    }
}

module.exports = { isBanned };