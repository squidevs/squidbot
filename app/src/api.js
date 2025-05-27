import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import path from 'path';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import qrcode from 'qrcode'; // Importa a biblioteca qrcode

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
        // Retorna uma configuração padrão se o arquivo não existir ou for inválido
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
    const filePath = path.join(__dirname, caminho);
    try {
        if (fs.existsSync(filePath)) {
            const media = await MessageMedia.fromFilePath(filePath);
            await msg.reply(media, undefined, { caption: legenda || '' });
        } else {
            console.warn('Arquivo de mídia não encontrado:', filePath);
            if (legenda) await msg.reply(legenda); // Envia a legenda mesmo sem a mídia
        }
    } catch (e) {
        console.error('Erro ao enviar mídia:', e);
        if (legenda) await msg.reply(legenda); // Em caso de erro, tenta enviar a legenda
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
    if (tipo === 'multipla') {
        // Adiciona a resposta de texto primeiro, se existir
        if (resposta) respostas.push({ tipo: 'texto', conteudo: resposta });
        // Adiciona as mídias individualmente
        if (imagem) respostas.push({ tipo: 'media', caminho: imagem, legenda: resposta });
        if (gif) respostas.push({ tipo: 'media', caminho: gif, legenda: resposta });
        if (pdf) respostas.push({ tipo: 'media', caminho: pdf, legenda: resposta });
        if (audio) respostas.push({ tipo: 'media', caminho: audio }); // Áudio geralmente não tem legenda visível
        if (sticker) respostas.push({ tipo: 'media', caminho: sticker }); // Sticker também
    } else { // Tipo 'simples' ou qualquer outro
        if (imagem || gif || pdf) {
            const caminho = imagem || gif || pdf;
            respostas.push({ tipo: 'media', caminho, legenda: resposta });
        } else if (audio || sticker) {
            // Para áudio/sticker em resposta simples, se houver texto, envia o texto e depois a mídia
            if (resposta) respostas.push({ tipo: 'texto', conteudo: resposta });
            const caminho = audio || sticker;
            respostas.push({ tipo: 'media', caminho });
        } else if (resposta) {
            respostas.push({ tipo: 'texto', conteudo: resposta });
        }
    }
    return respostas;
}

/**
 * Verifica se o bot deve responder a uma mensagem em um chat específico.
 * @param {Chat} chat O objeto do chat do WhatsApp.
 * @returns {boolean} True se deve responder, false caso contrário.
 */
function deveResponderMensagem(chat) {
    const currentConfig = lerConfig(); // Lê a configuração mais recente
    if (!chat.isGroup) return true; // Sempre responde a mensagens privadas
    return currentConfig.mensagensParaGrupos; // Responde a grupos apenas se permitido na config
}

// =========================
// Configuração do Servidor
// =========================
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Para parsear JSON no corpo das requisições
app.use(cors()); // Permite requisições de diferentes origens (importante para o frontend)

// Estado global do bot
let client = null;
let qrCode = null; // Armazena o QR code em base64
let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'
let currentConfig = lerConfig(); // Carrega a configuração inicial

// =========================
// Funções de Comunicação WebSocket
// =========================

/**
 * Envia uma atualização para todos os clientes WebSocket conectados.
 * @param {string} type O tipo da mensagem (ex: 'qr', 'status').
 * @param {any} data Os dados a serem enviados.
 */
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

/**
 * Inicializa o cliente WhatsApp.
 * Cria uma nova instância do cliente, configura os listeners de eventos
 * e tenta inicializar a sessão.
 * @returns {Promise<boolean>} True se a inicialização foi bem-sucedida, false caso contrário.
 */
