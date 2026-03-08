const commandHandler = require('../lib/commandHandler');
const newsletterUtils = require('../lib/newsletter');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const commands = commandHandler.getAllCommands().map(cmd => ({
        name: cmd.name,
        category: cmd.category,
        description: cmd.description
    }));
    
    // Group by category
    const categories = {};
    commands.forEach(cmd => {
        if (!categories[cmd.category]) {
            categories[cmd.category] = [];
        }
        categories[cmd.category].push(cmd);
    });
    
    res.json({
        success: true,
        total: commands.length,
        categories: Object.keys(categories),
        commands: commands,
        grouped: categories,
        newsletter: newsletterUtils.getNewsletterName(),
        prefix: process.env.PREFIX
    });
};
