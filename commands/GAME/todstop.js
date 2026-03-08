const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'todstop',
    category: 'GAME',
    description: 'Stop Truth or Dare',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Game stopped_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};