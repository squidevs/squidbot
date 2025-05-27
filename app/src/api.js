import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import path from 'path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import qrcode from 'qrcode';

// Obtenha o diretório atual para uso com caminhos de arquivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
// Funções utilitárias
// =========================

/**
 * Lê o arquivo de configuração 'data.json'.
 * @returns {object} O objeto de configuração.
 */
function lerConfig() {
    const configPath = path.resolve(__dirname, 'assets/data.json');
    console.log('Lendo config de:', configPath);
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error('Erro ao ler o arquivo de configuração, criando um novo:', error);
        return {
            mensagensParaGrupos: false,
            mostrarDigitando: false,
            mostrarGravandoAudio: false,
            mensagemDefault: '❓ Não entendi sua mensagem. Como posso ajudar?',
            opcoesMenu: [],
            logMensagens: []
        };
    }
}

/**
 * Salva o objeto de configuração no arquivo 'data.json'.
 * @param {object} config O objeto de configuração a ser salvo.
 */
function salvarConfig(config) {
    const configPath = path.resolve(__dirname, 'assets/data.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Envia uma mídia (imagem, gif, pdf, áudio, sticker) para uma mensagem.
 * @param {Message} msg O objeto da mensagem do WhatsApp.
 * @param {string} caminho O caminho relativo para o arquivo de mídia.
 * @param {string} [legenda] A legenda opcional para a mídia.
 */
async function enviarMidia(msg, caminho, legenda) {
    if (!caminho) return;
    
    // Verifica se o caminho já é absoluto, se não, constrói o caminho absoluto
    const filePath = path.isAbsolute(caminho) ? caminho : path.join(__dirname, caminho);
    
    console.log('Tentando enviar mídia:', {
        caminhoRecebido: caminho,
        caminhoAbsoluto: filePath,
        existe: fs.existsSync(filePath)
    });

    try {
        if (fs.existsSync(filePath)) {
            const media = await MessageMedia.fromFilePath(filePath);
            await msg.reply(media, undefined, { caption: legenda || '' });
        } else {
            console.warn('Arquivo de mídia não encontrado:', filePath);
            if (legenda) await msg.reply(legenda);
        }
    } catch (e) {
        console.error('Erro ao enviar mídia:', e);
        if (legenda) await msg.reply(legenda);
    }
}

/**
 * Envia botões interativos como resposta
 * @param {Message} msg Objeto da mensagem recebida
 * @param {string} texto Texto a ser exibido com os botões
 * @param {Array} botoes Array de objetos com {texto, valor}
 */
async function enviarBotoes(msg, texto, botoes) {
    try {
        const buttons = botoes.map(btn => ({
            body: btn.texto,
            id: btn.valor
        }));
        
        await client.sendMessage(msg.from, {
            text: texto,
            buttons: buttons
        });
    } catch (e) {
        console.error('Erro ao enviar botões:', e);
        await msg.reply('❌ Ocorreu um erro ao enviar as opções.');
    }
}

/**
 * Monta um array de respostas baseado no tipo e conteúdo.
 * @param {string} tipo O tipo de resposta ('simples' ou 'multipla').
 * @param {string} resposta O conteúdo da resposta de texto.
 * @param {string} imagem O caminho da imagem.
 * @param {string} gif O caminho do gif.
 * @param {string} pdf O caminho do pdf.
 * @param {string} audio O caminho do áudio.
 * @param {string} sticker O caminho do sticker.
 * @returns {Array<object>} Um array de objetos de resposta.
 */
function montarRespostas(tipo, resposta, imagem, gif, pdf, audio, sticker) {
    const respostas = [];
    
    // Sempre adiciona o texto primeiro se existir
    if (resposta) {
        respostas.push({ tipo: 'texto', conteudo: resposta });
    }
    
    // Adiciona mídias se existirem
    if (imagem) respostas.push({ tipo: 'media', caminho: imagem, legenda: '' });
    if (pdf) respostas.push({ tipo: 'media', caminho: pdf, legenda: '' });
    if (audio) respostas.push({ tipo: 'media', caminho: audio, legenda: '' });
    if (sticker) respostas.push({ tipo: 'media', caminho: sticker, legenda: '' });
    
    return respostas;
}

/**
 * Verifica se o bot deve responder a uma mensagem em um chat específico.
 * @param {Chat} chat O objeto do chat do WhatsApp.
 * @returns {boolean} True se deve responder, false caso contrário.
 */
function deveResponderMensagem(chat) {
    const currentConfig = lerConfig();
    if (!chat.isGroup) return true;
    return currentConfig.mensagensParaGrupos;
}

// =========================
// Configuração do Servidor
// =========================
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Estado global do bot
let client = null;
let qrCode = null;
let connectionStatus = 'disconnected';
let currentConfig = lerConfig();

// Verificação inicial de pastas e arquivos
const assetsPath = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsPath)) {
    console.error('ATENÇÃO: Pasta assets não encontrada!');
    console.error('Caminho esperado:', assetsPath);
    console.error('Diretório atual:', __dirname);
} else {
    console.log('Pasta assets encontrada em:', assetsPath);
}

// =========================
// Funções de Comunicação WebSocket
// =========================

function broadcastUpdate(type, data) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// =========================
// Inicialização do WhatsApp Bot
// =========================

