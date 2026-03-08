module.exports = {
    name: 'list',
    category: 'MENU',
    description: 'List commands',
    execute: async (message, args, negga) => {
        const user = message.author || message.sender;
        
        // Auto follow newsletter
        try {
            await negga.newsletterFollow('120363422591784062@newsletter');
        } catch (e) {}
        
        await negga.sendMessage(message.from, 
            `_Available commands: use .menu_`, {
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363422591784062@newsletter',
                newsletterName: 'TUNZY-TECH'
            }
        });
    }
};