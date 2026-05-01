module.exports = {
    command: ['setbotprefix', 'setprefix'],
    execute: async ({ sock, msg, from, args, reply, isOwner }) => {
        try {
            if (!isOwner) return reply('_〆 Only bot owner can use this command_');
            
            const newPrefix = args[0];
            if (!newPrefix) return reply('_〆 Please provide a new prefix_\n✓ Example: !setbotprefix $');
            
            global.PREFIX = newPrefix;
            reply(`✓ Bot prefix changed to: ${newPrefix}`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set prefix_');
        }
    }
};