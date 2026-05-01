module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, { text: `〆 _Set group picture coming soon!_` }, { quoted: msg });
    }
};