module.exports = {
    name: 'help',
    category: 'MENU',
    description: 'Show help',
    execute: async (message, args, negga) => {
        const user = message.author || message.sender;
        
        // Auto follow newsletter
        try {
            await negga.newsletterFollow('120363422591784062@newsletter');
        } catch (e) {}
        
        const cmd = args[0];
        if (cmd) {
            await negga.sendMessage(message.from, 
                `_Help for ${cmd}_\n_Use .menu to see all commands_`, {
                isForwarded: true,
                forwardingScore: 1,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363422591784062@newsletter',
                    newsletterName: 'TUNZY-TECH'
                }
            });
        } else {
            await negga.sendMessage(message.from, 
                `_Use .menu to see all commands_`, {
                isForwarded: true,
                forwardingScore: 1,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363422591784062@newsletter',
                    newsletterName: 'TUNZY-TECH'
                }
            });
        }
    }
};