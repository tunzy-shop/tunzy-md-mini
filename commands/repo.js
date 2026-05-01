module.exports = {
    command: ['repo', 'source', 'sc'],
    execute: async ({ sock, msg, from, reply, BOT_NAME }) => {
        try {
            reply(`✓ *${BOT_NAME} Repository*\n\n🔗 https://github.com/tunzy-shop/tunzy-md-mini\n\n⭐ Star this repo if you like the bot!\n🍴 Fork to create your own bot\n📝 Report issues on GitHub\n\n_Thanks for using ${BOT_NAME}_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to get repo info_');
        }
    }
};