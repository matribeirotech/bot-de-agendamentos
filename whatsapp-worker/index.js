require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos persistentes (dentro de auth_info_baileys para persistência no volume Docker)
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const LID_MAP_FILE = path.join(AUTH_DIR, 'lid_map.json');
const SAVED_CONTACTS_FILE = path.join(AUTH_DIR, 'saved_contacts.json');

// Mapeamento de LID -> Telefone Real
let lidToPhoneMap = new Map();
try {
    if (fs.existsSync(LID_MAP_FILE)) {
        const raw = JSON.parse(fs.readFileSync(LID_MAP_FILE, 'utf8'));
        lidToPhoneMap = new Map(Object.entries(raw));
    }
} catch (e) {
    console.error('Erro ao ler lid_map.json:', e.message);
}

function saveLidMap() {
    try {
        const obj = Object.fromEntries(lidToPhoneMap);
        fs.writeFileSync(LID_MAP_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error('Erro ao salvar lid_map.json:', e.message);
    }
}

function registerLidPhone(lid, phone) {
    if (!lid || !phone) return;
    const cleanLid = String(lid).replace(/@.*$/, '');
    const cleanPhone = String(phone).replace(/@.*$/, '');
    if (cleanPhone.length >= 10 && cleanPhone.length <= 13 && cleanPhone !== cleanLid) {
        lidToPhoneMap.set(cleanLid, cleanPhone);
        lidToPhoneMap.set(String(lid), cleanPhone);
        saveLidMap();
        console.log(`📌 [Mapeamento Salvo] LID ${cleanLid} -> Telefone Real ${cleanPhone}`);
    }
}

// Mapeamento de Contatos Salvos na Agenda Pessoal
let savedContactsMap = new Map();
try {
    if (fs.existsSync(SAVED_CONTACTS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(SAVED_CONTACTS_FILE, 'utf8'));
        savedContactsMap = new Map(Object.entries(raw));
        console.log(`📋 [Agenda Pessoal] ${savedContactsMap.size} contatos carregados da agenda.`);
    }
} catch (e) {
    console.error('Erro ao ler saved_contacts.json:', e.message);
}

function saveSavedContacts() {
    try {
        const obj = Object.fromEntries(savedContactsMap);
        fs.writeFileSync(SAVED_CONTACTS_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error('Erro ao salvar saved_contacts.json:', e.message);
    }
}

function normalizeBRPhone(phone) {
    if (!phone) return [];
    const p = String(phone).replace(/\D/g, '');
    if (!p) return [];
    const results = [p];
    // Se for Brasil com 55 e DDD (ex: 5517996261525 - 13 dígitos com nono dígito)
    if (p.startsWith('55') && p.length === 13) {
        results.push(p.slice(0, 4) + p.slice(5)); // versão sem 9
    }
    // Se for Brasil com 55 e DDD (ex: 551796261525 - 12 dígitos sem nono dígito)
    if (p.startsWith('55') && p.length === 12) {
        results.push(p.slice(0, 4) + '9' + p.slice(4)); // versão com 9
    }
    return results;
}

function registerSavedContact(jidOrNumber, contactName) {
    if (!jidOrNumber || !contactName) return;
    const clean = String(jidOrNumber).replace(/@.*$/, '');
    savedContactsMap.set(clean, contactName);
    savedContactsMap.set(String(jidOrNumber), contactName);

    // Registra variações do nono dígito para garantir correspondência exata
    const variations = normalizeBRPhone(clean);
    for (const v of variations) {
        savedContactsMap.set(v, contactName);
        savedContactsMap.set(`${v}@s.whatsapp.net`, contactName);
    }

    saveSavedContacts();
    console.log(`👤 [Contato Salvo na Agenda]: "${contactName}" (${clean})`);
}

function getCandidateKeys(senderId, phoneNumber) {
    const cleanSender = String(senderId).replace(/@.*$/, '');
    const cleanPhone = phoneNumber ? String(phoneNumber).replace(/@.*$/, '') : '';
    const candidates = new Set([
        cleanSender,
        String(senderId),
        cleanPhone,
        ...normalizeBRPhone(cleanSender),
        ...normalizeBRPhone(cleanPhone)
    ]);
    return Array.from(candidates).filter(Boolean);
}

function isContactSavedCheck(senderId, phoneNumber) {
    const candidates = getCandidateKeys(senderId, phoneNumber);
    for (const c of candidates) {
        if (savedContactsMap.has(c)) {
            return true;
        }
    }
    return false;
}

function getSavedContactName(senderId, phoneNumber) {
    const candidates = getCandidateKeys(senderId, phoneNumber);
    for (const c of candidates) {
        if (savedContactsMap.has(c)) {
            return savedContactsMap.get(c);
        }
    }
    return '';
}

// Configurações de Ambiente
const TENANT_ID = process.env.TENANT_ID || '5ea98896-b3ba-4d10-951d-edd908422147'; 
const DJANGO_WEBHOOK_URL = process.env.DJANGO_WEBHOOK_URL || 'http://backend:8000/api/v1/bot/webhook/incoming/';

let currentQR = '';
let isConnected = false;
let waSocket = null;

// Servidor HTTP para expor status, contatos salvos e QR Code
http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            connected: isConnected, 
            qr: currentQR,
            savedContactsCount: savedContactsMap.size 
        }));
    } else if (req.url === '/contacts' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            count: savedContactsMap.size,
            contacts: Object.fromEntries(savedContactsMap) 
        }));
    } else if (req.url === '/contacts/add' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.phone && data.name) {
                    registerSavedContact(data.phone, data.name);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: `Contato ${data.name} (${data.phone}) adicionado como salvo!` }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Campos phone e name são obrigatórios.' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(3001, () => {
    console.log('🔌 API do Worker rodando na porta 3001 (disponível para o frontend)');
});

