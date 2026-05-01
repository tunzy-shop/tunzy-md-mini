module.exports = {
    command: ['deepseek', 'ds'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const query = args.join(' ');
            if (!query) return reply('_〆 Please provide a message_\n✓ Example: !deepseek Explain quantum physics');
            
            await reply('🧠 *DeepSeek is thinking...*');
            
            const api = await fetch(`https://api.siputzx.my.id/api/ai/deepseek?query=${encodeURIComponent(query)}`);
            const data = await api.json();
            
            if (!data.status || !data.data) {
                return reply('_〆 DeepSeek service is unavailable_');
            }
            
            reply(`✓ *DeepSeek AI:*\n\n${data.data.result || data.data.response}`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to get DeepSeek response_');
        }
    }
};