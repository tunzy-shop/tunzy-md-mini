module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, { text: `✓ *Tic Tac Toe* stopped!` }, { quoted: msg });
    }
};