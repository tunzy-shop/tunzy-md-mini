const sessionId = 'default';
let botStatus = 'off';
let pollingInterval = null;
let statusCheckInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    checkBotStatus();
    loadCategories();
    loadNewsletterInfo();
    startPolling();
});

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(checkBotStatus, 3000);
}

async function checkBotStatus() {
    try {
        const response = await fetch(`/api/bot?action=status&sessionId=${sessionId}`);
        const data = await response.json();
        
        if (data.success) {
            updateStatusUI(data);
        }
    } catch (error) {
        console.error('Status check error:', error);
    }
}

function updateStatusUI(data) {
    botStatus = data.status;
    
    // Update toggle
    const toggle = document.getElementById('botToggle');
    if (toggle) {
        toggle.checked = data.status === 'connected' || data.status === 'running';
    }
    
    // Update status indicator
    const dot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (data.connected) {
        dot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        dot.classList.remove('connected');
        statusText.textContent = data.status || 'Offline';
    }
    
    // Update stats
    if (data.stats) {
        document.getElementById('commandCount').textContent = data.stats.totalCommands || 0;
    }
    
    // Update version
    if (data.version) {
        document.getElementById('version').textContent = `v${data.version}`;
    }
    
    // Update prefix
    if (data.prefix) {
        document.getElementById('prefix').textContent = data.prefix;
    }
    
    // Update newsletter name
    if (data.newsletter) {
        document.getElementById('newsletterName').textContent = data.newsletter;
        document.getElementById('newsletterDisplayName').textContent = data.newsletter;
    }
}

async function toggleBot() {
    const toggle = document.getElementById('botToggle');
    const action = toggle.checked ? 'start' : 'stop';
    
    try {
        const response = await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, sessionId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Bot ${action}ed successfully`, 'success');
            if (action === 'start') {
                checkQRCode();
            }
        } else {
            toggle.checked = !toggle.checked;
            showNotification('Failed to toggle bot', 'error');
        }
    } catch (error) {
        console.error('Toggle error:', error);
        toggle.checked = !toggle.checked;
        showNotification('Error toggling bot', 'error');
    }
}

async function checkQRCode() {
    if (statusCheckInterval) clearInterval(statusCheckInterval);
    
    statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/auth?action=check-auth&sessionId=${sessionId}`);
            const data = await response.json();
            
            if (data.authState && data.authState.type === 'qr' && data.authState.qr) {
                displayQR(data.authState.qr);
            }
            
            if (data.authenticated) {
                clearInterval(statusCheckInterval);
                document.getElementById('qrContainer').innerHTML = `
                    <div style="text-align: center; color: var(--success);">
                        <i class="fas fa-check-circle" style="font-size: 5rem;"></i>
                        <p style="margin-top: 1rem;">Connected Successfully!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('QR check error:', error);
        }
    }, 2000);
}

function displayQR(qrCode) {
    const qrContainer = document.getElementById('qrContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <img src="${qrCode}" alt="QR Code">
            <p style="margin-top: 1rem; color: var(--primary-blue);">Scan with WhatsApp</p>
        `;
    }
}

