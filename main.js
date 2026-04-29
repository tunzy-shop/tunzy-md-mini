/**
 * TUNZY-MD-MINI — WhatsApp Message Handler
 */
const { getSender }   = require('./lib/getSender');
const { isBanned }    = require('./lib/isBanned');
const { makeIsOwner } = require('./lib/isOwner');

// ── Command imports ──────────────────────────────────────────────────────────
const menuCmd       = require('./commands/menu');
const mainCmd       = require('./commands/main');
const aiCmd         = require('./commands/ai');
const adminCmd      = require('./commands/admin');
const ownerCmd      = require('./commands/owner');
const settingsCmd   = require('./commands/settings');
const toolsCmd      = require('./commands/tools');
const downloaderCmd = require('./commands/downloader');
const stickerCmd    = require('./commands/sticker');
const animeCmd      = require('./commands/anime');
const gameCmd       = require('./commands/game');
const privacyCmd    = require('./commands/privacy');
const miscCmd       = require('./commands/misc');

// ── Message text extractor ───────────────────────────────────────────────────
function getMessageText(message) {
    const m = message?.message;
    if (!m) return '';
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.documentMessage?.caption ||
        m.buttonsResponseMessage?.selectedDisplayText ||
        m.listResponseMessage?.title ||
        ''
    );
}

// ── Uptime ───────────────────────────────────────────────────────────────────
function getUptime() {
    const ms = Date.now() - (global.botStartTime || Date.now());
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════════
async function handleMessages(sock, update) {
    try {
        const { messages, type } = update;
        if (type !== 'notify') return;
        const message = messages[0];
        if (!message?.message) return;

        if (Object.keys(message.message)[0] === 'ephemeralMessage')
            message.message = message.message.ephemeralMessage.message;

        const chatId   = message.key.remoteJid;
        const isGroup  = chatId?.endsWith('@g.us');
        const senderId = getSender(sock, message);

        if (!chatId || !senderId) return;
        if (chatId === 'status@broadcast') return;
        if (isBanned(senderId)) return;

        const isOwnerFn     = makeIsOwner(sock._ownerPhone || '');
        const senderIsOwner = await isOwnerFn(senderId, sock, chatId);
        const senderNumber  = senderId.split('@')[0].split(':')[0];

        const body   = getMessageText(message);
        const prefix = process.env.PREFIX || '.';

        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/\s+/);
        const cmd  = args.shift()?.toLowerCase();

        if (!cmd) return;

        const uptime = getUptime();

        const ctx = {
            sock, msg: message, from: chatId, sender: senderId,
            senderNumber, senderIsOwner, isGroup, args, command: cmd,
            uptime,
            BOT_NAME:   process.env.BOT_NAME   || 'TUNZY-MD-MINI',
            OWNER_NAME: process.env.OWNER_NAME || 'TUNZY SHOP',
            VERSION:    '1.00',
            PREFIX:     prefix,
            reply: (text) => sock.sendMessage(chatId, { text }, { quoted: message })
        };

        // ── Route commands ───────────────────────────────────────────────────
        switch (cmd) {

            // ── MENU ──
            case 'menu':
            case 'help':
            case 'list':
                await menuCmd.execute(ctx);
                break;

            // ── MAIN ──
            case 'alive':
            case 'ping':
            case 'uptime':
            case 'jid':
            case 'repo':
            case 'screenshot':
                await mainCmd.execute(ctx);
                break;

            // ── AI ──
            case 'ai':
            case 'deepseek':
                await aiCmd.execute(ctx);
                break;

            // ── TOOLS ──
            case 'fancy':
            case 'hd':
            case 'quoted':
            case 'savecontact':
            case 'shazam':
            case 'tiktoksearch':
            case 'vv':
            case 'removebg':
                await toolsCmd.execute(ctx);
                break;

            // ── DOWNLOADER ──
            case 'tiktok':
            case 'fb':
            case 'instagram':
            case 'play':
            case 'video':
            case 'gitclone':
            case 'movie':
                await downloaderCmd.execute(ctx);
                break;

            // ── STICKER ──
            case 'sticker':
            case 'take':
            case 'vsticker':
                await stickerCmd.execute(ctx);
                break;

            // ── ANIME ──
            case 'awoo':
            case 'bite':
            case 'blush':
            case 'bonk':
            case 'bully':
            case 'cringe':
            case 'cry':
            case 'cuddle':
            case 'dance':
            case 'dog':
            case 'glomp':
            case 'hack':
            case 'handhold':
            case 'highfive':
            case 'hug':
            case 'img':
            case 'insult':
            case 'kill':
            case 'kiss':
            case 'lick':
            case 'nom':
            case 'pat':
            case 'poke':
            case 'slap':
            case 'wave':
            case 'wink':
            case 'yeet':
                await animeCmd.execute(ctx);
                break;

            // ── GAME ──
            case 'tod':
            case 'todstop':
            case 'ttt':
            case 'tttstop':
                await gameCmd.execute(ctx);
                break;

            // ── PRIVACY ──
            case 'privacy':
            case 'getprivacy':
            case 'getbio':
            case 'blocklist':
            case 'groupsprivacy':
            case 'setppall':
                await privacyCmd.execute(ctx);
                break;

            // ── MISC ──
            case 'lyrics':
            case 'savestatus':
                await miscCmd.execute(ctx);
                break;

            // ── SETTINGS (owner only) ──
            case 'anti-call':
            case 'auto-recording':
            case 'auto-reply':
            case 'auto-seen':
            case 'auto-typing':
            case 'autoreact':
            case 'read-message':
            case 'status-react':
            case 'status-reply':
            case 'afk':
            case 'setbotname':
            case 'setbotprefix':
            case 'setbotpic':
            case 'resetwarn':
                await settingsCmd.execute(ctx);
                break;

            // ── OWNER ──
            case 'broadcast':
            case 'sudo':
            case 'forward':
            case 'getpp':
            case 'setpp':
            case 'mode':
            case 'update':
            case 'vcf':
            case 'setonline':
            case 'setmyname':
            case 'updatebio':
                await ownerCmd.execute(ctx);
                break;

            // ── ADMIN ──
            case 'kick':
            case 'promote':
            case 'demote':
            case 'tagall':
            case 'tag':
            case 'mute':
            case 'unmute':
            case 'mute-user':
            case 'unmute-user':
            case 'add':
            case 'warn':
            case 'del':
            case 'leave':
            case 'setgname':
            case 'setgpp':
            case 'welcome':
            case 'goodbye':
            case 'antilink':
            case 'acceptall':
            case 'rejectall':
                await adminCmd.execute(ctx);
                break;

            default:
                break;
        }

    } catch (e) {
        console.error('[main.js] Handler error:', e.message);
    }
}

module.exports = { handleMessages };