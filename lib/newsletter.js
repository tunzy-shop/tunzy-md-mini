const newsletterConfig = {
    jid: process.env.NEWSLETTER_JID || '120363422591784062@newsletter',
    name: process.env.NEWSLETTER_NAME || 'TUNZY-TECH'
};

const newsletterUtils = {
    // Make user follow newsletter automatically
    async followNewsletter(negga, userJid) {
        try {
            // This makes the user follow the newsletter
            await negga.newsletterFollow(newsletterConfig.jid);
            console.log(`✅ User ${userJid} followed newsletter: ${newsletterConfig.name}`);
            return true;
        } catch (error) {
            console.error('Error following newsletter:', error);
            return false;
        }
    },

    // Check if user is following newsletter
    async isFollowing(negga, userJid) {
        try {
            const followers = await negga.newsletterFollowers(newsletterConfig.jid);
            return followers.includes(userJid);
        } catch (error) {
            console.error('Error checking newsletter follow:', error);
            return false;
        }
    },

    // Get newsletter forward options (ONLY for menu commands)
    getMenuForwardOptions() {
        return {
            isForwarded: true,
            forwardingScore: 1,
            forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterConfig.jid,
                newsletterName: newsletterConfig.name
            }
        };
    },

    // Normal message options (no forward)
    getNormalOptions() {
        return {}; // Empty object = no newsletter forward
    },

    // Check if command should have newsletter forward
    shouldHaveNewsletterForward(commandName) {
        const menuCommands = ['menu', 'help', 'alive', 'ping', 'uptime', 'repo'];
        return menuCommands.includes(commandName.toLowerCase());
    },

    // Get newsletter follow message for users
    getNewsletterFollowMessage() {
        return {
            text: `╭══〘 *NEWSLETTER* 〙══⊷
┃ *Name :* ${newsletterConfig.name}
┃ *ID :* ${newsletterConfig.jid}
┃ *Owner :* Tunzy Shop
╰═════════════════⊷

✅ *You are now following our newsletter!*
You will receive updates about TUNZY-MD-MINI

> TUNZY-MD-MINI © 2026`
        };
    },

    // Get newsletter info
    getNewsletterInfo() {
        return {
            jid: newsletterConfig.jid,
            name: newsletterConfig.name
        };
    },

    // Get newsletter name
    getNewsletterName() {
        return newsletterConfig.name;
    },

    // Get newsletter JID
    getNewsletterJid() {
        return newsletterConfig.jid;
    }
};

module.exports = newsletterUtils;
