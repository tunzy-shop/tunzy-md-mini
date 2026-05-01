module.exports = {
    command: ['setbotname', 'botname'],
    execute: async ({ sock, msg, from, args, reply, isOwner }) => {
        try {
            if (!isOwner) return reply('_〆 Only bot owner can use this command_');
            
            const newName = args.join(' ');
            if (!newName) return reply('_〆 Please provide a new bot name_\n✓ Example: !setbotname MyAwesomeBot');
            
            await sock.updateProfileName(newName);
            reply(`✓ Bot name changed to: ${newName}`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to update bot name_');
        }
    }
};