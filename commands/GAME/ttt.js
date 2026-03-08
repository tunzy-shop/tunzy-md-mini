const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'ttt',
    category: 'GAME',
    description: 'Play Tic Tac Toe',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Tic Tac Toe game started_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};