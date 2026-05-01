module.exports = {
    execute: async ({ sock, msg, from }) => {
        await sock.sendMessage(from, {
            text:
                `✓ *TIC TAC TOE*\n\n` +
                `1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\n` +
                `〆 _Full game coming soon!_`
        }, { quoted: msg });
    }
};