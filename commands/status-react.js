module.exports = {
    command: ['status-react', 'statusreact'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !status-react on/off [emoji]_\n✓ Current: ' + (global.statusReact ? `ON (${global.statusReactEmoji || '❤️'})` : 'OFF'));
            }
            
            if (setting === 'on') {
                global.statusReact = true;
                global.statusReactEmoji = args[1] || '❤️';
                reply(`✓ Status reaction enabled with ${global.statusReactEmoji}!`);
            } else {
                global.statusReact = false;
                reply('✓ Status reaction disabled!');
            }
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set status-react_');
        }
    }
};