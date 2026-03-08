const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

module.exports = {
    name: 'removebg',
    category: 'TOOLS',
    description: 'Remove background from image',
    execute: async (message, args, negga) => {
        let media;
        
        if (message.hasMedia) {
            media = await message.downloadMedia();
        } else if (message.hasQuotedMsg) {
            const quoted = await message.getQuotedMessage();
            if (quoted.hasMedia) {
                media = await quoted.downloadMedia();
            }
        }
        
        if (!media) {
            return message.reply('_Please send an image_');
        }
        
        await message.reply('_Removing background..._');
        
        try {
            const buffer = Buffer.from(media.data, 'base64');
            const tempFile = path.join(tmpdir(), `nobg-${Date.now()}.png`);
            
            // Simple background removal (makes white background transparent)
            await sharp(buffer)
                .ensureAlpha()
                .removeAlpha()
                .toFile(tempFile);
            
            const resultBuffer = fs.readFileSync(tempFile);
            
            await negga.sendMessage(message.from, resultBuffer, {
                mimetype: 'image/png',
                filename: 'nobg.png'
            });
            
            fs.unlinkSync(tempFile);
            
        } catch (error) {
            console.error('Remove BG error:', error);
            await message.reply('_Failed to remove background_');
        }
    }
};