module.exports = {
    execute: async ({ sock, msg, from }) => {
        const list = [
            '*Truth :* What is your biggest secret?',
            '*Dare :* Send a voice note singing!',
            '*Truth :* Who do you have a crush on?',
            '*Dare :* Change your status for 1 hour!',
            '*Truth :* Last person you texted?',
            '*Dare :* Send a selfie right now!',
            '*Truth :* Most embarrassing moment?',
            '*Dare :* Say "I love TUNZY-MD-MINI!" out loud!',
            '*Truth :* What do you think about me?',
            '*Dare :* Do 20 pushups right now!',
        ];
        await sock.sendMessage(from, {
            text: `✓ *TRUTH OR DARE*\n\n${list[Math.floor(Math.random() * list.length)]}`
        }, { quoted: msg });
    }
};