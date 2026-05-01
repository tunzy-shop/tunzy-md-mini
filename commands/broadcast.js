module.exports = {
    command: ['broadcast', 'bc', 'announce'],
    execute: async ({ sock, msg, from, args, reply, isOwner }) => {
        try {
            if (!isOwner) return reply('_〆 Only bot owner can use this command_');
            
            const message = args.join(' ');
            if (!message) return reply('_〆 Please provide a message to broadcast_\n✓ Example: !broadcast Hello everyone!');
            
            await reply(`✓ Broadcasting to all chats...\n_〆 Message: ${message}_`);
            
            const chats = await sock.groupFetchAllParticipating();
            let sent = 0;
            
            for (let id in chats) {
                try {
                    await sock.sendMessage(id, { text: `📢 *ANNOUNCEMENT*\n\n${message}` });
                    sent++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (err) {
                    console.error(`Failed to send to ${id}:`, err);
                }
            }
            
            reply(`✓ Broadcast completed!\n_〆 Sent to ${sent} chats_`);
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to broadcast_');
        }
    }
};