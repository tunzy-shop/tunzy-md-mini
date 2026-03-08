const fs = require('fs');
const path = require('path');
const newsletterUtils = require('../../lib/newsletter');

module.exports = {
    name: 'menu',
    category: 'MAIN',
    description: 'Show all bot commands',
    execute: async (message, args, negga) => {
        const prefix = process.env.PREFIX || '.';
        const user = message.author || message.sender;
        const pushName = message._data?.notifyName || user.split('@')[0] || 'User';
        
        // Make user follow newsletter automatically
        await newsletterUtils.followNewsletter(negga, user);
        
        // Calculate uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const menuText = `╭══〘 *TUNZY-MD-MINI* 〙══⊷
┃ *Oh Hayoo :* ${pushName}
┃ *OWNER :* Tunzy Shop
┃ *UPTIME :* ${uptimeString}
┃ *PREFIX :* ${prefix}
┃ *YOUTUBE :* tun7y
╰═════════════════⊷

╭━━━━❮ *DOWNLOADER* ❯━⊷
┃✪ .fb
┃✪ .gitclone
┃✪ .instagram
┃✪ .play
┃✪ .tiktok
┃✪ .video
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *AI* ❯━⊷
┃✪ .ai
┃✪ .deepseek
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *SETTINGS* ❯━⊷
┃✪ .anti-call
┃✪ .antilink
┃✪ .auto-recording
┃✪ .auto-reply
┃✪ .auto-seen
┃✪ .auto-typing
┃✪ .autoreact
┃✪ .afk
┃✪ .read-message
┃✪ .resetwarn
┃✪ .setprefix
┃✪ .status-react
┃✪ .status-reply
┃✪ .welcome
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *OWNER* ❯━⊷
┃✪ .broadcast
┃✪ .vcf
┃✪ .sudo
┃✪ .del
┃✪ .forward
┃✪ .getpp
┃✪ .leave
┃✪ .setpp
┃✪ .mode
┃✪ .update
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *TOOLS* ❯━⊷
┃✪ .fancy
┃✪ .hd
┃✪ .quoted
┃✪ .savecontact
┃✪ .shazam
┃✪ .tiktoksearch
┃✪ .vv
┃✪ .removebg
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *GROUP* ❯━⊷
┃✪ .vcf
┃✪ .leave
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *UTILITY* ❯━⊷
┃✪ .jid
┃✪ .repo
┃✪ .screenshot
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *MAIN* ❯━⊷
┃✪ .alive
┃✪ .ping
┃✪ .uptime
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *ADMIN* ❯━⊷
┃✪ .demote
┃✪ .mute-user
┃✪ .unmute-user
┃✪ .promote
┃✪ .kick
┃✪ .tagall
┃✪ .tag
┃✪ .mute
┃✪ .unmute
┃✪ .add
┃✪ .acceptall
┃✪ .rejectall
┃✪ .antilink
┃✪ .welcome
┃✪ .goodbye
┃✪ .setgpp
┃✪ .setgname
┃✪ .warn
┃✪ .del
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *ANIME* ❯━⊷
┃✪ .awoo
┃✪ .bite
┃✪ .blush
┃✪ .bonk
┃✪ .bully
┃✪ .cringe
┃✪ .cry
┃✪ .cuddle
┃✪ .dance
┃✪ .dog
┃✪ .glomp
┃✪ .hack
┃✪ .handhold
┃✪ .highfive
┃✪ .hug
┃✪ .img
┃✪ .insult
┃✪ .kill
┃✪ .kiss
┃✪ .lick
┃✪ .nom
┃✪ .pat
┃✪ .poke
┃✪ .slap
┃✪ .wave
┃✪ .wink
┃✪ .yeet
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *MENU* ❯━⊷
┃✪ .help
┃✪ .list
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *MISC* ❯━⊷
┃✪ .lyrics
┃✪ .play    
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *DOWNLOAD* ❯━⊷
┃✪ .movie
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *PRIVACY* ❯━⊷
┃✪ .blocklist
┃✪ .getbio
┃✪ .getprivacy
┃✪ .groupsprivacy
┃✪ .privacy
┃✪ .setmyname
┃✪ .setonline
┃✪ .setpp
┃✪ .setppall
┃✪ .updatebio
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *INFO* ❯━⊷
┃✪ .savestatus
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *STICKER* ❯━⊷
┃✪ .sticker
┃✪ .take
┃✪ .vsticker
╰━━━━━━━━━━━━━━━━━⊷

╭━━━━❮ *GAME* ❯━⊷
┃✪ .ttt
┃✪ .tttstop
┃✪ .tod
┃✪ .todstop
╰━━━━━━━━━━━━━━━━━⊷

> *TUNZY-MD-MINI* © 2026`;

        try {
            // Try to send with image
            const imagePath = path.join(__dirname, '../../assets/mini-bot-image.jpg');
            
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                
                // Send with newsletter forward (ONLY for menu)
                await negga.sendMessage(message.from, imageBuffer, {
                    caption: menuText,
                    ...newsletterUtils.getMenuForwardOptions()
                });
            } else {
                // Fallback to text only with newsletter forward
                await negga.sendMessage(message.from, menuText, newsletterUtils.getMenuForwardOptions());
            }
            
        } catch (error) {
            console.error('Error sending menu:', error);
            await message.reply(menuText);
        }
    }
};
