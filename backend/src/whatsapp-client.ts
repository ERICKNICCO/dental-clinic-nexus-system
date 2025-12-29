// @ts-ignore
import { Client, LocalAuth, Buttons, Poll } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;

export const initializeWhatsApp = () => {
    try {
        console.log('🔄 Initializing WhatsApp Client...');

        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session'
            }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            }
        });

        client.on('qr', (qr) => {
            console.log('⚠️ WHATSAPP QR CODE RECEIVED:');
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Tap Menu or Settings and select Linked Devices');
            console.log('3. Tap on Link a Device');
            console.log('4. Scan the QR code below:');

            qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
            console.log('✅ WhatsApp Client is READY!');
            isReady = true;
        });

        client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp Authentication Failed:', msg);
        });

        client.on('disconnected', (reason) => {
            console.log('⚠️ WhatsApp was disconnected:', reason);
            isReady = false;
        });

        client.on('error', (error) => {
            console.error('❌ WhatsApp Client Error:', error);
        });

        client.initialize().catch((error) => {
            console.error('❌ Failed to initialize WhatsApp client:', error);
            console.log('📱 WhatsApp will be unavailable. Backend will continue without it.');
        });
    } catch (error) {
        console.error('❌ Error setting up WhatsApp client:', error);
        console.log('📱 WhatsApp will be unavailable. Backend will continue without it.');
    }
};

export const sendWhatsAppMessage = async (payload: { to: string; message: string; buttons?: { body: string }[] }): Promise<boolean> => {
    const { to, message, buttons } = payload;
    if (!client || !isReady) {
        console.warn('⚠️ WhatsApp client is not ready yet');
        return false;
    }

    try {
        let chatId = to.replace(/[^0-9]/g, '');

        if (!chatId.startsWith('255') && chatId.length === 10 && chatId.startsWith('0')) {
            chatId = '255' + chatId.substring(1);
        }

        chatId = `${chatId}@c.us`;

        // Send the main message first (always)
        try {
            console.log(`💬 Sending text body to ${chatId}...`);
            await client.sendMessage(chatId, message);
            console.log(`✅ Text body sent.`);
        } catch (msgErr) {
            console.error(`❌ Failed to send text body:`, msgErr);
        }

        if (buttons && buttons.length > 0) {
            // Small delay to ensure order and delivery
            await new Promise(resolve => setTimeout(resolve, 1500));

            try {
                // Convert buttons to a Poll which is supported
                const pollOptions = buttons.map(b => b.body);
                // @ts-ignore
                const poll = new Poll('Please select an option:', pollOptions);
                await client.sendMessage(chatId, poll);
                console.log(`✅ Poll sent.`);
            } catch (err) {
                console.warn('⚠️ Failed to send poll:', err);
            }
        }

        console.log(`✅ WhatsApp sent to ${chatId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp:', error);
        return false;
    }
};
