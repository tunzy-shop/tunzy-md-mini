const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const QRCode = require('qrcode');
const express = require('express');
const session = require('express-session');

// Global variables
let pairingCode = null;
let qrCode = null;
let connected = false;
let phoneNumber = null;
let sock = null;

// Express server
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'tunzy-secret-2026',
    resave: false,
    saveUninitialized: true
}));

// ========== WEB INTERFACE ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TUNZY-MD-MINI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #0b1421;
                color: white;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container {
                max-width: 400px;
                width: 100%;
                background: #1e2a3a;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
            }
            h1 { margin-bottom: 10px; color: #fff; }
            .subtitle { color: #8899aa; margin-bottom: 30px; }
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            .tab-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 5px;
                background: #2d3f4f;
                color: white;
                cursor: pointer;
                font-size: 16px;
            }
            .tab-btn.active { background: #2563eb; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .qr-container {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                min-height: 250px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .qr-container img { max-width: 100%; border-radius: 5px; }
            .qr-placeholder { color: #64748b; }
            input {
                width: 100%;
                padding: 14px;
                margin: 10px 0;
                border: 2px solid #2d3f4f;
                border-radius: 5px;
                background: #0b1421;
                color: white;
                font-size: 16px;
                box-sizing: border-box;
            }
            input:focus { outline: none; border-color: #2563eb; }
            button {
                width: 100%;
                padding: 14px;
                border: none;
                border-radius: 5px;
                background: #2563eb;
                color: white;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin: 10px 0;
            }
            button:hover { background: #1d4ed8; }
            .code-box {
                background: #0b1421;
                padding: 20px;
                border-radius: 5px;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 8px;
                margin: 20px 0;
                border: 2px solid #2563eb;
                color: #60a5fa;
                font-family: monospace;
            }
            .success-message {
                background: #10b98120;
                color: #10b981;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #10b981;
            }
            .footer { margin-top: 30px; color: #64748b; font-size: 12px; }
            .hidden { display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>TUNZY-MD-MINI</h1>
            <div class="subtitle">Connect your WhatsApp bot</div>
            
            <div class="tab-buttons">
                <button class="tab-btn active" onclick="showTab('qr')">📱 QR Code</button>
                <button class="tab-btn" onclick="showTab('pair')">🔢 Pairing Code</button>
            </div>
            
            <!-- QR Code Tab -->
            <div id="qr-tab" class="tab-content active">
                <div class="qr-container" id="qrDisplay">
                    <div class="qr-placeholder">Waiting for QR code...</div>
                </div>
            </div>
            
            <!-- Pairing Code Tab -->
            <div id="pair-tab" class="tab-content hidden">
                <input type="text" id="phoneNumber" placeholder="e.g., 2349067345425">
                <button onclick="requestPairing()" id="pairBtn">🔑 Generate Pairing Code</button>
                
                <div id="pairCodeContainer" class="hidden">
                    <div style="margin: 20px 0 10px; color: #94a3b8;">Your 8-digit code:</div>
                    <div class="code-box" id="pairCode"></div>
                    <div class="success-message">
                        ✅ Open WhatsApp > Linked Devices > Link with phone number
                    </div>
                </div>
            </div>
            
            <div class="footer">TUNZY-MD-MINI © 2026 | Owner: TUNZY SHOP</div>
        </div>

        <script>
            function showTab(tab) {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                if (tab === 'qr') {
                    document.querySelectorAll('.tab-btn')[0].classList.add('active');
                    document.getElementById('qr-tab').classList.add('active');
                } else {
                    document.querySelectorAll('.tab-btn')[1].classList.add('active');
                    document.getElementById('pair-tab').classList.add('active');
                }
            }
            
            async function requestPairing() {
                const phone = document.getElementById('phoneNumber').value;
                if (!phone) {
                    alert('Please enter your phone number with country code');
                    return;
                }
                
                const btn = document.getElementById('pairBtn');
                btn.disabled = true;
                btn.textContent = '⏳ Generating...';
                
                try {
                    const res = await fetch('/request-pairing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone })
                    });
                    
                    const data = await res.json();
                    
                    if (data.success) {
                        // Show message that code is being generated
                        document.getElementById('pairCodeContainer').classList.remove('hidden');
                        document.getElementById('pairCode').textContent = '⏳ Generating...';
                        
                        // Start checking for the code
                        checkForPairingCode();
                    }
                } catch (error) {
                    alert('Error requesting code');
                }
                
                btn.disabled = false;
                btn.textContent = '🔑 Generate Pairing Code';
            }
            
            async function checkForPairingCode() {
                const checkInterval = setInterval(async () => {
                    const res = await fetch('/status');
                    const data = await res.json();
                    
                    // Update QR if available
                    if (data.qr) {
                        document.getElementById('qrDisplay').innerHTML = \`<img src="\${data.qr}" alt="QR Code">\`;
                    }
                    
                    // Update pairing code if available
                    if (data.pairingCode) {
                        document.getElementById('pairCodeContainer').classList.remove('hidden');
                        document.getElementById('pairCode').textContent = data.pairingCode;
                        clearInterval(checkInterval);
                    }
                }, 2000);
            }
            
            // Check status on load
            checkForPairingCode();
        </script>
    </body>
    </html>
    `);
});

// ========== ADMIN PANEL ==========
app.get('/admin', (req, res) => {
    const password = process.env.ADMIN_PASSWORD || 'Tunzy@2026';
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin - TUNZY-MD-MINI</title>
        <style>
            body { font-family: Arial, sans-serif; background: #0b1421; color: white; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .card { background: #1e2a3a; padding: 20px; border-radius: 10px; margin: 20px 0; }
            button { padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            .status { display: inline-block; padding: 5px 10px; border-radius: 5px; }
            .connected { background: #10b98120; color: #10b981; }
            .disconnected { background: #ef444420; color: #ef4444; }
            input { padding: 10px; width: 200px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container" id="app">
            <h1>Admin Login</h1>
            <div class="card">
                <input type="password" id="password" placeholder="Enter password">
                <button onclick="login()">Login</button>
            </div>
        </div>

        <script>
            function login() {
                const pwd = document.getElementById('password').value;
                if (pwd === '${password}') {
                    localStorage.setItem('auth', 'true');
                    showDashboard();
                } else {
                    alert('Wrong password');
                }
            }
            
            function showDashboard() {
                document.getElementById('app').innerHTML = \`
                    <h1>Admin Dashboard</h1>
                    <div class="card">
                        <h2>Bot Information</h2>
                        <p><strong>Status:</strong> <span id="botStatus">Loading...</span></p>
                        <p><strong>Phone:</strong> <span id="phone">-</span></p>
                        <p><strong>Pairing Code:</strong> <span id="code">-</span></p>
                    </div>
                    <div class="card">
                        <h2>Controls</h2>
                        <button onclick="restart()">🔄 Restart Bot</button>
                        <button onclick="clearSession()">🗑️ Clear Session</button>
                        <button onclick="logout()">🚪 Logout</button>
                    </div>
                \`;
                loadStatus();
            }
            
            async function loadStatus() {
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('botStatus').innerHTML = data.connected ? 
                    '<span class="status connected">Connected</span>' : 
                    '<span class="status disconnected">Disconnected</span>';
                document.getElementById('phone').textContent = data.phoneNumber || 'Not set';
                document.getElementById('code').textContent = data.pairingCode || 'None';
            }
            
            async function restart() {
                if (confirm('Restart bot?')) {
                    await fetch('/admin/restart', { method: 'POST' });
                    alert('Restart command sent');
                }
            }
            
            async function clearSession() {
                if (confirm('Clear session? You will need to reconnect.')) {
                    await fetch('/admin/clear', { method: 'POST' });
                    alert('Session cleared');
                    setTimeout(loadStatus, 2000);
                }
            }
            
            function logout() {
                localStorage.removeItem('auth');
                location.reload();
            }
            
            if (localStorage.getItem('auth')) showDashboard();
            setInterval(() => { if (localStorage.getItem('auth')) loadStatus(); }, 2000);
        </script>
    </body>
    </html>
    `);
});

// ========== API ENDPOINTS ==========
app.get('/status', (req, res) => {
    res.json({
        qr: qrCode,
        pairingCode: pairingCode,
        phoneNumber: phoneNumber,
        connected: connected
    });
});

app.post('/request-pairing', (req, res) => {
    phoneNumber = req.body.phone;
    console.log('📱 Pairing requested for:', phoneNumber);
    
    // Trigger pairing code generation
    if (sock) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                pairingCode = code;
                console.log('✅ Pairing code generated:', code);
            } catch (e) {
                console.log('❌ Pairing error:', e);
            }
        }, 2000);
    }
    
    res.json({ success: true });
});

app.post('/admin/restart', (req, res) => {
    res.json({ success: true });
    setTimeout(() => {
        console.log('🔄 Restarting bot...');
        process.exit(1);
    }, 1000);
});

app.post('/admin/clear', async (req, res) => {
    await fs.remove('session');
    qrCode = null;
    pairingCode = null;
    connected = false;
    res.json({ success: true });
});

// ========== WHATSAPP BOT ==========
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'error' }),
        browser: ['Chrome', 'Linux', '']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Generate QR code image
            qrCode = await QRCode.toDataURL(qr);
            console.log('✅ QR Code generated');
        }

        if (connection === 'open') {
            connected = true;
            console.log('✅ Bot connected to WhatsApp');
            console.log('📱 Phone:', sock.user?.id);
        }

        if (connection === 'close') {
            connected = false;
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Logged out, clearing session');
                await fs.remove('session');
                qrCode = null;
                pairingCode = null;
            } else {
                console.log('🔄 Connection closed, reconnecting...');
                startBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.remoteJid === 'status@broadcast') return;
        
        const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (body === '.ping') {
            await sock.sendMessage(m.key.remoteJid, { text: 'Pong! 🏓' });
        }
        if (body === '.menu') {
            await sock.sendMessage(m.key.remoteJid, { 
                text: '📱 TUNZY-MD-MINI\n\nCommands:\n.ping - Check bot\n.menu - This menu' 
            });
        }
    });

    // Generate pairing code if phone number exists
    if (phoneNumber && !connected) {
        setTimeout(async () => {
            try {
                console.log('🔑 Generating pairing code for:', phoneNumber);
                const code = await sock.requestPairingCode(phoneNumber);
                pairingCode = code;
                console.log('✅ Pairing code:', code);
            } catch (e) {
                console.log('❌ Failed to generate pairing code:', e.message);
            }
        }, 3000);
    }
}

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 TUNZY-MD-MINI Starting...');
    console.log('='.repeat(50));
    console.log('📱 Main page: http://localhost:' + PORT);
    console.log('🔐 Admin: http://localhost:' + PORT + '/admin');
    console.log('🔑 Admin password: ' + (process.env.ADMIN_PASSWORD || 'Tunzy@2026'));
    console.log('='.repeat(50) + '\n');
    
    // Start the bot
    startBot();
});