// server.js - Main entry point for Render
const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const sessionManager = require('./src/lib/redis');
const commandHandler = require('./src/lib/commandHandler');
const newsletterUtils = require('./src/lib/newsletter');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/public')));

// Store bot instance
let client = null;
let clientReady = false;
let currentQR = null;
let currentPairingCode = null;

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// API Routes
app.post('/api/bot', async (req, res) => {
    const { action, phoneNumber } = req.body;
    
    try {
        switch(action) {
            case 'start':
                if (!client) {
                    const clientOptions = {
                        authStrategy: new LocalAuth({
                            dataPath: path.join(__dirname, 'session-data')
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
                    
                    if (phoneNumber) {
                        clientOptions.pairingPhoneNumber = phoneNumber;
                    }
                    
                    client = new Client(clientOptions);
                    setupClientEvents(client);
                    await client.initialize();
                }
                
                res.json({ 
                    success: true, 
                    message: phoneNumber ? 'Check phone for pairing code' : 'QR code generated',
                    method: phoneNumber ? 'pairing' : 'qr'
                });
                break;
                
            case 'stop':
                if (client) {
                    await client.destroy();
                    client = null;
                    clientReady = false;
                }
                res.json({ success: true, message: 'Bot stopped' });
                break;
                
            case 'status':
                res.json({
                    success: true,
                    status: clientReady ? 'connected' : (client ? 'starting' : 'off'),
                    connected: clientReady,
                    qr: currentQR,
                    pairingCode: currentPairingCode
                });
                break;
                
            default:
                res.json({ 
                    success: false, 
                    message: 'Unknown action' 
                });
        }
    } catch (error) {
        console.error('Bot error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/status', async (req, res) => {
    res.json({
        authenticated: clientReady,
        qr: currentQR,
        pairingCode: currentPairingCode
    });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected to socket');
    
    if (currentQR) {
        socket.emit('qr', currentQR);
    }
    
    if (currentPairingCode) {
        socket.emit('pairing-code', currentPairingCode);
    }
    
    if (clientReady) {
        socket.emit('ready');
    }
});

function setupClientEvents(client) {
    client.on('qr', async (qr) => {
        console.log('QR Code received');
        currentQR = await qrcode.toDataURL(qr);
        currentPairingCode = null;
        io.emit('qr', currentQR);
    });
    
    client.on('pairing_code', (code) => {
        console.log('Pairing code received:', code);
        currentPairingCode = code;
        currentQR = null;
        io.emit('pairing-code', code);
    });
    
    client.on('ready', () => {
        console.log('✅ Bot is ready!');
        clientReady = true;
        currentQR = null;
        currentPairingCode = null;
        io.emit('ready');
    });
    
    client.on('authenticated', () => {
        console.log('✅ Authenticated');
    });
    
    client.on('auth_failure', (msg) => {
        console.error('Auth failed:', msg);
    });
    
    client.on('disconnected', (reason) => {
        console.log('Bot disconnected:', reason);
        clientReady = false;
        client = null;
    });
    
    client.on('message', async (message) => {
        await commandHandler.handle(message, 'default', client);
    });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ TUNZY-MD-MINI running on port ${PORT}`);
    console.log(`📱 Web dashboard: http://localhost:${PORT}`);
});