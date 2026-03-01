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
global.pairingCode = null;
global.qrCode = null;
global.connected = false;
global.phoneNumber = null;
global.maintenanceMode = false;

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
            h1 { margin-bottom: 10px; }
            .subtitle { color: #8899aa; margin-bottom: 30px; }
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            .tab-btn {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 5px;
                background: #2d3f4f;
                color: white;
                cursor: pointer;
            }
            .tab-btn.active { background: #2563eb; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .qr-container {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .qr-container img { max-width: 100%; }
            input {
                width: 100%;
                padding: 12px;
                margin: 10px 0;
                border: 1px solid #3d4f5f;
                border-radius: 5px;
                background: #0b1421;
                color: white;
                box-sizing: border-box;
            }
            button {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 5px;
                background: #2563eb;
                color: white;
                font-weight: bold;
                cursor: pointer;
                margin: 10px 0;
            }
            .code-box {
                background: #0b1421;
                padding: 20px;
                border-radius: 5px;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 5px;
                margin: 20px 0;
                border: 2px solid #2563eb;
            }
            .status {
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            }
            .status.connected { background: #10b98120; color: #10b981; border: 1px solid #10b981; }
            .status.disconnected { background: #ef444420; color: #ef4444; border: 1px solid #ef4444; }
            .footer { margin-top: 30px; color: #8899aa; font-size: 12px; }
            .hidden { display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>TUNZY-MD-MINI</h1>
            <div class="subtitle">Connect your WhatsApp bot</div>
            
            <div class="tab-buttons">
                <button class="tab-btn active" onclick="showTab('qr')">QR Code</button>
                <button class="tab-btn" onclick="showTab('pair')">Pairing Code</button>
            </div>
            
            <div id="qr-tab" class="tab-content active">
                <div class="qr-container" id="qrDisplay">
                    <div style="color: #8899aa;">Waiting for QR code...</div>
                </div>
                <div id="qrStatus" class="status disconnected">Status: Disconnected</div>
            </div>
            
            <div id="pair-tab" class="tab-content hidden">
                <input type="text" id="phoneNumber" placeholder="Phone with country code">
                <button onclick="requestPairing()">Get Pairing Code</button>
                <div id="pairCodeDisplay" class="hidden">
                    <div class="code-box" id="pairCode"></div>
                </div>
                <div id="pairStatus" class="status disconnected">Status: Disconnected</div>
            </div>
            
            <div class="footer">TUNZY-MD-MINI © 2026 | Owner: TUNZY SHOP</div>
        </div>

        <script>
            function showTab(tab) {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                if (tab === 'qr') {
                    document.querySelector('.tab-btn:first-child').classList.add('active');
                    document.getElementById('qr-tab').classList.add('active');
                } else {
                    document.querySelector('.tab-btn:last-child').classList.add('active');
                    document.getElementById('pair-tab').classList.add('active');
                }
            }
            
            async function requestPairing() {
                const phone = document.getElementById('phoneNumber').value;
                if (!phone) return alert('Enter phone number');
                
                const btn = event.target;
                btn.disabled = true;
                btn.textContent = 'Requesting...';
                
                await fetch('/request-pairing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                
                btn.disabled = false;
                btn.textContent = 'Get Pairing Code';
            }
            
            async function checkStatus() {
                const res = await fetch('/status');
                const data = await res.json();
                
                if (data.qr) document.getElementById('qrDisplay').innerHTML = \`<img src="\${data.qr}">\`;
                if (data.pairingCode) {
                    document.getElementById('pairCodeDisplay').classList.remove('hidden');
                    document.getElementById('pairCode').textContent = data.pairingCode;
                }
                
                const statusClass = data.connected ? 'connected' : 'disconnected';
                const statusText = data.connected ? 'Connected' : 'Disconnected';
                
                document.getElementById('qrStatus').className = 'status ' + statusClass;
                document.getElementById('qrStatus').textContent = 'Status: ' + statusText;
                document.getElementById('pairStatus').className = 'status ' + statusClass;
                document.getElementById('pairStatus').textContent = 'Status: ' + statusText;
            }
            
            setInterval(checkStatus, 2000);
            checkStatus();
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
                        <h2>Bot Status</h2>
                        <p>Status: <span class="status" id="botStatus">Loading...</span></p>
                        <p>Phone: <span id="phone">-</span></p>
                        <p>Pairing Code: <span id="code">-</span></p>
                    </div>
                    <div class="card">
                        <h2>Controls</h2>
                        <button onclick="restart()">Restart</button>
                        <button onclick="clearSession()">Clear Session</button>
                        <button onclick="logout()">Logout</button>
                    </div>
                \`;
                loadStatus();
            }
            
            async function loadStatus() {
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('botStatus').className = 'status ' + (data.connected ? 'connected' : 'disconnected');
                document.getElementById('botStatus').textContent = data.connected ? 'Connected' : 'Disconnected';
                document.getElementById('phone').textContent = data.phoneNumber || '-';
                document.getElementById('code').textContent = data.pairingCode || '-';
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
        qr: global.qrCode,
        pairingCode: global.pairingCode,
        phoneNumber: global.phoneNumber,
        connected: global.connected
    });
});

app.post('/request-pairing', (req, res) => {
    global.phoneNumber = req.body.phone;
    res.json({ success: true });
});

app.post('/admin/restart', (req, res) => {
    res.json({ success: true });
    setTimeout(() => process.exit(1), 1000);
});

app.post('/admin/clear', async (req, res) => {
    await fs.remove('session');
    res.json({ success: true });
});

// ========== WHATSAPP BOT ==========
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'error' }),
        browser: ['Chrome', 'Linux', '']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            global.qrCode = await QRCode.toDataURL(qr);
            console.log('QR Code generated');
        }

        if (connection === 'open') {
            global.connected = true;
            console.log('✅ Connected to WhatsApp');
        }

        if (connection === 'close') {
            global.connected = false;
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Logged out');
                await fs.remove('session');
            } else {
                console.log('🔄 Reconnecting...');
                startBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Simple message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.remoteJid === 'status@broadcast') return;
        
        const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (body === '.ping') {
            await sock.sendMessage(m.key.remoteJid, { text: 'Pong! 🏓' });
        }
        if (body === '.menu' || body === '.help') {
            await sock.sendMessage(m.key.remoteJid, { 
                text: 'TUNZY-MD-MINI\n\nCommands:\n.ping - Check bot\n.menu - This menu\n.alive - Bot status' 
            });
        }
        if (body === '.alive') {
            await sock.sendMessage(m.key.remoteJid, { text: 'I am alive! ✅' });
        }
    });

    // Handle pairing code requests
    if (global.phoneNumber) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(global.phoneNumber);
                global.pairingCode = code;
                console.log(`Pairing code for ${global.phoneNumber}: ${code}`);
            } catch (e) {
                console.log('Pairing error:', e);
            }
        }, 5000);
    }

    return sock;
}

// ========== START EVERYTHING ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🌐 Server running on port', PORT);
    console.log('📱 Main page: http://localhost:' + PORT);
    console.log('🔐 Admin: http://localhost:' + PORT + '/admin');
    console.log('='.repeat(50) + '\n');
    startBot();
});
