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
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
                max-width: 450px;
                width: 100%;
                background: #1e2a3a;
                padding: 30px;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            h1 { 
                text-align: center; 
                margin-bottom: 5px; 
                color: #fff;
                font-size: 28px;
            }
            .subtitle { 
                text-align: center; 
                color: #94a3b8; 
                margin-bottom: 30px; 
                font-size: 14px;
            }
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;
                background: #0f1a2b;
                padding: 5px;
                border-radius: 12px;
            }
            .tab-btn {
                flex: 1;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: transparent;
                color: #94a3b8;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .tab-btn.active { 
                background: #2563eb; 
                color: white; 
            }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            
            /* QR Code Styles */
            .qr-container {
                background: white;
                padding: 20px;
                border-radius: 16px;
                margin: 20px 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 280px;
            }
            .qr-container img { 
                max-width: 100%; 
                height: auto;
                border-radius: 8px;
            }
            .qr-placeholder { 
                color: #64748b; 
                text-align: center;
            }
            
            /* Pairing Code Styles */
            .input-group {
                margin: 20px 0;
            }
            label {
                display: block;
                margin-bottom: 8px;
                color: #94a3b8;
                font-size: 14px;
            }
            input {
                width: 100%;
                padding: 14px;
                border: 2px solid #2d3f4f;
                border-radius: 12px;
                background: #0f1a2b;
                color: white;
                font-size: 16px;
                box-sizing: border-box;
                transition: border-color 0.3s;
            }
            input:focus {
                outline: none;
                border-color: #2563eb;
            }
            button {
                width: 100%;
                padding: 14px;
                border: none;
                border-radius: 12px;
                background: linear-gradient(135deg, #2563eb, #3b82f6);
                color: white;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
                margin: 10px 0;
            }
            button:hover {
                transform: translateY(-2px);
            }
            button:disabled {
                opacity: 0.5;
                transform: none;
                cursor: not-allowed;
            }
            .code-box {
                background: #0f1a2b;
                padding: 25px;
                border-radius: 16px;
                font-size: 42px;
                font-weight: bold;
                letter-spacing: 10px;
                text-align: center;
                margin: 20px 0;
                border: 3px solid #2563eb;
                color: #60a5fa;
                font-family: monospace;
                word-break: break-all;
            }
            .code-label {
                text-align: center;
                color: #94a3b8;
                margin: 10px 0;
                font-size: 14px;
            }
            .instructions {
                background: #2d3f4f;
                padding: 15px;
                border-radius: 12px;
                margin: 20px 0;
                font-size: 14px;
                color: #e2e8f0;
                line-height: 1.6;
            }
            .instructions ol {
                margin-left: 20px;
                margin-top: 10px;
            }
            .instructions li {
                margin: 8px 0;
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                color: #64748b; 
                font-size: 12px; 
            }
            .hidden { display: none; }
            .error-message {
                background: #ef444420;
                color: #ef4444;
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
                border: 1px solid #ef4444;
            }
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
                    <div class="qr-placeholder">Scan QR code with WhatsApp</div>
                </div>
                <div style="text-align: center; color: #94a3b8; font-size: 14px;">
                    Open WhatsApp > Menu > Linked Devices
                </div>
            </div>
            
            <!-- Pairing Code Tab -->
            <div id="pair-tab" class="tab-content hidden">
                <div class="input-group">
                    <label>📞 Phone Number (with country code)</label>
                    <input type="text" id="phoneNumber" placeholder="e.g., 2349067345425" value="2349067345425">
                </div>
                
                <button onclick="requestPairing()" id="pairBtn">
                    🔑 Generate 8-digit Code
                </button>
                
                <div id="pairCodeContainer" class="hidden">
                    <div class="code-label">Your 8-digit pairing code:</div>
                    <div class="code-box" id="pairCode"></div>
                    
                    <div class="instructions">
                        <strong>📱 How to use:</strong>
                        <ol>
                            <li>Open WhatsApp on your phone</li>
                            <li>Tap Menu (3 dots) or Settings</li>
                            <li>Go to <strong>Linked Devices</strong></li>
                            <li>Tap <strong>Link a Device</strong></li>
                            <li>Enter this 8-digit code</li>
                        </ol>
                    </div>
                </div>
                
                <div id="errorMessage" class="error-message hidden"></div>
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
                const phone = document.getElementById('phoneNumber').value.trim();
                if (!phone) {
                    showError('Please enter your phone number');
                    return;
                }
                
                // Validate phone number
                if (!phone.match(/^\\d+$/)) {
                    showError('Phone number should contain only digits');
                    return;
                }
                
                const btn = document.getElementById('pairBtn');
                btn.disabled = true;
                btn.textContent = '⏳ Generating Code...';
                
                // Hide any previous error
                document.getElementById('errorMessage').classList.add('hidden');
                
                try {
                    const res = await fetch('/request-pairing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone })
                    });
                    
                    const data = await res.json();
                    
                    if (data.success) {
                        // Show waiting message
                        document.getElementById('pairCodeContainer').classList.remove('hidden');
                        document.getElementById('pairCode').textContent = '⏳';
                        
                        // Start checking for the code
                        checkForCode();
                    } else {
                        showError('Failed to request code');
                    }
                } catch (error) {
                    showError('Network error. Please try again.');
                }
                
                btn.disabled = false;
                btn.textContent = '🔑 Generate 8-digit Code';
            }
            
            function showError(message) {
                const errorEl = document.getElementById('errorMessage');
                errorEl.textContent = message;
                errorEl.classList.remove('hidden');
            }
            
            async function checkForCode() {
                let attempts = 0;
                const maxAttempts = 30; // Check for 60 seconds max
                
                const checkInterval = setInterval(async () => {
                    attempts++;
                    
                    try {
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
                        } else if (attempts >= maxAttempts) {
                            document.getElementById('pairCode').textContent = 'Timeout';
                            showError('Code generation timed out. Please try again.');
                            clearInterval(checkInterval);
                        }
                    } catch (error) {
                        console.error('Status check failed');
                    }
                }, 2000);
            }
            
            // Check status on load
            setInterval(async () => {
                const res = await fetch('/status');
                const data = await res.json();
                if (data.qr) {
                    document.getElementById('qrDisplay').innerHTML = \`<img src="\${data.qr}" alt="QR Code">\`;
                }
            }, 2000);
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
            .status-badge { display: inline-block; padding: 5px 10px; border-radius: 5px; }
            .connected { background: #10b98120; color: #10b981; }
            .disconnected { background: #ef444420; color: #ef4444; }
            input { padding: 10px; width: 200px; margin: 10px 0; }
            .code-display { font-family: monospace; font-size: 20px; letter-spacing: 2px; }
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
                        <p><strong>Status:</strong> <span id="botStatus">Loading...</span></p>
                        <p><strong>Phone:</strong> <span id="phone">-</span></p>
                        <p><strong>Pairing Code:</strong> <span id="code" class="code-display">-</span></p>
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
                    '<span class="status-badge connected">✅ Connected</span>' : 
                    '<span class="status-badge disconnected">❌ Disconnected</span>';
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
    
    // Reset previous code
    pairingCode = null;
    
    // Trigger pairing code generation
    if (sock) {
        setTimeout(async () => {
            try {
                // Format phone number (remove any + or spaces)
                const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
                console.log('🔑 Generating code for:', cleanNumber);
                
                const code = await sock.requestPairingCode(cleanNumber);
                // Format code with space for better readability
                pairingCode = code.match(/.{1,3}/g).join(' ');
                console.log('✅ Pairing code generated:', pairingCode);
            } catch (e) {
                console.log('❌ Pairing error:', e);
            }
        }, 2000);
    } else {
        console.log('❌ Socket not ready yet');
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
    console.log('🗑️ Session cleared');
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
                const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
                console.log('🔑 Generating pairing code for:', cleanNumber);
                const code = await sock.requestPairingCode(cleanNumber);
                pairingCode = code.match(/.{1,3}/g).join(' ');
                console.log('✅ Pairing code:', pairingCode);
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