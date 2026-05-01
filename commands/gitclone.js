module.exports = {
    command: ['gitclone', 'github'],
    execute: async ({ sock, msg, from, args, reply }) => {
        try {
            const url = args[0];
            if (!url) return reply('_〆 Please provide GitHub repository URL_\n✓ Example: !gitclone https://github.com/user/repo');
            
            if (!url.includes('github.com')) {
                return reply('_〆 Invalid GitHub URL!_');
            }
            
            await reply('✓ Cloning repository info...');
            
            const repoPath = url.replace('https://github.com/', '').replace('.git', '');
            const api = await fetch(`https://api.github.com/repos/${repoPath}`);
            const data = await api.json();
            
            if (data.message === 'Not Found') {
                return reply('_〆 Repository not found!_');
            }
            
            const cloneUrl = data.clone_url;
            const sizeMB = (data.size / 1024).toFixed(2);
            
            await sock.sendMessage(from, {
                text: `✓ *Repository Info*\n\n📁 Name: ${data.full_name}\n📝 Description: ${data.description || 'No description'}\n⭐ Stars: ${data.stargazers_count}\n🍴 Forks: ${data.forks_count}\n📦 Size: ${sizeMB} MB\n🔗 Clone URL: ${cloneUrl}\n\n_Clone using:_ \`git clone ${cloneUrl}\``
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to fetch repository_');
        }
    }
};