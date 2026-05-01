/**
 * TUNZY-MD-MINI — WhatsApp Message Handler
 */
const { getSender }   = require('./lib/getSender');
const { isBanned }    = require('./lib/isBanned');
const { makeIsOwner } = require('./lib/isOwner');

// ── MENU ──
const menu       = require('./commands/menu');

// ── MAIN ──
const alive      = require('./commands/alive');
const ping       = require('./commands/ping');
const uptime     = require('./commands/uptime');
const jid        = require('./commands/jid');
const repo       = require('./commands/repo');
const screenshot = require('./commands/screenshot');

// ── AI ──
const ai         = require('./commands/ai');
const deepseek   = require('./commands/deepseek');

// ── TOOLS ──
const fancy        = require('./commands/fancy');
const hd           = require('./commands/hd');
const quoted       = require('./commands/quoted');
const savecontact  = require('./commands/savecontact');
const shazam       = require('./commands/shazam');
const tiktoksearch = require('./commands/tiktoksearch');
const vv           = require('./commands/vv');
const removebg     = require('./commands/removebg');

// ── DOWNLOADER ──
const tiktok    = require('./commands/tiktok');
const fb        = require('./commands/fb');
const instagram = require('./commands/instagram');
const play      = require('./commands/play');
const video     = require('./commands/video');
const gitclone  = require('./commands/gitclone');
const movie     = require('./commands/movie');

// ── STICKER ──
const sticker  = require('./commands/sticker');
const take     = require('./commands/take');
const vsticker = require('./commands/vsticker');

// ── ADMIN ──
const kick      = require('./commands/kick');
const promote   = require('./commands/promote');
const demote    = require('./commands/demote');
const tagall    = require('./commands/tagall');
const tag       = require('./commands/tag');
const mute      = require('./commands/mute');
const unmute    = require('./commands/unmute');
const muteuser  = require('./commands/mute-user');
const unmuteuser = require('./commands/unmute-user');
const add       = require('./commands/add');
const warn      = require('./commands/warn');
const del       = require('./commands/del');
const leave     = require('./commands/leave');
const setgname  = require('./commands/setgname');
const setgpp    = require('./commands/setgpp');
const welcome   = require('./commands/welcome');
const goodbye   = require('./commands/goodbye');
const antilink  = require('./commands/antilink');
const acceptall = require('./commands/acceptall');
const rejectall = require('./commands/rejectall');
const resetwarn = require('./commands/resetwarn');

// ── OWNER ──
const broadcast = require('./commands/broadcast');
const sudo      = require('./commands/sudo');
const forward   = require('./commands/forward');
const getpp     = require('./commands/getpp');
const setpp     = require('./commands/setpp');
const mode      = require('./commands/mode');
const update    = require('./commands/update');
const vcf       = require('./commands/vcf');
const setonline = require('./commands/setonline');
const setmyname = require('./commands/setmyname');
const updatebio = require('./commands/updatebio');

// ── SETTINGS ──
const anticall      = require('./commands/anti-call');
const autorecording = require('./commands/auto-recording');
const autoreply     = require('./commands/auto-reply');
const autoseen      = require('./commands/auto-seen');
const autotyping    = require('./commands/auto-typing');
const autoreact     = require('./commands/autoreact');
const readmessage   = require('./commands/read-message');
const statusreact   = require('./commands/status-react');
const statusreply   = require('./commands/status-reply');
const afk           = require('./commands/afk');
const setbotname    = require('./commands/setbotname');
const setbotprefix  = require('./commands/setbotprefix');
const setbotpic     = require('./commands/setbotpic');

// ── ANIME ──
const awoo      = require('./commands/awoo');
const bite      = require('./commands/bite');
const blush     = require('./commands/blush');
const bonk      = require('./commands/bonk');
const bully     = require('./commands/bully');
const cringe    = require('./commands/cringe');
const cry       = require('./commands/cry');
const cuddle    = require('./commands/cuddle');
const dance     = require('./commands/dance');
const dog       = require('./commands/dog');
const glomp     = require('./commands/glomp');
const hack      = require('./commands/hack');
const handhold  = require('./commands/handhold');
const highfive  = require('./commands/highfive');
const hug       = require('./commands/hug');
const img       = require('./commands/img');
const insult    = require('./commands/insult');
const kill      = require('./commands/kill');
const kiss      = require('./commands/kiss');
const lick      = require('./commands/lick');
const nom       = require('./commands/nom');
const pat       = require('./commands/pat');
const poke      = require('./commands/poke');
const slap      = require('./commands/slap');
const wave      = require('./commands/wave');
const wink      = require('./commands/wink');
const yeet      = require('./commands/yeet');

