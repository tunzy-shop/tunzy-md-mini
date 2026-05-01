module.exports = {
    command: ['status-reply', 'statusreply'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const setting = args[0]?.toLowerCase();
            if (!setting || (setting !== 'on' && setting !== 'off')) {
                return reply('_〆 Usage: !status-reply on/off [message]_\n✓ Current: ' + (global.statusReply ? `ON (${global.statusReplyMsg || 'Thanks for the status!'})` : 'OFF'));
            }
            
            if (setting === 'on') {
                global.statusReply = true;
                global.statusReplyMsg = args.slice(1).join(' ') || 'Thanks for the status!';
                reply(`✓ Status reply enabled!\n_〆 Auto-reply: ${global.statusReplyMsg}_`);
            } else {
                global.statusReply = false;
                reply('✓ Status reply disabled!');
            }
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to set status-reply_');
        }
    }
};