module.exports = {
    command: ['auto-recording', 'autorecord'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !auto-recording on/off_\n✓ Current: ' + (global.autoRecording ? 'ON' : 'OFF'));
            }
            
            global.autoRecording = setting === 'on';
            reply(`✓ Auto-recording ${setting === 'on' ? 'enabled' : 'disabled'}!\n_〆 Bot will ${setting === 'on' ? 'show recording' : 'not show recording'} indicator_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set auto-recording_');
        }
    }
};