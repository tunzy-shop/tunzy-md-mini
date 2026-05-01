module.exports = {
    command: ['autoreact', 'auto-react'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            const emoji = args[1] || '✅';
            
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !autoreact on/off [emoji]_\n✓ Example: !autoreact on ❤️\n✓ Current: ' + (global.autoReact ? `ON (${global.reactEmoji || '✅'})` : 'OFF'));
            }
            
            if (setting === 'on') {
                global.autoReact = true;
                global.reactEmoji = emoji;
                reply(`✓ Auto-react enabled with ${emoji}!`);
            } else {
                global.autoReact = false;
                reply('✓ Auto-react disabled!');
            }
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set autoreact_');
        }
    }
};