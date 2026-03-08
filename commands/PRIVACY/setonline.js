const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'setonline',
    category: 'PRIVACY',
    description: 'Set online status',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Online status updated_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};