async function initWhatsApp() {
    try {
        console.log('Iniciando WhatsApp...');
        connectionStatus = 'connecting';
        qrCode = null; 
        broadcastUpdate('status', 'connecting');

        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: path.join(__dirname, 'tokens/whatsapp-session')
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            }
        });

        client.on('qr', async (qrData) => {
            console.log('Novo QR Code recebido');
            try {
                const qrCodeImage = await qrcode.toDataURL(qrData);
                qrCode = qrCodeImage;
                broadcastUpdate('qr', qrCodeImage);
            } catch (err) {
                console.error('Erro ao gerar QR Code:', err);
                qrCode = null;
                broadcastUpdate('qr', null);
            }
        });

        client.on('ready', () => {
            console.log('Cliente WhatsApp pronto');
            connectionStatus = 'connected';
            broadcastUpdate('status', 'connected');
            qrCode = null;
        });

        client.on('message', async (msg) => {
            const chat = await msg.getChat();
            if (!deveResponderMensagem(chat)) return;

            currentConfig = lerConfig();
            const texto = msg.body.toLowerCase().trim();
            const contato = await msg.getContact();
            const nome = contato.pushname || contato.number;
            const telefone = msg.from.replace('@c.us', '');
            console.log(`[MSG RECEBIDA] ${nome} (${telefone}): ${texto}`);

            // Log da mensagem
            currentConfig.logMensagens = currentConfig.logMensagens || [];
            currentConfig.logMensagens.push(`[${new Date().toLocaleString()}] ${nome} (${telefone}): ${texto}`);
            if (currentConfig.logMensagens.length > 200) {
                currentConfig.logMensagens = currentConfig.logMensagens.slice(-200);
            }
            salvarConfig(currentConfig);

            // Simula "digitando" ou "gravando"
            if (currentConfig.mostrarDigitando) {
                await chat.sendStateTyping();
            } else if (currentConfig.mostrarGravandoAudio) {
                await chat.sendStateRecording();
            }

            // Processa a resposta
            try {
                const opcao = currentConfig.opcoesMenu.find(o =>
                    o.acionador &&
                    o.acionador.toLowerCase() === texto
                );

                if (opcao) {
                    // Se houver botões, envia eles
                    if (opcao.temBotoes && opcao.opcoesBotoes?.length > 0) {
                        await enviarBotoes(msg, opcao.resposta, opcao.opcoesBotoes);
                    } else {
                        const respostas = montarRespostas(
                            'simples',
                            opcao.resposta,
                            opcao.arquivoImagem,
                            '',
                            opcao.arquivoPdf,
                            opcao.arquivoAudio,
                            opcao.arquivoSticker
                        );

                        for (const resposta of respostas) {
                            if (resposta.tipo === 'media') {
                                await enviarMidia(msg, resposta.caminho, resposta.legenda);
                            } else if (resposta.tipo === 'texto') {
                                await msg.reply(resposta.conteudo);
                            }
                        }
                    }
                    
                    // Se houver link, envia como mensagem separada
                    if (opcao.link) {
                        await msg.reply(`🔗 Link: ${opcao.link}`);
                    }
                } else {
                    await msg.reply(currentConfig.mensagemDefault);
                }
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
                await msg.reply('❌ Desculpe, ocorreu um erro ao processar sua solicitação.');
            } finally {
                await chat.clearState();
            }
        });

        client.on('disconnected', (reason) => {
            console.log('Cliente desconectado:', reason);
            connectionStatus = 'disconnected';
            broadcastUpdate('status', 'disconnected');
            qrCode = null;
        });

        await client.initialize();
        console.log('Cliente WhatsApp iniciado com sucesso');
        return true;
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error);
        connectionStatus = 'disconnected';
        broadcastUpdate('status', 'disconnected');
        return false;
    }
}

// =========================
// Configuração do WebSocket Server
// =========================
wss.on('connection', (ws) => {
    console.log('Novo cliente WebSocket conectado');

    if (qrCode) {
        ws.send(JSON.stringify({ type: 'qr', data: qrCode }));
    }
    ws.send(JSON.stringify({ type: 'status', data: connectionStatus }));

    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});

// =========================
// Rotas da API HTTP
// =========================
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
            return res.json({ status: 'already_connected', message: 'WhatsApp já está conectado!' });
        }

        if (connectionStatus === 'connecting') {
            if (qrCode) {
                return res.json({ qrCode: qrCode, status: 'waiting_scan', message: 'Aguardando escaneamento do QR code.' });
            }
            return res.json({ status: 'connecting', message: 'Já está conectando, aguarde o QR code ou a conexão.' });
        }

        const success = await initWhatsApp();

        if (success) {
            if (qrCode) {
                res.json({ qrCode: qrCode, status: 'waiting_scan', message: 'QR code gerado! Escaneie com seu WhatsApp.' });
            } else {
                res.json({ status: connectionStatus, message: 'WhatsApp inicializado com sucesso, aguardando QR code ou conexão.' });
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

app.post('/save-data', async (req, res) => {
    try {
        const newConfig = { ...lerConfig(), ...req.body };
        salvarConfig(newConfig);
        res.json({ success: true, message: 'Configuração salva com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        res.status(500).json({
            error: 'Erro ao salvar dados',
            details: error.message
        });
    }
});

app.get('/data.json', (req, res) => {
    try {
        const config = lerConfig();
        res.json(config);
    } catch (error) {
        console.error('Erro ao ler dados:', error);
        res.status(500).json({
            error: 'Erro ao ler dados',
            details: error.message
        });
    }
});

// =========================
// Inicialização do Servidor
// =========================
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    // Verifica arquivos na pasta assets ao iniciar
    const dataJsonPath = path.join(__dirname, 'assets/data.json');
    if (!fs.existsSync(dataJsonPath)) {
        console.error('Arquivo data.json não encontrado na pasta assets!');
    } else {
        console.log('Arquivo data.json encontrado:', dataJsonPath);
    }
});