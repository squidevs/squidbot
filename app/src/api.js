import express from 'express';
import wppconnect from '@wppconnect-team/wppconnect';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Estado global
let client = null;
let qrCode = null;
let connectionStatus = 'disconnected';
let botActive = true; // Controle de ativação/desativação do bot

// Função para enviar atualização para todos os clientes WebSocket
function broadcastUpdate(type, data) {
    console.log(`Enviando broadcast: ${type}`, data);
    wss.clients.forEach(function each(wsClient) {
        if (wsClient.readyState === WebSocket.OPEN) {
            wsClient.send(JSON.stringify({ type, data }));
        }
    });
}

// Função para limpar e validar o QR code base64
function sanitizeQRCode(base64Qr) {
    if (!base64Qr) return null;
    
    // Remove cabeçalhos de data URL se existirem
    const cleanStr = base64Qr.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    // Remove caracteres inválidos
    return cleanStr.replace(/[\n\r\s]/g, '');
}

// Função para manipular as mensagens recebidas
async function handleMessage(message) {
    if (!botActive || message.isGroupMsg) return;
    
    const content = message.body.toLowerCase();
    
    try {
        switch (content) {
            case 'oi':
                await client.sendText(message.from, 
                    'Olá! Tudo bem?\n\n' +
                    'Escolha uma opção:\n' +
                    '1 - Ver imagem\n' +
                    '2 - Ouvir nota de voz\n' +
                    '3 - Ver PDF\n' +
                    '4 - Ver link\n' +
                    '5 - Lista de opções\n' +
                    '6 - Ver mensagem com botões\n' +
                    '7 - Ver sticker\n' +
                    '8 - Desativar respostas\n' +
                    '9 - Reativar respostas'
                );
                break;
                
            case '1':
                await client.sendImage(
                    message.from,
                    path.join(__dirname, 'assets', 'logo.png'),
                    'logo.png',
                    'Aqui está a imagem que você pediu!'
                );
                break;
                
            case '2':
                // Usando sendPtt para enviar nota de voz (Push to Talk)
                await client.sendPtt(
                    message.from,
                    path.join(__dirname, 'assets', 'audio.mp3')
                );
                break;
                
            case '3':
                await client.sendFile(
                    message.from,
                    path.join(__dirname, 'assets', 'catalogo.pdf'),
                    'Catálogo',
                    'Aqui está o PDF solicitado!'
                );
                break;
                
            case '4':
                await client.sendLinkPreview(
                    message.from,
                    'https://www.google.com',
                    'Clique para visitar nosso site!'
                );
                break;
                
            case '5':
                // Usando lista de opções
                await client.sendListMessage(message.from, {
                    buttonText: 'Clique aqui!',
                    description: 'Escolha uma opção:',
                    sections: [{
                        title: 'Opções disponíveis',
                        rows: [
                            {
                                title: 'Sim',
                                description: 'Confirmar'
                            },
                            {
                                title: 'Não',
                                description: 'Negar'
                            }
                        ]
                    }],
                    title: 'Você está gostando do bot?'
                });
                break;
                
            case '6':
                // Mensagem com botões usando sendText com markdown
                await client.sendText(
                    message.from,
                    'Escolha uma opção:\n\n' +
                    '1️⃣ - Primeira opção\n' +
                    '2️⃣ - Segunda opção\n' +
                    '3️⃣ - Terceira opção\n\n' +
                    'Responda com o número da sua escolha!'
                );
                break;
                
            case '7':
                await client.sendSticker(
                    message.from,
                    path.join(__dirname, 'assets', 'sticker.webp')
                );
                break;
                
            case '8':
                botActive = false;
                await client.sendText(
                    message.from,
                    '❌ Respostas automáticas desativadas!\n\nDigite 9 para reativar.'
                );
                break;
                
            case '9':
                botActive = true;
                await client.sendText(
                    message.from,
                    '✅ Respostas automáticas reativadas!\n\nDigite oi para ver o menu.'
                );
                break;

            // Tratamento das respostas das listas e botões
            case 'sim':
            case '1️⃣':
            case '1':
                await client.sendText(message.from, 'Você escolheu Sim/Opção 1! 👍');
                break;

            case 'não':
            case 'nao':
            case '2️⃣':
            case '2':
                await client.sendText(message.from, 'Você escolheu Não/Opção 2! 👎');
                break;

            case '3️⃣':
            case '3':
                await client.sendText(message.from, 'Você escolheu a Opção 3! ✨');
                break;
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        try {
            await client.sendText(
                message.from,
                '❌ Desculpe, ocorreu um erro ao processar sua solicitação.\n\nDigite oi para tentar novamente.'
            );
        } catch (e) {
            console.error('Erro ao enviar mensagem de erro:', e);
        }
    }
}

// Inicializar o WhatsApp
async function initWhatsApp() {
    try {
        console.log('Iniciando WhatsApp...');
        connectionStatus = 'connecting';
        
        client = await wppconnect.create({
            session: 'whatsapp-session',
            catchQR: (base64Qr, asciiQR) => {
                console.log('Novo QR Code recebido');
                const cleanQR = sanitizeQRCode(base64Qr);
                if (cleanQR) {
                    qrCode = cleanQR;
                    broadcastUpdate('qr', cleanQR);
                }
            },
            autoClose: false,
            headless: 'new',
            statusFind: (status, session) => {
                console.log('Status:', status); // Log do status atual
                broadcastUpdate('status', status);
            },
        });

        // Registra o manipulador de mensagens
        client.onMessage((message) => {
            console.log('Mensagem recebida:', message.body);
            handleMessage(message);
        });

        console.log('Cliente WhatsApp criado com sucesso');
        connectionStatus = 'connected';
        broadcastUpdate('connected', true);
        
        // Limpa o QR code após conectado
        qrCode = null;
        
        return true;
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error);
        connectionStatus = 'disconnected';
        return false;
    }
}

// Rotas da API
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        hasQR: !!qrCode
    });
});

app.post('/connect', async (req, res) => {
    console.log('Requisição de conexão recebida');
    
    try {
        if (connectionStatus === 'connected') {
            return res.json({ status: 'already_connected' });
        }
        
        if (connectionStatus === 'connecting') {
            if (qrCode) {
                const cleanQR = sanitizeQRCode(qrCode);
                return res.json({ qrCode: cleanQR, status: 'waiting_scan' });
            }
            return res.json({ status: 'connecting' });
        }

        // Inicia o processo de conexão
        const success = await initWhatsApp();
        
        if (success) {
            if (qrCode) {
                const cleanQR = sanitizeQRCode(qrCode);
                res.json({ qrCode: cleanQR, status: 'waiting_scan' });
            } else {
                res.json({ message: 'WhatsApp inicializado com sucesso' });
            }
        } else {
            throw new Error('Falha ao inicializar WhatsApp');
        }
    } catch (error) {
        console.error('Erro ao conectar:', error);
        res.status(500).json({ 
            error: 'Erro ao inicializar WhatsApp',
            details: error.message
        });
    }
});

// Configuração do WebSocket
wss.on('connection', (ws) => {
    console.log('Novo cliente WebSocket conectado');
    
    // Envia o estado atual para o novo cliente
    if (qrCode) {
        ws.send(JSON.stringify({ type: 'qr', data: qrCode }));
    }
    ws.send(JSON.stringify({ type: 'status', data: connectionStatus }));
    
    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});

// Iniciar o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
