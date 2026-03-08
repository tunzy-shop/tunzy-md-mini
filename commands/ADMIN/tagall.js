module.exports = {
    name: 'tagall',
    category: 'ADMIN',
    description: 'Tag all group members',
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
        
        const text = args.join(' ') || '_Tag all_';
        let mentions = [];
        
        for (let participant of chat.participants) {
            mentions.push(participant.id._serialized);
        }
        
        await negga.sendMessage(message.from, text, { mentions });
    }
};