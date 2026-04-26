module.exports = {
  command: ['menu', 'help', 'list'],
  execute: async ({ sock, msg, from, sender, senderNumber, uptimeStr, pluginCount, BOT_NAME, OWNER_NAME, BOT_VERSION, PREFIX }) => {
    await sock.sendMessage(from, {
      text:
        `╭═════${BOT_NAME}═════⊷\n` +
        `✓ Hello : @${senderNumber}\n` +
        `✓ Owner : ${OWNER_NAME}\n` +
        `✓ Version : ${BOT_VERSION}\n` +
        `✓ Prefix : ${PREFIX}\n` +
        `✓ Platform : WhatsApp\n` +
        `✓ Plugin : ${pluginCount}\n` +
        `✓ Uptime : ${uptimeStr}\n` +
        `╰═════════════════════⊷\n\n` +
        `╭━━━━❮ *DOWNLOADER* ❯━⊷\n` +
        `┃✓ ${PREFIX}fb\n` +
        `┃✓ ${PREFIX}gitclone\n` +
        `┃✓ ${PREFIX}instagram\n` +
        `┃✓ ${PREFIX}play\n` +
        `┃✓ ${PREFIX}tiktok\n` +
        `┃✓ ${PREFIX}video\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *AI* ❯━⊷\n` +
        `┃✓ ${PREFIX}ai\n` +
        `┃✓ ${PREFIX}deepseek\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *SETTINGS* ❯━⊷\n` +
        `┃✓ ${PREFIX}anti-call\n` +
        `┃✓ ${PREFIX}antilink\n` +
        `┃✓ ${PREFIX}auto-recording\n` +
        `┃✓ ${PREFIX}auto-reply\n` +
        `┃✓ ${PREFIX}auto-seen\n` +
        `┃✓ ${PREFIX}auto-typing\n` +
        `┃✓ ${PREFIX}autoreact\n` +
        `┃✓ ${PREFIX}afk\n` +
        `┃✓ ${PREFIX}read-message\n` +
        `┃✓ ${PREFIX}resetwarn\n` +
        `┃✓ ${PREFIX}setbotprefix\n` +
        `┃✓ ${PREFIX}setbotpic\n` +
        `┃✓ ${PREFIX}setbotname\n` +
        `┃✓ ${PREFIX}status-react\n` +
        `┃✓ ${PREFIX}status-reply\n` +
        `┃✓ ${PREFIX}welcome\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *OWNER* ❯━⊷\n` +
        `┃✓ ${PREFIX}broadcast\n` +
        `┃✓ ${PREFIX}vcf\n` +
        `┃✓ ${PREFIX}sudo\n` +
        `┃✓ ${PREFIX}del\n` +
        `┃✓ ${PREFIX}forward\n` +
        `┃✓ ${PREFIX}getpp\n` +
        `┃✓ ${PREFIX}leave\n` +
        `┃✓ ${PREFIX}setpp\n` +
        `┃✓ ${PREFIX}mode\n` +
        `┃✓ ${PREFIX}update\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *TOOLS* ❯━⊷\n` +
        `┃✓ ${PREFIX}fancy\n` +
        `┃✓ ${PREFIX}hd\n` +
        `┃✓ ${PREFIX}quoted\n` +
        `┃✓ ${PREFIX}savecontact\n` +
        `┃✓ ${PREFIX}shazam\n` +
        `┃✓ ${PREFIX}tiktoksearch\n` +
        `┃✓ ${PREFIX}vv\n` +
        `┃✓ ${PREFIX}removebg\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *GROUP* ❯━⊷\n` +
        `┃✓ ${PREFIX}vcf\n` +
        `┃✓ ${PREFIX}leave\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *UTILITY* ❯━⊷\n` +
        `┃✓ ${PREFIX}jid\n` +
        `┃✓ ${PREFIX}repo\n` +
        `┃✓ ${PREFIX}screenshot\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *MAIN* ❯━⊷\n` +
        `┃✓ ${PREFIX}alive\n` +
        `┃✓ ${PREFIX}ping\n` +
        `┃✓ ${PREFIX}uptime\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *ADMIN* ❯━⊷\n` +
        `┃✓ ${PREFIX}demote\n` +
        `┃✓ ${PREFIX}mute-user\n` +
        `┃✓ ${PREFIX}unmute-user\n` +
        `┃✓ ${PREFIX}promote\n` +
        `┃✓ ${PREFIX}kick\n` +
        `┃✓ ${PREFIX}tagall\n` +
        `┃✓ ${PREFIX}tag\n` +
        `┃✓ ${PREFIX}mute\n` +
        `┃✓ ${PREFIX}unmute\n` +
        `┃✓ ${PREFIX}add\n` +
        `┃✓ ${PREFIX}acceptall\n` +
        `┃✓ ${PREFIX}rejectall\n` +
        `┃✓ ${PREFIX}antilink\n` +
        `┃✓ ${PREFIX}welcome\n` +
        `┃✓ ${PREFIX}goodbye\n` +
        `┃✓ ${PREFIX}setgpp\n` +
        `┃✓ ${PREFIX}setgname\n` +
        `┃✓ ${PREFIX}warn\n` +
        `┃✓ ${PREFIX}del\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *ANIME* ❯━⊷\n` +
        `┃✓ ${PREFIX}awoo\n` +
        `┃✓ ${PREFIX}bite\n` +
        `┃✓ ${PREFIX}blush\n` +
        `┃✓ ${PREFIX}bonk\n` +
        `┃✓ ${PREFIX}bully\n` +
        `┃✓ ${PREFIX}cringe\n` +
        `┃✓ ${PREFIX}cry\n` +
        `┃✓ ${PREFIX}cuddle\n` +
        `┃✓ ${PREFIX}dance\n` +
        `┃✓ ${PREFIX}dog\n` +
        `┃✓ ${PREFIX}glomp\n` +
        `┃✓ ${PREFIX}hack\n` +
        `┃✓ ${PREFIX}handhold\n` +
        `┃✓ ${PREFIX}highfive\n` +
        `┃✓ ${PREFIX}hug\n` +
        `┃✓ ${PREFIX}img\n` +
        `┃✓ ${PREFIX}insult\n` +
        `┃✓ ${PREFIX}kill\n` +
        `┃✓ ${PREFIX}kiss\n` +
        `┃✓ ${PREFIX}lick\n` +
        `┃✓ ${PREFIX}nom\n` +
        `┃✓ ${PREFIX}pat\n` +
        `┃✓ ${PREFIX}poke\n` +
        `┃✓ ${PREFIX}slap\n` +
        `┃✓ ${PREFIX}wave\n` +
        `┃✓ ${PREFIX}wink\n` +
        `┃✓ ${PREFIX}yeet\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *MISC* ❯━⊷\n` +
        `┃✓ ${PREFIX}lyrics\n` +
        `┃✓ ${PREFIX}play\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *DOWNLOAD* ❯━⊷\n` +
        `┃✓ ${PREFIX}movie\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *PRIVACY* ❯━⊷\n` +
        `┃✓ ${PREFIX}blocklist\n` +
        `┃✓ ${PREFIX}getbio\n` +
        `┃✓ ${PREFIX}getprivacy\n` +
        `┃✓ ${PREFIX}groupsprivacy\n` +
        `┃✓ ${PREFIX}privacy\n` +
        `┃✓ ${PREFIX}setmyname\n` +
        `┃✓ ${PREFIX}setonline\n` +
        `┃✓ ${PREFIX}setpp\n` +
        `┃✓ ${PREFIX}setppall\n` +
        `┃✓ ${PREFIX}updatebio\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *INFO* ❯━⊷\n` +
        `┃✓ ${PREFIX}savestatus\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *STICKER* ❯━⊷\n` +
        `┃✓ ${PREFIX}sticker\n` +
        `┃✓ ${PREFIX}take\n` +
        `┃✓ ${PREFIX}vsticker\n` +
        `╰━━━━━━━━━━━━━━━━━⊷\n\n` +
        `╭━━━━❮ *GAME* ❯━⊷\n` +
        `┃✓ ${PREFIX}ttt\n` +
        `┃✓ ${PREFIX}tttstop\n` +
        `┃✓ ${PREFIX}tod\n` +
        `┃✓ ${PREFIX}todstop\n` +
        `╰━━━━━━━━━━━━━━━━━⊷`,
      mentions: [sender]
    }, { quoted: msg });
  }
};