// ── GAME ──
const tod     = require('./commands/tod');
const todstop = require('./commands/todstop');
const ttt     = require('./commands/ttt');
const tttstop = require('./commands/tttstop');

// ── PRIVACY ──
const privacy      = require('./commands/privacy');
const getprivacy   = require('./commands/getprivacy');
const getbio       = require('./commands/getbio');
const blocklist    = require('./commands/blocklist');
const groupsprivacy = require('./commands/groupsprivacy');
const setppall     = require('./commands/setppall');

// ── MISC ──
const lyrics     = require('./commands/lyrics');
const savestatus = require('./commands/savestatus');

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

function getUptime() {
    const ms = Date.now() - (global.botStartTime || Date.now());
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}

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

        switch (cmd) {
            // ── MENU ──
            case 'menu': case 'help': case 'list': await menu.execute(ctx); break;

            // ── MAIN ──
            case 'alive':      await alive.execute(ctx); break;
            case 'ping':       await ping.execute(ctx); break;
            case 'uptime':     await uptime.execute(ctx); break;
            case 'jid':        await jid.execute(ctx); break;
            case 'repo':       await repo.execute(ctx); break;
            case 'screenshot': await screenshot.execute(ctx); break;

            // ── AI ──
            case 'ai':       await ai.execute(ctx); break;
            case 'deepseek': await deepseek.execute(ctx); break;

            // ── TOOLS ──
            case 'fancy':        await fancy.execute(ctx); break;
            case 'hd':           await hd.execute(ctx); break;
            case 'quoted':       await quoted.execute(ctx); break;
            case 'savecontact':  await savecontact.execute(ctx); break;
            case 'shazam':       await shazam.execute(ctx); break;
            case 'tiktoksearch': await tiktoksearch.execute(ctx); break;
            case 'vv':           await vv.execute(ctx); break;
            case 'removebg':     await removebg.execute(ctx); break;

            // ── DOWNLOADER ──
            case 'tiktok':    await tiktok.execute(ctx); break;
            case 'fb':        await fb.execute(ctx); break;
            case 'instagram': await instagram.execute(ctx); break;
            case 'play':      await play.execute(ctx); break;
            case 'video':     await video.execute(ctx); break;
            case 'gitclone':  await gitclone.execute(ctx); break;
            case 'movie':     await movie.execute(ctx); break;

            // ── STICKER ──
            case 'sticker':  await sticker.execute(ctx); break;
            case 'take':     await take.execute(ctx); break;
            case 'vsticker': await vsticker.execute(ctx); break;

            // ── ADMIN ──
            case 'kick':       await kick.execute(ctx); break;
            case 'promote':    await promote.execute(ctx); break;
            case 'demote':     await demote.execute(ctx); break;
            case 'tagall':     await tagall.execute(ctx); break;
            case 'tag':        await tag.execute(ctx); break;
            case 'mute':       await mute.execute(ctx); break;
            case 'unmute':     await unmute.execute(ctx); break;
            case 'mute-user':  await muteuser.execute(ctx); break;
            case 'unmute-user': await unmuteuser.execute(ctx); break;
            case 'add':        await add.execute(ctx); break;
            case 'warn':       await warn.execute(ctx); break;
            case 'del':        await del.execute(ctx); break;
            case 'leave':      await leave.execute(ctx); break;
            case 'setgname':   await setgname.execute(ctx); break;
            case 'setgpp':     await setgpp.execute(ctx); break;
            case 'welcome':    await welcome.execute(ctx); break;
            case 'goodbye':    await goodbye.execute(ctx); break;
            case 'antilink':   await antilink.execute(ctx); break;
            case 'acceptall':  await acceptall.execute(ctx); break;
            case 'rejectall':  await rejectall.execute(ctx); break;
            case 'resetwarn':  await resetwarn.execute(ctx); break;

            // ── OWNER ──
            case 'broadcast': await broadcast.execute(ctx); break;
            case 'sudo':      await sudo.execute(ctx); break;
            case 'forward':   await forward.execute(ctx); break;
            case 'getpp':     await getpp.execute(ctx); break;
            case 'setpp':     await setpp.execute(ctx); break;
            case 'mode':      await mode.execute(ctx); break;
            case 'update':    await update.execute(ctx); break;
            case 'vcf':       await vcf.execute(ctx); break;
            case 'setonline': await setonline.execute(ctx); break;
            case 'setmyname': await setmyname.execute(ctx); break;
            case 'updatebio': await updatebio.execute(ctx); break;

            // ── SETTINGS ──
            case 'anti-call':      await anticall.execute(ctx); break;
            case 'auto-recording': await autorecording.execute(ctx); break;
            case 'auto-reply':     await autoreply.execute(ctx); break;
            case 'auto-seen':      await autoseen.execute(ctx); break;
            case 'auto-typing':    await autotyping.execute(ctx); break;
            case 'autoreact':      await autoreact.execute(ctx); break;
            case 'read-message':   await readmessage.execute(ctx); break;
            case 'status-react':   await statusreact.execute(ctx); break;
            case 'status-reply':   await statusreply.execute(ctx); break;
            case 'afk':            await afk.execute(ctx); break;
            case 'setbotname':     await setbotname.execute(ctx); break;
            case 'setbotprefix':   await setbotprefix.execute(ctx); break;
            case 'setbotpic':      await setbotpic.execute(ctx); break;

            // ── ANIME ──
            case 'awoo':     await awoo.execute(ctx); break;
            case 'bite':     await bite.execute(ctx); break;
            case 'blush':    await blush.execute(ctx); break;
            case 'bonk':     await bonk.execute(ctx); break;
            case 'bully':    await bully.execute(ctx); break;
            case 'cringe':   await cringe.execute(ctx); break;
            case 'cry':      await cry.execute(ctx); break;
            case 'cuddle':   await cuddle.execute(ctx); break;
            case 'dance':    await dance.execute(ctx); break;
            case 'dog':      await dog.execute(ctx); break;
            case 'glomp':    await glomp.execute(ctx); break;
            case 'hack':     await hack.execute(ctx); break;
            case 'handhold': await handhold.execute(ctx); break;
            case 'highfive': await highfive.execute(ctx); break;
            case 'hug':      await hug.execute(ctx); break;
            case 'img':      await img.execute(ctx); break;
            case 'insult':   await insult.execute(ctx); break;
            case 'kill':     await kill.execute(ctx); break;
            case 'kiss':     await kiss.execute(ctx); break;
            case 'lick':     await lick.execute(ctx); break;
            case 'nom':      await nom.execute(ctx); break;
            case 'pat':      await pat.execute(ctx); break;
            case 'poke':     await poke.execute(ctx); break;
            case 'slap':     await slap.execute(ctx); break;
            case 'wave':     await wave.execute(ctx); break;
            case 'wink':     await wink.execute(ctx); break;
            case 'yeet':     await yeet.execute(ctx); break;

            // ── GAME ──
            case 'tod':     await tod.execute(ctx); break;
            case 'todstop': await todstop.execute(ctx); break;
            case 'ttt':     await ttt.execute(ctx); break;
            case 'tttstop': await tttstop.execute(ctx); break;

            // ── PRIVACY ──
            case 'privacy':       await privacy.execute(ctx); break;
            case 'getprivacy':    await getprivacy.execute(ctx); break;
            case 'getbio':        await getbio.execute(ctx); break;
            case 'blocklist':     await blocklist.execute(ctx); break;
            case 'groupsprivacy': await groupsprivacy.execute(ctx); break;
            case 'setppall':      await setppall.execute(ctx); break;

            // ── MISC ──
            case 'lyrics':     await lyrics.execute(ctx); break;
            case 'savestatus': await savestatus.execute(ctx); break;

            default: break;
        }

    } catch (e) {
        console.error('[main.js] Handler error:', e.message);
    }
}

module.exports = { handleMessages };