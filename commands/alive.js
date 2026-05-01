module.exports = {
    execute: async ({ sock, msg, from, uptime, BOT_NAME, OWNER_NAME, VERSION, PREFIX }) => {
        await sock.sendMessage(from, {
            text:
                `✓ \`Status : Online\`\n` +
                `✓ \`Uptime : ${uptime}\`\n` +
                `✓ \`Owner : ${OWNER_NAME}\`\n` +
                `✓ \`Version : ${VERSION}\`\n` +
                `✓ \`Prefix : ${PREFIX}\``
        }, { quoted: msg });
    }
};