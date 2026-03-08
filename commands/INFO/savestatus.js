const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'savestatus',
    category: 'INFO',
    description: 'Save status',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Status saved_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};