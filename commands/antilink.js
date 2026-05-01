module.exports = {
    command: ['antilink', 'anti-link'],
    execute: async ({ sock, msg, from, args, reply, isGroup, isAdmin }) => {
        try {
            if (!isGroup) return reply('_〆 This command works in groups only_');
            if (!isAdmin) return reply('_〆 You need admin rights_');
            
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !antilink on/off_\n✓ Current: ' + (global.antiLink ? 'ON' : 'OFF'));
            }
            
            global.antiLink = setting === 'on';
            reply(`✓ Anti-link ${setting === 'on' ? 'enabled' : 'disabled'}!\n_〆 ${setting === 'on' ? 'Links will be deleted' : 'Links are allowed'}_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set anti-link_');
        }
    }
};