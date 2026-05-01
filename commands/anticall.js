module.exports = {
    command: ['anti-call', 'anticall'],
    execute: async ({ sock, msg, from, args, reply, isGroup }) => {
        try {
            if (isGroup) return reply('_〆 This command works in private chat only_');
            
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !anti-call on/off_\n✓ Current: ' + (global.antiCall ? 'ON' : 'OFF'));
            }
            
            global.antiCall = setting === 'on';
            reply(`✓ Anti-call ${setting === 'on' ? 'enabled' : 'disabled'}!\n_〆 Bot will ${setting === 'on' ? 'reject' : 'accept'} calls_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set anti-call_');
        }
    }
};