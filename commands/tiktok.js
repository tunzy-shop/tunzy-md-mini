module.exports = {
    command: ['tiktok', 'tt', 'ttdl'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const url = args[0];
            if (!url) return reply('_〆 Please provide TikTok URL_\n✓ Example: !tiktok https://www.tiktok.com/@user/video/xxxxx');
            
            if (!url.includes('tiktok.com')) {
                return reply('_〆 Invalid TikTok URL!_');
            }
            
            await reply('✓ Downloading TikTok video...');
            
            const api = await fetch(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
            const data = await api.json();
            
            if (!data.status || !data.data) {
                return reply('_〆 Failed to download! Video might be private_');
            }
            
            const videoUrl = data.data.play;
            if (!videoUrl) return reply('_〆 No video found_');
            
            await sock.sendMessage(from, { 
                video: { url: videoUrl },
                caption: `✓ TikTok downloaded!\n🎵 Music: ${data.data.music || 'Unknown'}\n👤 Author: ${data.data.author || 'Unknown'}`,
                contextInfo: {
                    externalAdReply: {
                        title: data.data.title || 'TikTok Video',
                        body: 'Downloaded by Bot',
                        thumbnailUrl: data.data.cover || ''
                    }
                }
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to fetch TikTok content_');
        }
    }
};