async function deleteSession() {
    if (!confirm('Are you sure? This will delete the session and log out the bot.')) return;
    
    try {
        const response = await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete-session', sessionId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Session deleted', 'success');
            
            // Reset UI
            document.getElementById('botToggle').checked = false;
            document.getElementById('statusDot').classList.remove('connected');
            document.getElementById('statusText').textContent = 'Offline';
            document.getElementById('qrContainer').innerHTML = `
                <div class="qr-placeholder">
                    <i class="fas fa-qrcode"></i>
                    <p>Turn on bot to generate QR</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Delete session error:', error);
        showNotification('Error deleting session', 'error');
    }
}

async function restartBot() {
    if (!confirm('Restart the bot?')) return;
    
    try {
        const response = await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'restart', sessionId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Bot restarted', 'success');
            setTimeout(() => checkBotStatus(), 5000);
        }
    } catch (error) {
        console.error('Restart error:', error);
        showNotification('Error restarting bot', 'error');
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/commands');
        const data = await response.json();
        
        if (data.success && data.grouped) {
            displayCategories(data.grouped);
            document.getElementById('totalCommandsCount').textContent = data.total + '+';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function displayCategories(categories) {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    Object.keys(categories).sort().forEach(category => {
        const count = categories[category].length;
        const card = document.createElement('div');
        card.className = 'category-item';
        card.innerHTML = `
            <i class="fas fa-folder"></i>
            <h4>${category}</h4>
            <p>${count} commands</p>
        `;
        grid.appendChild(card);
    });
}

async function loadNewsletterInfo() {
    try {
        const response = await fetch('/api/bot');
        const data = await response.json();
        
        if (data.newsletter) {
            document.getElementById('newsletterName').textContent = data.newsletter;
            document.getElementById('newsletterDisplayName').textContent = data.newsletter;
        }
        
        if (data.prefix) {
            document.getElementById('prefix').textContent = data.prefix;
        }
    } catch (error) {
        console.error('Error loading newsletter:', error);
    }
}

function copyNewsletter() {
    const jid = document.getElementById('newsletterJid').textContent;
    navigator.clipboard.writeText(jid);
    showNotification('Newsletter ID copied!', 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--primary-blue)' : type === 'error' ? 'var(--danger)' : 'var(--light-gray)'};
        color: var(--white);
        padding: 15px 25px;
        border-radius: 10px;
        border-left: 4px solid var(--white);
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
// Add these functions to your dashboard.js

// Switch between QR and Pairing tabs
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab + 'Tab').classList.add('active');
}

// Request pairing code
async function requestPairingCode() {
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const pairingBtn = document.getElementById('pairingBtn');
    const pairingLoading = document.getElementById('pairingLoading');
    const pairingResult = document.getElementById('pairingResult');
    const codeDisplay = document.getElementById('pairingCodeDisplay');
    
    // Validate phone number
    if (!phoneNumber) {
        showNotification('Please enter your phone number', 'warning');
        return;
    }
    
    if (!/^\d+$/.test(phoneNumber)) {
        showNotification('Phone number should contain only digits', 'error');
        return;
    }
    
    // Show loading
    pairingBtn.disabled = true;
    pairingLoading.style.display = 'block';
    pairingResult.style.display = 'none';
    
    try {
        // First, make sure bot is started with pairing
        await fetch('/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start-with-pairing',
                sessionId: 'default',
                phoneNumber: phoneNumber
            })
        });
        
        // Now request the pairing code
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'request-pairing',
                sessionId: 'default',
                phoneNumber: phoneNumber
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.code) {
            // Format code as XXXX-XXXX
            const formattedCode = data.code.replace(/(\d{4})(\d{4})/, '$1-$2');
            codeDisplay.textContent = formattedCode;
            pairingResult.style.display = 'block';
            showNotification('Pairing code generated! Check your phone!', 'success');
        } else if (data.fallback === 'qr') {
            switchTab('qr');
            showNotification('Using QR code instead', 'info');
        } else {
            showNotification('Failed to get pairing code: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Pairing error:', error);
        showNotification('Error requesting pairing code', 'error');
    } finally {
        pairingBtn.disabled = false;
        pairingLoading.style.display = 'none';
    }
}

// Listen for pairing code from server
socket.on('pairing-code', (data) => {
    const formattedCode = data.code.replace(/(\d{4})(\d{4})/, '$1-$2');
    document.getElementById('pairingCodeDisplay').textContent = formattedCode;
    document.getElementById('pairingResult').style.display = 'block';
    document.getElementById('pairingLoading').style.display = 'none';
    switchTab('pairing');
    showNotification(`Pairing code: ${formattedCode}`, 'success');
});

// Update checkAuth to handle pairing
async function checkAuth() {
    try {
        const response = await fetch(`/api/auth?action=check-auth&sessionId=default`);
        const data = await response.json();
        
        if (data.authState) {
            if (data.authState.type === 'qr' && data.authState.qr) {
                displayQR(data.authState.qr);
            } else if (data.authState.type === 'pairing' && data.authState.code) {
                const formattedCode = data.authState.code.replace(/(\d{4})(\d{4})/, '$1-$2');
                document.getElementById('pairingCodeDisplay').textContent = formattedCode;
                document.getElementById('pairingResult').style.display = 'block';
                switchTab('pairing');
            }
        }
        
        if (data.authenticated) {
            clearInterval(authCheckInterval);
            document.getElementById('qrContainer').innerHTML = `
                <div style="text-align: center; color: var(--success);">
                    <i class="fas fa-check-circle" style="font-size: 5rem;"></i>
                    <p>Connected Successfully!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}
