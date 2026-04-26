const axios = require('axios');
const animeList = [
  'awoo', 'bite', 'blush', 'bonk', 'bully', 'cringe', 'cry', 'cuddle',
  'dance', 'dog', 'glomp', 'hack', 'handhold', 'highfive', 'hug', 'img',
  'insult', 'kill', 'kiss', 'lick', 'nom', 'pat', 'poke', 'slap',
  'wave', 'wink', 'yeet'
];

module.exports = {
  command: animeList,
  execute: async ({ sock, msg, from, command, sender, senderNumber }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });
    const target = msg.message?.extendedTextMessage?.contextInfo?.participant;

    try {
      const res = await axios.get(`https://api.waifu.pics/sfw/${command}`, { timeout: 10000 });
      const url = res.data?.url;
      if (!url) throw new Error();
      const imgBuf = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      const caption = target
        ? `*${command.toUpperCase()}* 🎌\n@${senderNumber} ${command}s @${target.split('@')[0]}!`
        : `*${command.toUpperCase()}* 🎌`;
      await sock.sendMessage(from, {
        image: Buffer.from(imgBuf.data),
        caption,
        mentions: target ? [sender, target] : [sender]
      }, { quoted: msg });
    } catch {
      await reply(`🎌 *${command.toUpperCase()}*!`);
    }
  }
};