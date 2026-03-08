const newsletterUtils = require('../../lib/newsletter');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

module.exports = {
    name: 'sticker',
    category: 'STICKER',
    description: 'Create sticker',
    execute: async (message, args, negga) => {
        let media;
        
        if (message.hasMedia) {
            media = await message.downloadMedia();
        }
        
        if (!media && message.hasQuotedMsg) {
            const quoted = await message.getQuotedMessage();
            if (quoted.hasMedia) {
                media = await quoted.downloadMedia();
            }
        }
        
        if (!media) {
            return message.reply('_Please send/reply to an image_');
        }
        
        try {
            const buffer = Buffer.from(media.data, 'base64');
            const tempFile = path.join(tmpdir(), `sticker-${Date.now()}.webp`);
            
            await sharp(buffer)
                .resize(512, 512, { fit: 'contain' })
                .webp()
                .toFile(tempFile);
            
            const stickerBuffer = fs.readFileSync(tempFile);
            await negga.sendMessage(message.from, stickerBuffer, {
                asSticker: true,
                ...newsletterUtils.getNormalOptions()
            });
            
            fs.unlinkSync(tempFile);
        } catch (error) {
            await message.reply('_Error creating sticker_');
        }
    }
};