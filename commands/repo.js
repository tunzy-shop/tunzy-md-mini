module.exports = {
    execute: async ({ sock, msg, from, BOT_NAME, VERSION }) => {
        await sock.sendMessage(from, {
            text:
                `✓ \`Bot : ${BOT_NAME}\`\n` +
                `✓ \`Version : ${VERSION}\`\n` +
                `✓ \`Repo : github.com/tunzy-shop/tunzy-md-mini\``
        }, { quoted: msg });
    }
};