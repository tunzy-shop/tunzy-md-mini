module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, { text: `✓ *Truth or Dare* stopped!` }, { quoted: msg });
    }
};