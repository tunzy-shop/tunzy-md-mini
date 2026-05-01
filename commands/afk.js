module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const reason = args.join(' ') || 'No reason given';
        await reply(`✓ *AFK Mode :* On\n✓ *Reason :* \`${reason}\``);
    }
};