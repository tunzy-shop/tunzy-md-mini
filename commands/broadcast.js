module.exports = {
    execute: async ({ sock, msg, from, args, senderIsOwner, PREFIX }) => {
        const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
        if (!senderIsOwner) return reply(`〆 _This command is for the owner only._`);
        const text = args.join(' ');
        if (!text) return reply(`〆 _Usage : ${PREFIX}broadcast <message>_`);
        const chats = await sock.groupFetchAllParticipating();
        let sent = 0;
        for (const chat of Object.values(chats)) {
            try { await sock.sendMessage(chat.id, { text: `*Broadcast :*\n\n${text}` }); sent++; } catch {}
        }
        await reply(`✓ *Broadcast* sent to \`${sent}\` groups.`);
    }
};