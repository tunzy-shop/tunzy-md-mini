module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const name = args.join(' ');
        if (!name) return reply(`〆 _Usage : ${PREFIX}setbotname <name>_`);
        await reply(`✓ *Bot name* set to : \`${name}\`\n✓ _Restart to apply._`);
    }
};