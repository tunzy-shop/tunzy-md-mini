module.exports = {
    command: ['uptime', 'runtime'],
    execute: async ({ sock, msg, from, reply, uptime }) => {
        try {
            const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
            const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((uptime % (60 * 1000)) / 1000);
            
            reply(`✓ *Bot Uptime*\n\n📅 ${days} days\n⏰ ${hours} hours\n⏱️ ${minutes} minutes\n⌛ ${seconds} seconds\n\n_Bot has been running smoothly!_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to get uptime_');
        }
    }
};