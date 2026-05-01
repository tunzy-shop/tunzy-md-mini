module.exports = {
    command: ['ai', 'chatgpt', 'bot'],
    execute: async ({ sock, msg, from, args, reply, sender }) => {
        try {
            const query = args.join(' ');
            if (!query) return reply('_〆 Please provide a message_\n✓ Example: !ai What is JavaScript?');
            
            await reply('🤖 *Thinking...*');
            
            const api = await fetch(`https://api.siputzx.my.id/api/ai/gpt?query=${encodeURIComponent(query)}`);
            const data = await api.json();
            
            if (!data.status || !data.data) {
                return reply('_〆 AI service is busy. Please try again_');
            }
            
            reply(`✓ *AI Response:*\n\n${data.data.result || data.data.response || data.data.message}`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to get AI response_');
        }
    }
};