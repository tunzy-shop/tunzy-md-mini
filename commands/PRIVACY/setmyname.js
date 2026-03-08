const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'setmyname',
    category: 'PRIVACY',
    description: 'Set your name',
    execute: async (message, args, negga) => {
        const name = args.join(' ');
        if (!name) {
            return message.reply('_Please provide name_');
        }
        
        await negga.sendMessage(message.from, 
            `_Name set to: ${name}_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};