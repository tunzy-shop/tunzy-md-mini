module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, { text: `✓ *Warnings* have been reset!` }, { quoted: msg });
    }
};