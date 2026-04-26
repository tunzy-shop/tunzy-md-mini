const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
module.exports = {
  command: ['sticker', 'take', 'vsticker'],
  execute: async ({ sock, msg, from, command, BOT_NAME, OWNER_NAME }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    if (command === 'take') {
      const stickerMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
      if (!stickerMsg) return reply('❌ Reply to a sticker!');
      try {
        const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        await sock.sendMessage(from, {
          sticker: buf,
          stickerMetadata: { packname: BOT_NAME, author: OWNER_NAME }
        }, { quoted: msg });
      } catch { await reply('❌ Failed to take sticker.'); }
    }
    if (command === 'sticker') {
      const imgMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || msg.message?.imageMessage;
      if (!imgMsg) return reply('❌ Reply to an image to make sticker!');
      await reply('⚙️ Sticker creation coming soon! (Requires ffmpeg)');
    }
    if (command === 'vsticker') {
      await reply('🎬 Video sticker coming soon!');
    }
  }
};