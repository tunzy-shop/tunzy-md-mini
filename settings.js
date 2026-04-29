require('dotenv').config();
module.exports = {
    botName:  process.env.BOT_NAME   || 'TUNZY-MD-MINI',
    botOwner: process.env.OWNER_NAME || 'TUNZY SHOP',
    prefix:   process.env.PREFIX     || '.',
    packname: 'TUNZY-MD-MINI',
    author:   '© TUNZY SHOP',
    version:  '1.00',
    BOT_IMG:  process.env.BOT_IMG    || 'https://telegra.ph/file/your-bot-image.jpg',
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '',
};