module.exports = {
    command: ['auto-typing', 'autotype'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !auto-typing on/off_\n✓ Current: ' + (global.autoTyping ? 'ON' : 'OFF'));
            }
            
            global.autoTyping = setting === 'on';
            reply(`✓ Auto-typing ${setting === 'on' ? 'enabled' : 'disabled'}!\n_〆 Bot will ${setting === 'on' ? 'show typing' : 'not show typing'} indicator_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set auto-typing_');
        }
    }
};