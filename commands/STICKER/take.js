const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'take',
    category: 'STICKER',
    description: 'Take sticker',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Sticker taken_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};