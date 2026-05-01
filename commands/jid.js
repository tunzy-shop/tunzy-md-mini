module.exports = {
    execute: async ({ sock, msg, from, sender }) => {
        await sock.sendMessage(from, {
            text:
                `✓ \`Chat JID : ${from}\`\n` +
                `✓ \`Sender JID : ${sender}\``
        }, { quoted: msg });
    }
};