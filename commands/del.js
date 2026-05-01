module.exports = {
    command: ['del', 'delete'],
    execute: async ({ sock, msg, from, reply, isAdmin, isOwner }) => {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) return reply('_〆 Quote a message to delete_');
            
            const key = {
                remoteJid: from,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
            };
            
            await sock.sendMessage(from, { delete: key });
            reply('✓ Message deleted!');
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to delete message_');
        }
    }
};