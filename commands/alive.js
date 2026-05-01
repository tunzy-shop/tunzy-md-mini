module.exports = {
    command: ['alive', 'status', 'check'],
    execute: async ({ sock, msg, from, reply, BOT_NAME, PREFIX }) => {
        try {
            reply(`✓ *${BOT_NAME} is alive and running!*\n\n🤖 Bot Status: Online ✅\n🔧 Prefix: ${PREFIX}\n⚡ Type ${PREFIX}menu to see all commands\n📱 Platform: WhatsApp\n\n_Ready to serve you!_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to get status_');
        }
    }
};