module.exports = {
    command: ['fb', 'facebook', 'fbdl'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const url = args[0];
            if (!url) return reply('_〆 Please provide Facebook URL_\n✓ Example: !fb https://www.facebook.com/watch?v=xxxxx');
            
            if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
                return reply('_〆 Invalid Facebook URL!_');
            }
            
            await reply('✓ Processing Facebook video...');
            
            const api = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
            const data = await api.json();
            
            if (!data.status || !data.data) {
                return reply('_〆 Failed to download! Try a different link_');
            }
            
            let videoUrl = data.data.hd || data.data.sd;
            if (!videoUrl) return reply('_〆 No video found_');
            
            await sock.sendMessage(from, { 
                video: { url: videoUrl },
                caption: '✓ Facebook video downloaded successfully!'
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to fetch Facebook content_');
        }
    }
};