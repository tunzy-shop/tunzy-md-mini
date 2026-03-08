const { Client, LocalAuth } = require('whatsapp-web.js');
const sessionManager = require('../lib/redis');
const commandHandler = require('../lib/commandHandler');
const newsletterUtils = require('../lib/newsletter');

let client = null;
let activeSessions = new Map();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, sessionId = 'default' } = req.body || req.query;

    try {
        switch(action) {
            case 'start':
                if (!client) {
                    client = new Client({
                        authStrategy: new LocalAuth({
                            dataPath: `/tmp/auth-${sessionId}`
                        }),
                        puppeteer: {
                            headless: true,
                            args: [
                                '--no-sandbox',
                                '--disable-setuid-sandbox',
                                '--disable-dev-shm-usage',
                                '--disable-accelerated-2d-canvas',
                                '--no-first-run',
                                '--no-zygote',
                                '--disable-gpu'
                            ]
                        }
                    });

                    setupEventHandlers(client, sessionId);
                    await client.initialize();
                    activeSessions.set(sessionId, client);
                    await sessionManager.setBotStatus(sessionId, 'starting');
                }
                
                res.json({ 
                    success: true, 
                    message: 'TUNZY-MD-MINI starting...',
                    version: process.env.BOT_VERSION,
                    newsletter: newsletterUtils.getNewsletterName()
                });
                break;

            case 'stop':
                if (client) {
                    await client.destroy();
                    client = null;
                    activeSessions.delete(sessionId);
                    await sessionManager.setBotStatus(sessionId, 'off');
                }
                res.json({ success: true, message: 'Bot stopped' });
                break;

            case 'restart':
                if (client) {
                    await client.destroy();
                    client = null;
                    activeSessions.delete(sessionId);
                }
                
                client = new Client({
                    authStrategy: new LocalAuth({
                        dataPath: `/tmp/auth-${sessionId}`
                    }),
                    puppeteer: { headless: true }
                });
                
                setupEventHandlers(client, sessionId);
                await client.initialize();
                activeSessions.set(sessionId, client);
                await sessionManager.setBotStatus(sessionId, 'running');
                
                res.json({ success: true, message: 'Bot restarted' });
                break;

            case 'delete-session':
                if (client) {
                    await client.destroy();
                    client = null;
                    activeSessions.delete(sessionId);
                }
                
                await sessionManager.deleteSession(sessionId);
                await sessionManager.setBotStatus(sessionId, 'off');
                
                res.json({ success: true, message: 'Session deleted' });
                break;

            case 'status':
                const status = await sessionManager.getBotStatus(sessionId);
                const isConnected = client ? client.info ? true : false : false;
                const stats = await sessionManager.getStats();
                
                res.json({
                    success: true,
                    status: status || 'off',
                    connected: isConnected,
                    sessionId,
                    version: process.env.BOT_VERSION,
                    newsletter: newsletterUtils.getNewsletterName(),
                    stats: stats,
                    botInfo: client?.info || null
                });
                break;

            default:
                res.json({ 
                    name: process.env.BOT_NAME,
                    version: process.env.BOT_VERSION,
                    commands: '100+',
                    owner: 'Tunzy Shop',
                    newsletter: newsletterUtils.getNewsletterName(),
                    youtube: 'tun7y',
                    prefix: process.env.PREFIX
                });
        }
    } catch (error) {
        console.error('Bot API error:', error);
        res.status(500).json({ error: error.message });
    }
};

function setupEventHandlers(client, sessionId) {
    client.on('qr', async (qr) => {
        console.log('QR received for session:', sessionId);
        await sessionManager.setAuthState(sessionId, { type: 'qr', qr });
    });

    client.on('authenticated', async () => {
        console.log('Authenticated for session:', sessionId);
        await sessionManager.setBotStatus(sessionId, 'authenticated');
    });

    client.on('ready', async () => {
        console.log('✅ TUNZY-MD-MINI is ready!');
        await sessionManager.setBotStatus(sessionId, 'connected');
        
        try {
            const ownerNumber = process.env.OWNER_NUMBER + '@c.us';
            await client.sendMessage(ownerNumber, 
                `╭══〘 *TUNZY-MD-MINI* 〙══⊷
┃ *Status :* Online
┃ *Session :* ${sessionId}
┃ *Newsletter :* ${newsletterUtils.getNewsletterName()}
┃ *Prefix :* ${process.env.PREFIX}
╰═════════════════⊷

> Bot is ready to use!`
            );
        } catch (e) {
            console.error('Error sending startup message:', e);
        }
    });

    client.on('message', async (message) => {
        await commandHandler.handle(message, sessionId, client);
    });

    client.on('group_join', async (notification) => {
        const chat = await notification.getChat();
        await chat.sendMessage(`╭══〘 *WELCOME* 〙══⊷
┃ Welcome to the group!
┃ Use ${process.env.PREFIX}menu to see commands
┃ Follow our newsletter: ${newsletterUtils.getNewsletterName()}
╰═════════════════⊷`);
    });

    client.on('disconnected', async (reason) => {
        console.log('Bot disconnected:', reason);
        await sessionManager.setBotStatus(sessionId, 'disconnected');
        activeSessions.delete(sessionId);
    });
                          }
