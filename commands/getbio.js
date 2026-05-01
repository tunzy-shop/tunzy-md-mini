module.exports = {
    execute: async ({ sock, msg, from, args, sender }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        const target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : sender;
        try {
            const status = await sock.fetchStatus(target);
            await reply(`✓ \`Bio : ${status?.status || 'No bio set'}\``);
        } catch { await reply(`〆 _Could not fetch bio._`); }
    }
};