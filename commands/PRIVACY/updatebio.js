const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'updatebio',
    category: 'PRIVACY',
    description: 'Update bio',
    execute: async (message, args, negga) => {
        const bio = args.join(' ');
        if (!bio) {
            return message.reply('_Please provide bio_');
        }
        
        await negga.sendMessage(message.from, 
            `_Bio updated_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};