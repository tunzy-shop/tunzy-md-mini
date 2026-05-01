module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, { text: `〆 _Video sticker coming soon!_` }, { quoted: msg });
    }
};