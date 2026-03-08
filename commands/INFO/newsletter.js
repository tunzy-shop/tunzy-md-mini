const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'newsletter',
    category: 'INFO',
    description: 'Follow newsletter',
    execute: async (message, args, negga) => {
        const user = message.author || message.sender;
        const followed = await newsletterUtils.followNewsletter(negga, user);
        
        if (followed) {
            await negga.sendMessage(message.from, 
                `_You are now following TUNZY-TECH newsletter_`, 
                newsletterUtils.getNormalOptions()
            );
        } else {
            await message.reply('_Failed to follow newsletter_');
        }
    }
};