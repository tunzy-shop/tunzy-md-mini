module.exports = {
    name: 'del',
    category: 'OWNER',
    description: 'Delete message',
    execute: async (message, args, negga) => {
        const ownerNumber = process.env.OWNER_NUMBER + '@c.us';
        
        // Check if user is owner
        if (message.author !== ownerNumber) {
            return message.reply('_This command is for owner only_');
        }
        
        if (message.hasQuotedMsg) {
            const quoted = await message.getQuotedMessage();
            await quoted.delete();
            await message.delete();
        } else {
            await message.delete();
        }
    }
};