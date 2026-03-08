const { Client, LocalAuth } = require('whatsapp-web.js');
const sessionManager = require('../lib/redis');
const commandHandler = require('../lib/commandHandler');
const newsletterUtils = require('../lib/newsletter');

let client = null;
let activeSessions = new Map();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, sessionId = 'default', phoneNumber } = req.body || req.query;

    try {
        switch(action) {
            case 'start':
                if (!client) {
                    // ✅ ADDED: Support for phone number for pairing code
                    const clientOptions = {
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
                    };
                    
                    // ✅ ADDED: If phone number provided, enable pairing code
                    if (phoneNumber) {
                        clientOptions.pairingPhoneNumber = phoneNumber;
                        console.log(`🔐 Pairing mode enabled for: ${phoneNumber}`);
                    }

                    client = new Client(clientOptions);
                    setupEventHandlers(client, sessionId);
                    await client.initialize();
                    activeSessions.set(sessionId, client);
                    await sessionManager.setBotStatus(sessionId, 'starting');
                }
                
                res.json({ 
                    success: true, 
                    message: phoneNumber ? 'Check your phone for pairing code!' : 'Scan QR code to connect',
                    method: phoneNumber ? 'pairing' : 'qr',
                    version: process.env.BOT_VERSION,
                    newsletter: newsletterUtils.getNewsletterName()
                });
                break;

            case 'start-with-pairing':
                if (!phoneNumber) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Phone number required for pairing' 
                    });
                }
                
                // ✅ NEW: Start with pairing code specifically
                if (client) {
                    await client.destroy();
                    client = null;
                }
                
                client = new Client({
                    authStrategy: new LocalAuth({
                        dataPath: `/tmp/auth-${sessionId}`
                    }),
                    puppeteer: {
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    },
                    pairingPhoneNumber: phoneNumber  // Enable pairing
                });
                
                setupEventHandlers(client, sessionId);
                await client.initialize();
                activeSessions.set(sessionId, client);
                await sessionManager.setBotStatus(sessionId, 'starting');
                
                res.json({ 
                    success: true, 
                    message: 'Pairing code requested',
                    method: 'pairing',
                    phoneNumber
                });
                break;

            // ... rest of your code
        }
    } catch (error) {
        console.error('Bot API error:', error);
        res.status(500).json({ error: error.message });
    }
};

function setupEventHandlers(client, sessionId) {
    // ✅ QR Code handler
    client.on('qr', async (qr) => {
        console.log('📱 QR received for session:', sessionId);
        await sessionManager.setAuthState(sessionId, { type: 'qr', qr });
    });

    // ✅ NEW: Pairing code handler
    client.on('pairing_code', async (code) => {
        console.log('🔐 Pairing code received:', code);
        await sessionManager.setAuthState(sessionId, { 
            type: 'pairing', 
            code: code 
        });
    });

    client.on('authenticated', async () => {
        console.log('✅ Authenticated for session:', sessionId);
        await sessionManager.setBotStatus(sessionId, 'authenticated');
    });

    client.on('ready', async () => {
        console.log('✅ TUNZY-MD-MINI is ready!');
        await sessionManager.setBotStatus(sessionId, 'connected');
    });

    client.on('message', async (message) => {
        await commandHandler.handle(message, sessionId, client);
    });

    client.on('disconnected', async (reason) => {
        console.log('Bot disconnected:', reason);
        await sessionManager.setBotStatus(sessionId, 'disconnected');
        activeSessions.delete(sessionId);
    });
}