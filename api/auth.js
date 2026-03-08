const sessionManager = require('../lib/redis');
const newsletterUtils = require('../lib/newsletter');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, sessionId = 'default' } = req.body || req.query;

    try {
        switch(action) {
            case 'check-auth':
                const authState = await sessionManager.getAuthState(sessionId);
                const status = await sessionManager.getBotStatus(sessionId);
                
                res.json({
                    success: true,
                    authenticated: status === 'connected' || status === 'authenticated',
                    status: status,
                    authState: authState,
                    newsletter: newsletterUtils.getNewsletterName()
                });
                break;
                
            case 'logout':
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
                break;
                
            default:
                res.json({ 
                    success: false, 
                    error: 'Unknown action' 
                });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: error.message });
    }
};
