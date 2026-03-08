const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

module.exports = {
    name: 'sticker',
    category: 'STICKER',
    description: 'Create sticker from image',
    execute: async (message, args, negga) => {
        let media;
        
        // Get image from message or quoted message
        if (message.hasMedia) {
            media = await message.downloadMedia();
        } else if (message.hasQuotedMsg) {
            const quoted = await message.getQuotedMessage();
            if (quoted.hasMedia) {
                media = await quoted.downloadMedia();
            }
        }
        
        if (!media) {
            return message.reply('_Please send or reply to an image_');
        }
        
        try {
            await message.reply('_Creating sticker..._');
            
            // Convert to sticker
            const buffer = Buffer.from(media.data, 'base64');
            const tempFile = path.join(tmpdir(), `sticker-${Date.now()}.webp`);
            
            await sharp(buffer)
                .resize(512, 512, { fit: 'contain' })
                .webp({ quality: 80 })
                .toFile(tempFile);
            
            const stickerBuffer = fs.readFileSync(tempFile);
            
            // Send as sticker
            await negga.sendMessage(message.from, stickerBuffer, {
                asSticker: true
            });
            
            // Clean up
            fs.unlinkSync(tempFile);
            
        } catch (error) {
            console.error('Sticker error:', error);
            await message.reply('_Failed to create sticker_');
        }
    }
};