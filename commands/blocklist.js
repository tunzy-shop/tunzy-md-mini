module.exports = {
    execute: async ({ sock, msg, from }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        try {
            const list = await sock.fetchBlocklist();
            if (!list.length) return reply(`✓ *Block list* is empty.`);
            await reply(
                `✓ *Blocked Users*\n\n` +
                list.map(n => `✓ \`+${n.replace('@s.whatsapp.net', '')}\``).join('\n')
            );
        } catch { await reply(`〆 _Could not fetch block list._`); }
    }
};