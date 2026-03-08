module.exports = {
    name: 'welcome',
    category: 'GROUP',
    description: 'Set welcome message',
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
        
        const welcomeMsg = args.join(' ') || 'Welcome to the group';
        
        // Store in memory/redis (you can add Redis later)
        // For now, just confirm
        await message.reply(`_Welcome message set to:_\n_${welcomeMsg}_`);
    }
};