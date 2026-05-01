module.exports = {
    command: ['play', 'song', 'music'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const query = args.join(' ');
            if (!query) return reply('_〆 Please provide song name_\n✓ Example: !play Blinding Lights');
            
            await reply(`✓ Searching for "${query}"...`);
            
            const api = await fetch(`https://api.siputzx.my.id/api/s/ytsearch?query=${encodeURIComponent(query)}`);
            const data = await api.json();
            
            if (!data.status || !data.data || data.data.length === 0) {
                return reply('_〆 No results found!_');
            }
            
            const song = data.data[0];
            const audioApi = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(song.url)}`);
            const audioData = await audioApi.json();
            
            if (!audioData.status || !audioData.data) {
                return reply('_〆 Failed to get audio_');
            }
            
            await sock.sendMessage(from, {
                audio: { url: audioData.data.url },
                mimetype: 'audio/mpeg',
                fileName: `${song.title}.mp3`,
                caption: `✓ *${song.title}*\n📺 Channel: ${song.channel}\n⏱️ Duration: ${song.duration}\n📥 Downloaded successfully!`
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to download music_');
        }
    }
};