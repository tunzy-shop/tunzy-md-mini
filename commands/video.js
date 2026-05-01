module.exports = {
    command: ['video', 'ytvideo', 'ytmp4'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const query = args.join(' ');
            if (!query) return reply('_〆 Please provide video name or URL_\n✓ Example: !video funny cats');
            
            await reply('✓ Searching for video...');
            
            let url = query;
            if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                const searchApi = await fetch(`https://api.siputzx.my.id/api/s/ytsearch?query=${encodeURIComponent(query)}`);
                const searchData = await searchApi.json();
                if (!searchData.status || !searchData.data || searchData.data.length === 0) {
                    return reply('_〆 No results found!_');
                }
                url = searchData.data[0].url;
            }
            
            const api = await fetch(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`);
            const data = await api.json();
            
            if (!data.status || !data.data) {
                return reply('_〆 Failed to download video_');
            }
            
            await sock.sendMessage(from, {
                video: { url: data.data.url },
                caption: `✓ Video downloaded!\n📹 Quality: ${data.data.quality || 'HD'}\n📥 Size: ${data.data.size || 'Unknown'}`,
                fileName: `video_${Date.now()}.mp4`,
                mimetype: 'video/mp4'
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to download video_');
        }
    }
};