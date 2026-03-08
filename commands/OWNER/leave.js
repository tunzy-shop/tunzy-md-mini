module.exports = {
    name: 'leave',
    category: 'OWNER',
    description: 'Leave group',
    execute: async (message, args, negga) => {
        const ownerNumber = process.env.OWNER_NUMBER + '@c.us';
        
        // Check if user is owner
        if (message.author !== ownerNumber) {
            return message.reply('_This command is for owner only_');
        }
        
        if (!message.isGroup) {
            return message.reply('_This command only works in groups_');
        }
        
        await message.reply('_Goodbye everyone_');
        await message.getChat().leave();
    }
};