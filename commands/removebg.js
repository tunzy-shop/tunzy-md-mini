module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, { text: `〆 _Remove BG coming soon!_` }, { quoted: msg });
    }
};