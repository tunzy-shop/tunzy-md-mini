const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'tod',
    category: 'GAME',
    description: 'Truth or Dare',
    execute: async (message, args, negga) => {
        const choices = ['truth', 'dare'];
        const choice = choices[Math.floor(Math.random() * choices.length)];
        await negga.sendMessage(message.from, 
            `_${choice}_`, 
            newsletterUtils.getNormalOptions()
        );
    }
};