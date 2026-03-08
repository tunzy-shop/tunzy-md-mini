module.exports = {
    name: 'kick',
    category: 'ADMIN',
    description: 'Kick user from group',
    execute: async (message, args, negga) => {
        if (!message.isGroup) {
            return message.reply('_This command only works in groups_');
        }
        
        const chat = await message.getChat();
        
        // Check if sender is admin
        const sender = await message.getContact();
        const isAdmin = chat.participants.some(p => 
            p.id._serialized === sender.id._serialized && p.isAdmin
        );
        
        if (!isAdmin) {
            return message.reply('_Admin only command_');
        }
        
        // Get users to kick
        let users = [];
        
        if (message.mentionedIds.length > 0) {
            users = message.mentionedIds;
        } else if (message.hasQuotedMsg) {
            const quoted = await message.getQuotedMessage();
            users.push(quoted.author);
        } else {
            return message.reply('_Please mention user to kick_');
        }
        
        let kicked = 0;
        for (const user of users) {
            try {
                await chat.removeParticipants([user]);
                kicked++;
            } catch (e) {
                console.error('Kick error:', e);
            }
        }
        
        await message.reply(`_${kicked} user(s) kicked_`);
    }
};