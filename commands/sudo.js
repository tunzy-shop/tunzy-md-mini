module.exports = {
    command: ['sudo', 'addowner'],
    execute: async ({ sock, msg, from, args, reply, isOwner }) => {
        try {
            if (!isOwner) return reply('_〆 Only bot owner can use this command_');
            
            const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (!mention) return reply('_〆 Mention a user to add as sudo owner_');
            
            global.sudoUsers = global.sudoUsers || [];
            if (!global.sudoUsers.includes(mention)) {
                global.sudoUsers.push(mention);
                reply(`✓ @${mention.split('@')[0]} added as sudo owner!`, { mentions: [mention] });
            } else {
                reply('_〆 User is already a sudo owner_');
            }
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to add sudo user_');
        }
    }
};