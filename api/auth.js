const sessionManager = require('../lib/redis');
const newsletterUtils = require('../lib/newsletter');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, sessionId = 'default', phoneNumber } = req.body || req.query;

    try {
        // ✅ NEW: Request pairing code
        if (action === 'request-pairing') {
            if (!phoneNumber) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Phone number required' 
                });
            }

            // Call bot API with pairing
            const response = await fetch(`${process.env.APP_URL}/api/bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start-with-pairing',
                    sessionId,
                    phoneNumber
                })
            });

            const data = await response.json();
            
            // Wait for pairing code (max 30 seconds)
            let attempts = 0;
            let authState = null;
            
            while (attempts < 30) {
                authState = await sessionManager.getAuthState(sessionId);
                if (authState?.type === 'pairing') {
                    break;
                }
                await new Promise(r => setTimeout(r, 1000));
                attempts++;
            }
            
            if (authState?.code) {
                res.json({
                    success: true,
                    method: 'pairing',
                    code: authState.code,
                    phone: phoneNumber,
                    message: `Your 8-digit code: ${authState.code}`
                });
            } else {
                res.json({
                    success: false,
                    error: 'Pairing code timeout',
                    fallback: 'qr'
                });
            }
            return;
        }

        // Check auth status
        if (action === 'check-auth') {
            const authState = await sessionManager.getAuthState(sessionId);
            const status = await sessionManager.getBotStatus(sessionId);
            
            res.json({
                success: true,
                authenticated: status === 'connected' || status === 'authenticated',
                status: status,
                authState: authState,
                newsletter: newsletterUtils.getNewsletterName()
            });
            return;
        }
        
        // Logout
        if (action === 'logout') {
            await fetch(`${process.env.APP_URL}/api/bot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete-session',
                    sessionId
                })
            });
            
            res.json({ 
                success: true, 
                message: 'Logged out successfully' 
            });
            return;
        }
        
        res.json({ 
            success: false, 
            error: 'Unknown action' 
        });

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: error.message });
    }
};