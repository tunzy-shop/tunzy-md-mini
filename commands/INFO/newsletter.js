const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'newsletter',
    category: 'INFO',
    description: 'Follow our newsletter',
    execute: async (message, args, negga) => {
        const user = message.author || message.sender;
        
        try {
            await negga.newsletterFollow('120363422591784062@newsletter');
            await negga.sendMessage(message.from, '_You are now following TUNZY-TECH newsletter_');
        } catch (error) {
            console.error('Newsletter follow error:', error);
            await message.reply('_Failed to follow newsletter_');
        }
    }
};