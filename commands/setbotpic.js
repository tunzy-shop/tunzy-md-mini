module.exports = {
    command: ['setbotpic', 'setbotpp'],
    execute: async ({ sock, msg, from, reply, isOwner }) => {
        try {
            if (!isOwner) return reply('_〆 Only bot owner can use this command_');
            
            const media = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            
            if (!media) {
                return reply('_〆 Please send an image with the command or quote an image_\n✓ Example: Send image with caption: !setbotpic');
            }
            
            const buffer = await sock.downloadMedia(media);
            await sock.updateProfilePicture(sock.user.id, buffer);
            reply('✓ Bot profile picture updated successfully!');
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to update bot picture_');
        }
    }
};