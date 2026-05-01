module.exports = {
    command: ['auto-reply', 'autoreply'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !auto-reply on/off_\n✓ Current: ' + (global.autoReply ? 'ON' : 'OFF'));
            }
            
            global.autoReply = setting === 'on';
            reply(`✓ Auto-reply ${setting === 'on' ? 'enabled' : 'disabled'}!`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set auto-reply_');
        }
    }
};