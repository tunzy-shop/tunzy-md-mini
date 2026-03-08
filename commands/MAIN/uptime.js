module.exports = {
    name: 'uptime',
    category: 'MAIN',
    description: 'Show bot uptime',
    execute: async (message, args, negga) => {
        const user = message.author || message.sender;
        
        // Auto follow newsletter
        try {
            await negga.newsletterFollow('120363422591784062@newsletter');
        } catch (e) {}
        
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        await negga.sendMessage(message.from, 
            `_Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s_`, {
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363422591784062@newsletter',
                newsletterName: 'TUNZY-TECH'
            }
        });
    }
};