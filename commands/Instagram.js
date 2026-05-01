module.exports = {
    command: ['instagram', 'ig', 'igdl'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const url = args[0];
            if (!url) return reply('_〆 Please provide Instagram URL_\n✓ Example: !ig https://www.instagram.com/p/xxxxx');
            
            if (!url.includes('instagram.com')) {
                return reply('_〆 Invalid Instagram URL!_');
            }
            
            await reply('✓ Downloading Instagram content...');
            
            const api = await fetch(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(url)}`);
            const data = await api.json();
            
            if (!data.status || !data.data) {
                return reply('_〆 Failed to download! Make sure the post is public_');
            }
            
            if (data.data.video_versions) {
                await sock.sendMessage(from, { 
                    video: { url: data.data.video_versions[0].url },
                    caption: '✓ Instagram video downloaded successfully!'
                }, { quoted: msg });
            } else if (data.data.image_versions2?.candidates) {
                for (let img of data.data.image_versions2.candidates.slice(0, 5)) {
                    await sock.sendMessage(from, { 
                        image: { url: img.url },
                        caption: '✓ Instagram image downloaded!'
                    }, { quoted: msg });
                }
            } else {
                return reply('_〆 No media found in this post_');
            }
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to fetch Instagram content_');
        }
    }
};