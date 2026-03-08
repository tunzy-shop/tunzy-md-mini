const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'privacy',
    category: 'PRIVACY',
    description: 'Privacy settings',
    execute: async (message, args, negga) => {
        await negga.sendMessage(message.from, 
            `_Privacy settings_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};