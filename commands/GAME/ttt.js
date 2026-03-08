// Simple Tic Tac Toe game
let games = {};

module.exports = {
    name: 'ttt',
    category: 'GAME',
    description: 'Play Tic Tac Toe',
    execute: async (message, args, negga) => {
        const chatId = message.from;
        
        if (games[chatId]) {
            return message.reply('_A game is already in progress_');
        }
        
        // Initialize game
        games[chatId] = {
            board: ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'],
            turn: 'X',
            players: [message.author],
            moves: 0
        };
        
        const board = games[chatId].board;
        const display = `
_Current board:_
${board[0]} ${board[1]} ${board[2]}
${board[3]} ${board[4]} ${board[5]}
${board[6]} ${board[7]} ${board[8]}

_Turn: Player ${games[chatId].turn}_
_Use .ttt 1-9 to place your mark_`;
        
        await message.reply(display);
        
        // Game timeout after 5 minutes
        setTimeout(() => {
            if (games[chatId]) {
                delete games[chatId];
            }
        }, 300000);
    }
};