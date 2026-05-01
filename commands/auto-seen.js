module.exports = {
    command: ['auto-seen', 'autoseen', 'readreceipts'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !auto-seen on/off_\n✓ Current: ' + (global.autoSeen ? 'ON' : 'OFF'));
            }
            
            global.autoSeen = setting === 'on';
            reply(`✓ Auto-seen ${setting === 'on' ? 'enabled' : 'disabled'}!\n_〆 Messages will ${setting === 'on' ? 'be marked as read' : 'not be marked as read'}_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set auto-seen_');
        }
    }
};