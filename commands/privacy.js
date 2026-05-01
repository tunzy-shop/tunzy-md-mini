module.exports = {
    execute: async ({ sock, msg, from }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        try {
            const p = await sock.fetchPrivacySettings(true);
            await reply(
                `✓ *Privacy Settings*\n\n` +
                `✓ \`Last Seen : ${p.last || 'N/A'}\`\n` +
                `✓ \`Online : ${p.online || 'N/A'}\`\n` +
                `✓ \`Profile : ${p.profile || 'N/A'}\`\n` +
                `✓ \`Status : ${p.status || 'N/A'}\`\n` +
                `✓ \`Groups : ${p.groupadd || 'N/A'}\``
            );
        } catch { await reply(`〆 _Could not fetch privacy settings._`); }
    }
};