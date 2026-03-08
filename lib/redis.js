const Redis = require('ioredis');

let redis = null;

const getRedis = () => {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                return Math.min(times * 50, 2000);
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        redis.on('error', (err) => {
            console.error('Redis error:', err);
        });
        
        redis.on('connect', () => {
            console.log('✅ Redis connected');
        });
    }
    return redis;
};

const sessionManager = {
    async set(key, value, ttl = 604800) {
        try {
            const redis = getRedis();
            await redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Redis set error:', error);
            return false;
        }
    },

    async get(key) {
        try {
            const redis = getRedis();
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    },

    async del(key) {
        try {
            const redis = getRedis();
            await redis.del(key);
            return true;
        } catch (error) {
            console.error('Redis del error:', error);
            return false;
        }
    },

    async setSession(sessionId, data) {
        return await this.set(`session:${sessionId}`, data);
    },

    async getSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    },

    async deleteSession(sessionId) {
        await this.del(`session:${sessionId}`);
        await this.del(`auth:${sessionId}`);
        await this.del(`status:${sessionId}`);
    },

    async setAuthState(sessionId, state) {
        return await this.set(`auth:${sessionId}`, state, 300);
    },

    async getAuthState(sessionId) {
        return await this.get(`auth:${sessionId}`);
    },

    async setBotStatus(sessionId, status) {
        return await this.set(`status:${sessionId}`, status);
    },

    async getBotStatus(sessionId) {
        return await this.get(`status:${sessionId}`) || 'off';
    },

    async incrementCommandCount(command) {
        try {
            const redis = getRedis();
            await redis.incr(`stats:commands:${command}`);
            const total = await redis.incr('stats:total_commands');
            return total;
        } catch (error) {
            console.error('Redis incr error:', error);
            return 0;
        }
    },

    async getStats() {
        try {
            const redis = getRedis();
            const total = await redis.get('stats:total_commands') || 0;
            return { totalCommands: parseInt(total) };
        } catch (error) {
            console.error('Redis getStats error:', error);
            return { totalCommands: 0 };
        }
    }
};

module.exports = sessionManager;
