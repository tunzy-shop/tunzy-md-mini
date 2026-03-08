module.exports = {
    name: 'broadcast',
    category: 'OWNER',
    description: 'Broadcast to all chats',
    execute: async (message, args, negga) => {
        const ownerNumber = process.env.OWNER_NUMBER + '@c.us';
        
        // Check if user is owner
        if (message.author !== ownerNumber) {
            return message.reply('_This command is for owner only_');
        }
        
        const broadcastMsg = args.join(' ');
        if (!broadcastMsg) {
            return message.reply('_Please provide message to broadcast_');
        }
        
        await message.reply('_Broadcasting..._');
        
        const chats = await negga.getChats();
        let sent = 0;
        let failed = 0;
        
        for (const chat of chats) {
            try {
                await negga.sendMessage(chat.id._serialized, 
                    `_Broadcast from owner:_\n_${broadcastMsg}_`);
                sent++;
            } catch (e) {
                failed++;
            }
        }
        
        await negga.sendMessage(message.from, 
            `_Broadcast complete_\n_Sent: ${sent}_\n_Failed: ${failed}_`);
    }
};