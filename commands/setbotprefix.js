module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const pfx = args[0];
        if (!pfx) return reply(`〆 _Usage : ${PREFIX}setbotprefix <prefix>_`);
        await reply(`✓ *Prefix* set to : \`${pfx}\`\n✓ _Restart to apply._`);
    }
};