async function initWhatsApp() {
    try {
        console.log('Iniciando WhatsApp...');
        connectionStatus = 'connecting';
        // Limpa o QR code anterior ao tentar conectar novamente
        qrCode = null; 
        broadcastUpdate('status', 'connecting'); // Informa o frontend que está conectando

        // Cria uma nova instância do cliente WhatsApp
        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: path.join(__dirname, 'tokens/whatsapp-session') // Caminho para armazenar a sessão
            }),
            puppeteer: {
                headless: true, // Executa o navegador em modo headless (sem interface gráfica)
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            }
        });

        // Listener para o evento 'qr': quando um novo QR code é gerado
        client.on('qr', async (qrData) => { // Renomeado 'qr' para 'qrData' para clareza
            console.log('Novo QR Code de dados recebido:', qrData);
            try {
                // Converte a string de dados do QR Code em uma URL de dados base64 da imagem PNG
                const qrCodeImage = await qrcode.toDataURL(qrData);
                console.log('QR Code imagem base64 gerada. Tamanho:', qrCodeImage.length);
                qrCode = qrCodeImage; // Armazena a URL de dados completa
                broadcastUpdate('qr', qrCodeImage); // Envia a URL de dados completa para o frontend
            } catch (err) {
                console.error('Erro ao gerar imagem do QR Code:', err);
                qrCode = null; // Garante que o QR code esteja nulo em caso de erro
                broadcastUpdate('qr', null); // Envia nulo para o frontend para indicar erro
            }
        });

        // Listener para o evento 'ready': quando o cliente está pronto e conectado
        client.on('ready', () => {
            console.log('Cliente WhatsApp pronto');
            connectionStatus = 'connected';
            broadcastUpdate('status', 'connected'); // Informa o frontend que está conectado
            qrCode = null; // Limpa o QR code após a conexão bem-sucedida
        });

        // Listener para o evento 'message': quando uma nova mensagem é recebida
        client.on('message', async (msg) => {
            const chat = await msg.getChat();
            // Verifica se deve responder à mensagem (ex: ignorar grupos se configurado)
            if (!deveResponderMensagem(chat)) {
                return;
            }

            currentConfig = lerConfig(); // Recarrega a configuração para garantir que esteja atualizada
            const texto = msg.body.toLowerCase().trim();
            const contato = await msg.getContact();
            const nome = contato.pushname || contato.number;
            const telefone = msg.from.replace('@c.us', '');
            console.log(`[MSG RECEBIDA] ${nome} (${telefone}): ${texto}`);

            // Log das mensagens recebidas
            currentConfig.logMensagens = currentConfig.logMensagens || [];
            currentConfig.logMensagens.push(`[${new Date().toLocaleString()}] ${nome} (${telefone}): ${texto}`);
            // Limita o log a 200 mensagens para não sobrecarregar o arquivo
            if (currentConfig.logMensagens.length > 200) currentConfig.logMensagens = currentConfig.logMensagens.slice(-200);
            salvarConfig(currentConfig);

            // Simula "digitando" ou "gravando áudio" se configurado
            if (currentConfig.mostrarDigitando) {
                await chat.sendStateTyping();
            } else if (currentConfig.mostrarGravandoAudio) {
                await chat.sendStateRecording();
            }

            // Processa a resposta baseada nas opções do menu
            try {
                const opcao = currentConfig.opcoesMenu.find(o =>
                    o.acionador &&
                    o.acionador.toLowerCase() === texto
                );

                if (opcao) {
                    const respostas = montarRespostas(
                        opcao.tipoResposta,
                        opcao.resposta,
                        opcao.imagem,
                        opcao.gif,
                        opcao.pdf,
                        opcao.audio,
                        opcao.sticker
                    );

                    for (const resposta of respostas) {
                        if (resposta.tipo === 'media') {
                            await enviarMidia(msg, resposta.caminho, resposta.legenda);
                        } else if (resposta.tipo === 'texto') {
                            await msg.reply(resposta.conteudo);
                        }
                    }
                } else {
                    // Resposta padrão se nenhuma opção for encontrada
                    await msg.reply(currentConfig.mensagemDefault);
                }
            } catch (error) {
                console.error('Erro ao processar mensagem:', error);
                try {
                    await msg.reply('❌ Desculpe, ocorreu um erro ao processar sua solicitação.');
                } catch (e) {
                    console.error('Erro ao enviar mensagem de erro:', e);
                }
            } finally {
                // Limpa o estado de "digitando" ou "gravando"
                await chat.clearState();
            }
        });

        // Listener para o evento 'disconnected': quando o cliente é desconectado
        client.on('disconnected', (reason) => {
            console.log('Cliente desconectado:', reason);
            connectionStatus = 'disconnected';
            broadcastUpdate('status', 'disconnected'); // Informa o frontend sobre a desconexão
            qrCode = null; // Limpa o QR code ao desconectar
            // Opcional: Tentar inicializar novamente após um tempo, se desejar reconexão automática
            // setTimeout(() => initWhatsApp(), 5000);
        });

        await client.initialize(); // Inicia o cliente WhatsApp
        console.log('Cliente WhatsApp iniciado com sucesso');

        return true;
    } catch (error) {
        console.error('Erro ao inicializar WhatsApp:', error);
        connectionStatus = 'disconnected';
        broadcastUpdate('status', 'disconnected'); // Informa o frontend sobre o erro
        return false;
    }
}

// =========================
// Configuração do WebSocket Server
// =========================
wss.on('connection', (ws) => {
    console.log('Novo cliente WebSocket conectado');

    // Envia o estado atual (QR code ou status de conexão) para o novo cliente
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

/**
 * Rota para obter o status atual da conexão do WhatsApp.
 * Retorna se está conectado e se há um QR code disponível.
 */
app.get('/status', (req, res) => {
    res.json({
        status: connectionStatus,
        hasQR: !!qrCode // Retorna true se qrCode não for null ou undefined
    });
});

/**
 * Rota para iniciar o processo de conexão do WhatsApp.
 * Se já estiver conectado ou conectando, retorna o status atual.
 * Caso contrário, tenta inicializar o cliente WhatsApp.
 */
app.post('/connect', async (req, res) => {
    console.log('Requisição de conexão recebida');

    try {
        if (connectionStatus === 'connected') {
            return res.json({ status: 'already_connected', message: 'WhatsApp já está conectado!' });
        }

        if (connectionStatus === 'connecting') {
            // Se já estiver conectando e um QR code já foi gerado, retorna-o
            if (qrCode) {
                return res.json({ qrCode: qrCode, status: 'waiting_scan', message: 'Aguardando escaneamento do QR code.' });
            }
            return res.json({ status: 'connecting', message: 'Já está conectando, aguarde o QR code ou a conexão.' });
        }

        // Inicia o processo de conexão se não estiver conectado ou conectando
        const success = await initWhatsApp();

        if (success) {
            // Se a inicialização foi bem-sucedida e um QR code foi gerado imediatamente
            if (qrCode) {
                res.json({ qrCode: qrCode, status: 'waiting_scan', message: 'QR code gerado! Escaneie com seu WhatsApp.' });
            } else {
                // Se a inicialização foi bem-sucedida, mas o QR code ainda não chegou (ou já conectou)
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

/**
 * Rota para salvar os dados de configuração (opções de menu, etc.).
 * Recebe o objeto de configuração no corpo da requisição.
 */
app.post('/save-data', async (req, res) => {
    try {
        // Assume que o corpo da requisição contém as opções de menu e outras configurações
        const newConfig = { ...lerConfig(), ...req.body }; // Mescla com a config existente
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

/**
 * Rota para obter todos os dados de configuração.
 */
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
// Inicialização do Servidor HTTP/WebSocket
// =========================
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    // Opcional: Iniciar o WhatsApp automaticamente ao ligar o servidor
    // initWhatsApp();
});
