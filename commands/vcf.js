module.exports = {
    command: ['vcf', 'savecontacts'],
    execute: async ({ sock, msg, from, reply, isOwner }) => {
        try {
            if (!isOwner) return reply('_〆 Only bot owner can use this command_');
            
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentions.length === 0) {
                return reply('_〆 Please mention users to save to VCF_\n✓ Example: !vcf @user1 @user2');
            }
            
            let vcfData = '';
            for (let jid of mentions) {
                const number = jid.split('@')[0];
                const contact = await sock.onWhatsApp(jid);
                const name = contact[0]?.name || number;
                vcfData += `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${number}\nEND:VCARD\n`;
            }
            
            await sock.sendMessage(from, {
                document: Buffer.from(vcfData, 'utf-8'),
                fileName: 'contacts.vcf',
                mimetype: 'text/vcard',
                caption: `✓ ${mentions.length} contacts saved to VCF file!`
            }, { quoted: msg });
        } catch (error) {
            console.error(error);
            reply('_〆 Error: Failed to create VCF_');
        }
    }
};