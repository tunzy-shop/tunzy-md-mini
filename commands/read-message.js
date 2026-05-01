module.exports = {
    command: ['read-message', 'readmessage', 'readmsg'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !read-message on/off_\n✓ Current: ' + (global.readMessage ? 'ON' : 'OFF'));
            }
            
            global.readMessage = setting === 'on';
            reply(`✓ Read message ${setting === 'on' ? 'enabled' : 'disabled'}!`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set read message_');
        }
    }
};