module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const bio = args.join(' ');
        if (!bio) return reply(`〆 _Usage : ${PREFIX}updatebio <bio>_`);
        await sock.updateProfileStatus(bio);
        await reply(`✓ *Bio* updated.`);
    }
};