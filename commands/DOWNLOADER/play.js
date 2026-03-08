const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');

module.exports = {
    name: 'play',
    category: 'DOWNLOADER',
    description: 'Download audio from YouTube',
    execute: async (message, args, negga) => {
        const query = args.join(' ');
        if (!query) {
            return message.reply('_Please provide song name or YouTube URL_');
        }
        
        await message.reply('_Searching..._');
        
        try {
            // Check if it's a URL or search query
            if (ytdl.validateURL(query)) {
                // Direct URL
                await message.reply('_Downloading audio..._');
                
                const info = await ytdl.getInfo(query);
                const title = info.videoDetails.title;
                const audioStream = ytdl(query, { quality: 'lowestaudio' });
                
                const tempFile = path.join(tmpdir(), `audio-${Date.now()}.mp3`);
                const writeStream = fs.createWriteStream(tempFile);
                
                audioStream.pipe(writeStream);
                
                writeStream.on('finish', async () => {
                    const audioBuffer = fs.readFileSync(tempFile);
                    
                    await negga.sendMessage(message.from, audioBuffer, {
                        mimetype: 'audio/mpeg',
                        filename: `${title}.mp3`
                    });
                    
                    fs.unlinkSync(tempFile);
                });
                
            } else {
                // Search query
                const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                await negga.sendMessage(message.from, 
                    `_Search results for: ${query}_\n_${searchUrl}_`);
            }
            
        } catch (error) {
            console.error('Play error:', error);
            await message.reply('_Failed to download audio_');
        }
    }
};