// Função utilitária para extrair texto de qualquer tipo de mensagem do WhatsApp
function extractMessageText(message) {
    if (!message) return '';

    // Desembrulha mensagens efêmeras / temporárias (padrão em muitas contas)
    if (message.ephemeralMessage?.message) {
        message = message.ephemeralMessage.message;
    }
    // Desembrulha viewOnce
    if (message.viewOnceMessage?.message) {
        message = message.viewOnceMessage.message;
    }
    if (message.viewOnceMessageV2?.message) {
        message = message.viewOnceMessageV2.message;
    }
    if (message.documentWithCaptionMessage?.message) {
        message = message.documentWithCaptionMessage.message;
    }

    const text = (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.buttonsResponseMessage?.selectedButtonId ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        message.templateButtonReplyMessage?.selectedId ||
        ''
    );

    return (typeof text === 'string') ? text.trim() : '';
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'error' }),
        syncFullHistory: true,
    });
    waSocket = sock;

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
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const isLoggedOut = statusCode === DisconnectReason.loggedOut;
            console.log(`⚠️ Conexão fechada (Código: ${statusCode}). Deslogado: ${isLoggedOut}`);
            
            if (isLoggedOut) {
                console.log('❌ Sessão deslogada pelo WhatsApp. Limpando credenciais para permitir novo escaneamento de QR Code...');
                try {
                    const files = fs.readdirSync(AUTH_DIR);
                    for (const f of files) {
                        if (f !== 'saved_contacts.json' && f !== 'lid_map.json') {
                            fs.unlinkSync(path.join(AUTH_DIR, f));
                        }
                    }
                } catch (e) {
                    console.error('Erro ao limpar auth_dir:', e.message);
                }
                setTimeout(connectToWhatsApp, 2000);
            } else {
                setTimeout(connectToWhatsApp, 3000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            currentQR = '';
            console.log('\n✅ WhatsApp conectado com sucesso! O Robô está online e aguardando clientes.\n');
        }
    });

    // Função central para processar qualquer objeto de contato recebido do WhatsApp
    function processContact(c) {
        if (!c) return;
        // 1. Mapeamento LID -> Telefone
        if (c.lid && (c.id || c.jid)) {
            registerLidPhone(c.lid, c.id || c.jid);
        }
        // 2. Detecção de Contato Salvo na Agenda Pessoal
        // No Baileys, 'c.name' é preenchido APENAS se o contato estiver salvo com nome na agenda do telefone!
        if (c.name && c.name.trim().length > 0) {
            const name = c.name.trim();
            if (c.id) registerSavedContact(c.id, name);
            if (c.jid) registerSavedContact(c.jid, name);
            if (c.lid) registerSavedContact(c.lid, name);
        }
    }

    // Histórico inicial sincronizado
    sock.ev.on('messaging-history.set', ({ contacts, chats }) => {
        console.log(`📥 [Sincronização de Histórico] Recebidos contatos e conversas do WhatsApp.`);
        if (Array.isArray(contacts)) {
            for (const c of contacts) {
                processContact(c);
            }
        }
        if (Array.isArray(chats)) {
            for (const ch of chats) {
                if (ch.name && !ch.id.endsWith('@g.us')) {
                    registerSavedContact(ch.id, ch.name);
                }
            }
        }
    });

    sock.ev.on('chats.upsert', (chats) => {
        if (!Array.isArray(chats)) return;
        for (const ch of chats) {
            if (ch.name && !ch.id.endsWith('@g.us')) {
                registerSavedContact(ch.id, ch.name);
            }
        }
    });

    sock.ev.on('chats.update', (updates) => {
        if (!Array.isArray(updates)) return;
        for (const ch of updates) {
            if (ch.name && ch.id && !ch.id.endsWith('@g.us')) {
                registerSavedContact(ch.id, ch.name);
            }
        }
    });

    sock.ev.on('contacts.upsert', (contacts) => {
        if (!Array.isArray(contacts)) return;
        for (const c of contacts) {
            processContact(c);
        }
    });

    sock.ev.on('contacts.update', (updates) => {
        if (!Array.isArray(updates)) return;
        for (const u of updates) {
            processContact(u);
        }
    });

    sock.ev.on('chats.phoneNumberShare', ({ lid, jid }) => {
        if (lid && jid) {
            registerLidPhone(lid, jid);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!messages || !Array.isArray(messages)) return;

        for (const msg of messages) {
            // Ignora mensagens sem payload ou enviadas pelo próprio robô
            if (!msg.message || msg.key?.fromMe) continue;

            const senderId = msg.key?.remoteJid;
            if (!senderId) continue;

            // Ignora status do WhatsApp e grupos
            if (senderId === 'status@broadcast' || senderId.endsWith('@g.us')) {
                continue;
            }

            // Resolução Inteligente do Número de Telefone Real
            let phoneNumber = '';
            if (msg.key?.senderPn) {
                phoneNumber = msg.key.senderPn.replace(/@.*$/, '');
            } else if (msg.key?.participantPn) {
                phoneNumber = msg.key.participantPn.replace(/@.*$/, '');
            } else if (msg.key?.participant && msg.key.participant.endsWith('@s.whatsapp.net')) {
                phoneNumber = msg.key.participant.replace(/@.*$/, '');
            } else if (msg.participant && msg.participant.endsWith('@s.whatsapp.net')) {
                phoneNumber = msg.participant.replace(/@.*$/, '');
            } else if (senderId.endsWith('@s.whatsapp.net')) {
                phoneNumber = senderId.replace(/@.*$/, '');
            } else {
                const cleanId = senderId.replace(/@.*$/, '');
                if (lidToPhoneMap.has(cleanId)) {
                    phoneNumber = lidToPhoneMap.get(cleanId);
                } else if (lidToPhoneMap.has(senderId)) {
                    phoneNumber = lidToPhoneMap.get(senderId);
                } else {
                    phoneNumber = cleanId;
                }
            }

            if (phoneNumber && phoneNumber.length >= 10 && phoneNumber.length <= 13 && senderId.endsWith('@lid')) {
                registerLidPhone(senderId, phoneNumber);
            }

            // Checagem do Filtro de Privacidade: Contato Salvo na Agenda Pessoal
            const isContactSaved = isContactSavedCheck(senderId, phoneNumber);
            const savedName = getSavedContactName(senderId, phoneNumber);
            const pushName = msg.pushName || 'Cliente';
            const displayName = savedName || pushName;

            // Extrai o texto da mensagem
            let textMessage = extractMessageText(msg.message);

            // REGRA FUNDAMENTAL: Se o cliente mandou áudio, figurinha, imagem sem legenda ou qualquer interação,
            // tratamos como "Olá" para avaliação da máquina de estados
            if (!textMessage) {
                textMessage = 'Olá';
            }

            console.log(`📩 [Mensagem Recebida] ${phoneNumber} (${displayName}) [JID: ${senderId}] | Salvo na Agenda: ${isContactSaved ? 'SIM (' + savedName + ')' : 'NÃO'} | Texto: "${textMessage}"`);

            try {
                const response = await axios.post(DJANGO_WEBHOOK_URL, {
                    tenant_id: TENANT_ID,
                    phone_number: phoneNumber,
                    full_name: displayName,
                    message: textMessage,
                    is_contact_saved: isContactSaved
                }, {
                    timeout: 8000
                });

                const replyText = response.data?.reply;

                if (replyText) {
                    await sock.sendMessage(senderId, { text: replyText });
                    console.log(`📤 [Resposta Enviada com Sucesso] -> ${phoneNumber}:\n"${replyText.substring(0, 60)}..."`);
                } else {
                    console.log(`ℹ️ [Silêncio do Robô (Filtro Ativo)] -> Nenhuma resposta enviada para ${phoneNumber}`);
                }
            } catch (error) {
                console.error(`❌ [Erro ao comunicar com o Django]: ${error.message}`);
            }
        }
    });
}

connectToWhatsApp();
