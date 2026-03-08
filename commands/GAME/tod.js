module.exports = {
    name: 'tod',
    category: 'GAME',
    description: 'Truth or Dare',
    execute: async (message, args, negga) => {
        const truths = [
            'What is your biggest fear?',
            'Have you ever lied to your best friend?',
            'What is your embarrassing memory?',
            'Who is your crush?',
            'What is your biggest secret?'
        ];
        
        const dares = [
            'Sing a song',
            'Do 10 pushups',
            'Send a random emoji',
            'Text your last contact',
            'Post an embarrassing photo'
        ];
        
        const choice = args[0]?.toLowerCase();
        
        if (choice === 'truth') {
            const random = truths[Math.floor(Math.random() * truths.length)];
            await message.reply(`_Truth: ${random}_`);
        } else if (choice === 'dare') {
            const random = dares[Math.floor(Math.random() * dares.length)];
            await message.reply(`_Dare: ${random}_`);
        } else {
            await message.reply('_Usage: .tod truth or .tod dare_');
        }
    }
};