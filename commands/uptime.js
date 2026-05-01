module.exports = {
    execute: async ({ sock, msg, from, uptime }) => {
        await sock.sendMessage(from, {
            text: `✓ \`Uptime : ${uptime}\``
        }, { quoted: msg });
    }
};