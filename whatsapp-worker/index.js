require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Lê o ID gerado pelo setup_demo.py
const TENANT_ID = process.env.TENANT_ID || 'COLOQUE_O_UUID_DO_TENANT_AQUI'; 
const DJANGO_WEBHOOK_URL = process.env.DJANGO_WEBHOOK_URL || 'http://localhost:8000/api/v1/bot/webhook/incoming/';

const http = require('http');

let currentQR = '';
let isConnected = false;

// Servidor HTTP simples para expor o QR code para o frontend
http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite requisições do React (localhost:5173)
    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ connected: isConnected, qr: currentQR }));
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(3001, () => {
    console.log('🔌 API do Worker rodando na porta 3001 (disponível para o frontend)');
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQR = qr;
            isConnected = false;
            console.log('\n--- ESCANEIE O QR CODE ABAIXO NO SEU WHATSAPP ---');
            console.log(`Conectando para o Tenant: ${TENANT_ID}\n`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                // If logged out, clear QR
                currentQR = '';
            }
        } else if (connection === 'open') {
            isConnected = true;
            currentQR = '';
            console.log('\n✅ WhatsApp conectado com sucesso! O Robô está online e aguardando clientes.\n');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const senderId = msg.key.remoteJid;
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        if (!textMessage) return;

        const phoneNumber = senderId.split('@')[0];
        const pushName = msg.pushName || 'Cliente';
        const isContactSaved = !!msg.pushName;

        console.log(`[Nova Mensagem] ${phoneNumber} (${pushName}): ${textMessage}`);

        try {
            const response = await axios.post(DJANGO_WEBHOOK_URL, {
                tenant_id: TENANT_ID,
                phone_number: phoneNumber,
                full_name: pushName,
                message: textMessage,
                is_contact_saved: isContactSaved
            });

            const replyText = response.data.reply;

            if (replyText) {
                await sock.sendMessage(senderId, { text: replyText });
                console.log(`[Resposta Enviada] -> ${phoneNumber}`);
            }
        } catch (error) {
            console.error('Erro ao conectar com o Django (Backend está rodando?):', error.message);
        }
    });
}

connectToWhatsApp();
