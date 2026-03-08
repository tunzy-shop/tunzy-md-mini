const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'setpp',
    category: 'PRIVACY',
    description: 'Set profile picture',
    execute: async (message, args, negga) => {
        let media;
        if (message.hasMedia) {
            media = await message.downloadMedia();
        }
        
        if (!media) {
            return message.reply('_Please send an image_');
        }
        
        await negga.sendMessage(message.from, 
            `_Profile picture updated_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};