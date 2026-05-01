module.exports = {
    command: ['resetwarn', 'clearwarn'],
    execute: async ({ sock, msg, from, args, reply, isGroup, isAdmin, sender }) => {
        try {
            if (!isGroup) return reply('_〆 This command works in groups only_');
            if (!isAdmin) return reply('_〆 You need admin rights_');
            
            const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const target = mention || args[0]?.replace('@', '') + '@s.whatsapp.net';
            
            if (!target) return reply('_〆 Mention or tag a user to reset their warnings_');
            
            global.warnings = global.warnings || {};
            if (global.warnings[target]) {
                delete global.warnings[target];
                reply(`✓ Warnings reset for @${target.split('@')[0]}!`, { mentions: [target] });
            } else {
                reply('_〆 User has no warnings!_');
            }
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to reset warnings_');
        }
    }
};