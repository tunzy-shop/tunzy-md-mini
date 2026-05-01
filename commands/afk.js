module.exports = {
    command: ['afk'],
    execute: async ({ sock, msg, from, args, reply, sender, senderNumber }) => {
        try {
            const reason = args.join(' ') || 'No reason provided';
            
            global.afkUsers = global.afkUsers || {};
            global.afkUsers[senderNumber] = {
                reason: reason,
                time: Date.now()
            };
            
            reply(`✓ You are now AFK!\n_〆 Reason: ${reason}_\n_〆 Others will be notified when they mention you_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set AFK_');
        }
    }
};