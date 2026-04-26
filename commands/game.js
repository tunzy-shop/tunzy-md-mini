const games = {};
module.exports = {
  command: ['ttt', 'tttstop', 'tod', 'todstop'],
  execute: async ({ sock, msg, from, command, sender }) => {
    const reply = (text) => sock.sendMessage(from, { text }, { quoted: msg });

    if (command === 'tod') {
      const list = [
        '🤔 *Truth:* What is your biggest secret?',
        '😈 *Dare:* Send a voice note singing!',
        '💕 *Truth:* Who do you have a crush on?',
        '😂 *Dare:* Change your status for 1 hour!',
        '📱 *Truth:* Last person you texted?',
        '🤳 *Dare:* Send a selfie right now!',
        '😳 *Truth:* Most embarrassing moment?',
        '🎤 *Dare:* Record yourself saying "I love you" to your contact list!',
        '💭 *Truth:* What do you think about me?',
        '🏃 *Dare:* Do 20 pushups right now!'
      ];
      await reply(`🎮 *TRUTH OR DARE*\n\n${list[Math.floor(Math.random() * list.length)]}`);
    }
    if (command === 'todstop') {
      await reply('🛑 Truth or Dare stopped!');
    }
    if (command === 'ttt') {
      await reply(
        `🎮 *TIC TAC TOE*\n\n` +
        `1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\n` +
        `Reply with a number to play!\n(Full game coming soon)`
      );
    }
    if (command === 'tttstop') {
      await reply('🛑 Tic Tac Toe stopped!');
    }
  }
};