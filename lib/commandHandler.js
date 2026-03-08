const fs = require('fs');
const path = require('path');
const sessionManager = require('./redis');
const newsletterUtils = require('./newsletter');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.categories = new Map();
        this.loadCommands();
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        
        if (!fs.existsSync(commandsPath)) {
            console.error('Commands folder not found!');
            return;
        }

        const categories = fs.readdirSync(commandsPath);

        categories.forEach(category => {
            const categoryPath = path.join(commandsPath, category);
            
            if (fs.statSync(categoryPath).isDirectory()) {
                const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
                
                commandFiles.forEach(file => {
                    try {
                        const command = require(path.join(categoryPath, file));
                        
                        if (command.name && command.execute) {
                            this.commands.set(command.name, command);
                            
                            if (!this.categories.has(category)) {
                                this.categories.set(category, []);
                            }
                            this.categories.get(category).push(command);
                            console.log(`✅ Loaded command: ${command.name} from ${category}`);
                        } else {
                            console.log(`❌ Invalid command format in ${file}`);
                        }
                    } catch (error) {
                        console.error(`Error loading command ${file}:`, error);
                    }
                });
            }
        });
        
        console.log(`✅ Total loaded: ${this.commands.size} commands`);
    }

    async handle(message, sessionId, negga) {
        const prefix = process.env.PREFIX || '.';
        
        if (!message.body || !message.body.startsWith(prefix)) return;

        const args = message.body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = this.commands.get(commandName);
        
        if (!command) {
            return;
        }

        try {
            // Increment command count
            await sessionManager.incrementCommandCount(commandName);
            
            // Execute command with negga (client)
            await command.execute(message, args, negga);
            
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await message.reply(`╭══〘 *ERROR* 〙══⊷
┃ Error executing command
┃ Please try again later
╰═════════════════⊷`);
        }
    }

    getCommandsByCategory(category) {
        return this.categories.get(category) || [];
    }

    getAllCommands() {
        return Array.from(this.commands.values());
    }

    getCommand(name) {
        return this.commands.get(name);
    }
}

module.exports = new CommandHandler();
