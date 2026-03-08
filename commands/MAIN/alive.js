module.exports = {
    name: 'alive',
    category: 'MAIN',
    description: 'Check if bot is alive',
    execute: async (message, args, negga) => {
        const user = message.author || message.sender;
        
        // Auto follow newsletter
        try {
            await negga.newsletterFollow('120363422591784062@newsletter');
        } catch (e) {}
        
        await negga.sendMessage(message.from, '_TUNZY-MD-MINI is active_', {
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363422591784062@newsletter',
                newsletterName: 'TUNZY-TECH'
            }
        });
    }
};