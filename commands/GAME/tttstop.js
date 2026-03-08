let games = {};

module.exports = {
    name: 'tttstop',
    category: 'GAME',
    description: 'Stop Tic Tac Toe',
    execute: async (message, args, negga) => {
        const chatId = message.from;
        
        if (games[chatId]) {
            delete games[chatId];
            await message.reply('_Game stopped_');
        } else {
            await message.reply('_No game in progress_');
        }
    }
};