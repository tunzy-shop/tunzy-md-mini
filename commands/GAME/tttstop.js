const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'tttstop',
    category: 'GAME',
    description: 'Stop Tic Tac Toe',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Tic Tac Toe game stopped_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};