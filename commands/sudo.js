module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const num = args[0]?.replace(/[^0-9]/g, '');
        if (!num) return reply(`〆 _Usage : ${PREFIX}sudo <number>_`);
        await reply(`✓ *+${num}* added as sudo.`);
    }
};