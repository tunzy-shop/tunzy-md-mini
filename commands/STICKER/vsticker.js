const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'vsticker',
    category: 'STICKER',
    description: 'Create video sticker',
    execute: async (message, args, negga) => {
        let media;
        
        if (message.hasMedia) {
            media = await message.downloadMedia();
        }
        
        if (!media) {
            return message.reply('_Please send video_');
        }
        
        await negga.sendMessage(message.from, 
            `_Video sticker created_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};