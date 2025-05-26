// Salve este arquivo como chatbot.cjs

// =========================
// Dependências e Configuração
// =========================
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const { BitlyClient } = require('bitly');
const bitly = new BitlyClient('4a4a0a0c93ac687abcad7321bd93a8b4aa1734e2');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'assets') });

// =========================
// Funções utilitárias
// =========================
function lerConfig() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data.json'), 'utf8'));
}
function salvarConfig(config) {
    fs.writeFileSync(path.resolve(__dirname, 'data.json'), JSON.stringify(config, null, 2));
}

// =========================
// Inicialização do Bot
// =========================
let config = lerConfig();

async function encurtarLink(url) {
    try {
        const response = await bitly.shorten(url);
        return response.link;
    } catch (error) {
        console.error('Erro ao encurtar o link:', error);
        return url;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função utilitária para simular digitando e responder
async function sendTypingAndReply(chat, msg, resposta) {
    await chat.sendStateTyping();
    await delay(100);
    await msg.reply(resposta);
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// =========================
// Rotas do Painel Admin
// =========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para fornecer config para frontend
app.get('/data.json', (req, res) => {
    res.json(config);
});

// CRUD Opções do Menu
app.post('/admin/add-opcao-menu', upload.fields([
    { name: 'audio' }, { name: 'pdf' }, { name: 'gif' }, { name: 'imagem' }, { name: 'sticker' }
]), (req, res) => {
    const files = req.files || {};
    function getFilePathMenu(field) {
        if (files[field] && files[field][0]) {
            let ext = path.extname(files[field][0].originalname) || '';
            if (!ext) {
                const mimeType = files[field][0].mimetype;
                if (mimeType.startsWith('image/')) ext = '.png';
                else if (mimeType === 'application/pdf') ext = '.pdf';
                else if (mimeType.startsWith('audio/')) ext = '.mp3';
                else if (mimeType === 'image/webp') ext = '.webp';
                else ext = '.dat'; // Extensão genérica para casos desconhecidos
            }
            let filename = files[field][0].filename;
            let newPath = path.join('assets', filename + ext);
            let fullNewPath = path.join(__dirname, newPath);
            if (fs.existsSync(fullNewPath)) fs.unlinkSync(fullNewPath);
            fs.renameSync(files[field][0].path, fullNewPath);
            return newPath.replace(/\\/g, '/');
        }
        return req.body[field] || '';
    }
    const novaOpcao = {
        id: Date.now(),
        titulo: req.body.titulo,
        acionador: req.body.acionador || '',
        resposta: req.body.resposta,
        imagem: getFilePathMenu('imagem'),
        gif: getFilePathMenu('gif'),
        pdf: getFilePathMenu('pdf'),
        audio: getFilePathMenu('audio'),
        sticker: getFilePathMenu('sticker'),
        localizacao: {
            lat: req.body.lat || '',
            lng: req.body.lng || '',
            descricao: req.body.descricao || ''
        },
        delay: req.body.delay || '',
        mostrarDigitando: req.body.mostrarDigitando === 'true' || req.body.mostrarDigitando === true,
        mostrarGravandoAudio: req.body.mostrarGravandoAudio === 'true' || req.body.mostrarGravandoAudio === true,
        statusBot: req.body.statusBot || '',
        tempoPausa: req.body.tempoPausa || '',
        tipoResposta: req.body.tipoResposta || 'unica'
    };
    config.opcoesMenu.push(novaOpcao);
    salvarConfig(config);
    config = lerConfig();
    console.log(`[ADMIN] Opção de menu adicionada: ${novaOpcao.titulo}`);
    res.json({ ok: true, opcao: novaOpcao });
});

app.post('/admin/edit-opcao-menu', upload.fields([
    { name: 'audio' }, { name: 'pdf' }, { name: 'gif' }, { name: 'imagem' }, { name: 'sticker' }
]), (req, res) => {
    console.log('[DEBUG] ID recebido:', req.body.id);
    //console.log('[DEBUG] Estado atual de opcoesMenu:', config.opcoesMenu);

    const files = req.files || {};
    function getFilePathMenuEdit(field, oldValue) {
        if (files[field] && files[field][0]) {
            let ext = path.extname(files[field][0].originalname) || '';
            if (!ext) {
                const mimeType = files[field][0].mimetype;
                if (mimeType.startsWith('image/')) ext = '.png';
                else if (mimeType === 'application/pdf') ext = '.pdf';
                else if (mimeType.startsWith('audio/')) ext = '.mp3';
                else if (mimeType === 'image/webp') ext = '.webp';
                else ext = '.dat'; // Extensão genérica para casos desconhecidos
            }
            let filename = files[field][0].filename;
            let newPath = path.join('assets', filename + ext);
            let fullNewPath = path.join(__dirname, newPath);
            if (fs.existsSync(fullNewPath)) fs.unlinkSync(fullNewPath);
            fs.renameSync(files[field][0].path, fullNewPath);
            return newPath.replace(/\\/g, '/');
        }
        return req.body[field] || oldValue || '';
    }
    // Corrigir o ID para garantir que seja um número simples
    const id = Array.isArray(req.body.id) ? parseInt(req.body.id[0], 10) : parseInt(req.body.id, 10);
    const idx = config.opcoesMenu.findIndex(o => o.id === id);
    const sucess = ""
    if (idx !== -1) {
        const opcao = config.opcoesMenu[idx];
        opcao.titulo = req.body.titulo;
        opcao.acionador = req.body.acionador || '';
        opcao.resposta = req.body.resposta;
        opcao.imagem = getFilePathMenuEdit('imagem', opcao.imagem);
        opcao.gif = getFilePathMenuEdit('gif', opcao.gif);
        opcao.pdf = getFilePathMenuEdit('pdf', opcao.pdf);
        opcao.audio = getFilePathMenuEdit('audio', opcao.audio);
        opcao.sticker = getFilePathMenuEdit('sticker', opcao.sticker);
        opcao.localizacao = {
            lat: req.body.lat || '',
            lng: req.body.lng || '',
            descricao: req.body.descricao || ''
        };
        opcao.delay = req.body.delay || '';
        opcao.mostrarDigitando = req.body.mostrarDigitando === 'true' || req.body.mostrarDigitando === true;
        opcao.mostrarGravandoAudio = req.body.mostrarGravandoAudio === 'true' || req.body.mostrarGravandoAudio === true;
        opcao.statusBot = req.body.statusBot || '';
        opcao.tempoPausa = req.body.tempoPausa || '';
        opcao.tipoResposta = req.body.tipoResposta || 'unica';
        salvarConfig(config);
        config = lerConfig();
        console.log(`[ADMIN] Opção de menu editada: ${opcao.titulo}`);
        console.log('Salvo com sucesso!');
        res.json({ ok: true });
    } else {
        console.log('[DEBUG] ID não encontrado:', id);
        res.status(404).json({ ok: false });
    }
});

app.post('/admin/del-opcao-menu', (req, res) => {
    const excluida = config.opcoesMenu.find(o => o.id == req.body.id);
    config.opcoesMenu = config.opcoesMenu.filter(o => o.id != req.body.id);
    salvarConfig(config);
    config = lerConfig();
    console.log(`[ADMIN] Opção de menu excluída: ${excluida ? excluida.titulo : req.body.id}`);
    res.json({ ok: true });
});

// Atualizar mensagem default
app.post('/admin/mensagem-default', (req, res) => {
    config.mensagemDefault = req.body.mensagemDefault;
    salvarConfig(config);
    config = lerConfig();
    res.json({ ok: true });
});

// Atualizar status do bot
let botStatus = 'Desconhecido';
client.on('ready', () => {
    botStatus = 'Conectado';
});
client.on('disconnected', () => {
    botStatus = 'Desconectado';
});

// Salvar configurações do painel admin
app.post('/admin/config', (req, res) => {
    config.mensagensParaGrupos = req.body.mensagensParaGrupos === 'true' || req.body.mensagensParaGrupos === true;
    config.delayMensagem = parseInt(req.body.delayMensagem) || 1000;
    config.botPausado = req.body.botPausado === 'true' || req.body.botPausado === true;
    config.localizacao = config.localizacao || {};
    config.localizacao.lat = req.body.lat || '';
    config.localizacao.lng = req.body.lng || '';
    config.localizacao.descricao = req.body.descricao || '';
    config.audio = req.body.audio;
    config.pdf = req.body.pdf;
    config.gif = req.body.gif;
    config.imagem = req.body.imagem;
    salvarConfig(config);
    config = lerConfig(); // Resetar config em memória
    console.log('🔄 Configurações do painel admin salvas e recarregadas!');
    res.json({ ok: true });
});

// CRUD de mensagens agendadas com recorrência, status e upload de mídia
app.post('/admin/add-mensagem-agendada', upload.fields([
    { name: 'audio' }, { name: 'pdf' }, { name: 'gif' }, { name: 'imagem' }, { name: 'sticker' }
]), (req, res) => {
    const files = req.files || {};
    function getFilePathMsg(field) {
        if (files[field] && files[field][0]) {
            const ext = path.extname(files[field][0].originalname) || '';
            let filename = files[field][0].filename;
            let newPath = path.join('assets', filename + ext);
            let fullNewPath = path.join(__dirname, newPath);
            if (fs.existsSync(fullNewPath)) fs.unlinkSync(fullNewPath);
            fs.renameSync(files[field][0].path, fullNewPath);
            return newPath.replace(/\\/g, '/');
        }
        return req.body[field] || '';
    }
    config.mensagensAgendadas.push({
        nome: req.body.nome || '',
        telefone: req.body.telefone || '',
        mensagem: req.body.mensagem || '',
        datahora: req.body.datahora || '',
        recorrencia: req.body.recorrencia || 'unica',
        status: 'nao_enviada',
        imagem: getFilePathMsg('imagem'),
        gif: getFilePathMsg('gif'),
        pdf: getFilePathMsg('pdf'),
        audio: getFilePathMsg('audio'),
        sticker: getFilePathMsg('sticker'),
        tipoResposta: req.body.tipoResposta || 'unica'
    });
    salvarConfig(config);
    config = lerConfig(); // Resetar config em memória
    console.log(`[ADMIN] Mensagem agendada adicionada para ${req.body.telefone || ''}`);
    res.json({ ok: true });
});

app.post('/admin/edit-mensagem-agendada', upload.fields([
    { name: 'audio' }, { name: 'pdf' }, { name: 'gif' }, { name: 'imagem' }, { name: 'sticker' }
]), (req, res) => {
    const files = req.files || {};
    function getFilePathMsgEdit(field, oldValue) {
        if (files[field] && files[field][0]) {
            const ext = path.extname(files[field][0].originalname) || '';
            // fallback de extensão se não houver
            if (!ext) {
                if (field === 'imagem' || field === 'sticker' || field === 'gif') ext = '.png';
                if (field === 'pdf') ext = '.pdf';
                if (field === 'audio') ext = '.mp3';
            }
            let filename = files[field][0].filename;
            let newPath = path.join('assets', filename + ext);
            let fullNewPath = path.join(__dirname, newPath);
            if (fs.existsSync(fullNewPath)) fs.unlinkSync(fullNewPath);
            fs.renameSync(files[field][0].path, fullNewPath);
            return newPath.replace(/\\/g, '/');
        }
        return req.body[field] || oldValue || '';
    }
    const idx = req.body.index;
    if (config.mensagensAgendadas[idx]) {
        const m = config.mensagensAgendadas[idx];
        m.nome = req.body.nome || '';
        m.telefone = req.body.telefone || '';
        m.mensagem = req.body.mensagem || '';
        m.datahora = req.body.datahora || '';
        m.recorrencia = req.body.recorrencia || 'unica';
        m.imagem = getFilePathMsgEdit('imagem', m.imagem);
        m.gif = getFilePathMsgEdit('gif', m.gif);
        m.pdf = getFilePathMsgEdit('pdf', m.pdf);
        m.audio = getFilePathMsgEdit('audio', m.audio);
        m.sticker = getFilePathMsgEdit('sticker', m.sticker);
        m.tipoResposta = req.body.tipoResposta || 'unica';
        salvarConfig(config);
        config = lerConfig();
        console.log(`[ADMIN] Mensagem agendada editada para ${m.telefone}`);
        res.json({ ok: true });
    } else {
        res.status(404).json({ ok: false });
    }
});

app.post('/admin/del-mensagem-agendada', (req, res) => {
    const idx = Number(req.body.index);
    let removida = null;
    if (!isNaN(idx) && idx >= 0 && idx < config.mensagensAgendadas.length) {
        removida = config.mensagensAgendadas[idx];
        config.mensagensAgendadas.splice(idx, 1);
        salvarConfig(config);
        config = lerConfig();
        const info = removida && (removida.nome || removida.telefone || `índice ${idx}`);
        console.log(`[ADMIN] Mensagem agendada removida: ${info}`);
        res.json({ ok: true, removida: info });
    } else {
        console.log(`[ADMIN] Tentativa de remover mensagem agendada com índice inválido: ${req.body.index}`);
        res.status(400).json({ ok: false, error: 'Índice inválido' });
    }
});

// QR Code
app.get('/admin/qrcode', (req, res) => {
    // Exibe instrução para ler QR code no terminal
    res.send('<h2>Abra o terminal do servidor para visualizar o QR Code do WhatsApp.</h2>');
});

// Página de menu (index.html)
app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// Inicializa servidor web
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// =========================
// Lógica do Bot usando config.json
// =========================

// Função para enviar mídia (imagem, gif, pdf, áudio, sticker)
async function enviarMidia(msg, caminho, legenda) {
    if (!caminho) return;
    const filePath = path.join(__dirname, caminho);
    const fs = require('fs');
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

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📲 Escaneie o QR code para logar no WhatsApp');
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
});

client.on('authenticated', () => console.log('Sessão autenticada com sucesso.'));
client.on('auth_failure', () => console.log('❌ Falha na autenticação. Apague a pasta .wwebjs_auth e tente novamente.'));
client.on('disconnected', () => console.log('⚠️ Cliente desconectado. Reconectando...'));

// Log de todas as mensagens recebidas
client.on('message', async msg => {
    config = lerConfig();
    const texto = msg.body.toLowerCase().trim();
    const contato = await msg.getContact();
    const nome = contato.pushname || contato.number;
    const telefone = msg.from.replace('@c.us', '');
    const chat = await msg.getChat();
    console.log(`[MSG RECEBIDA] ${nome} (${telefone}): ${texto}`);

    // Log das mensagens
    config.logMensagens = config.logMensagens || [];
    config.logMensagens.push(`[${new Date().toLocaleString()}] ${nome} (${telefone}): ${texto}`);
    if (config.logMensagens.length > 200) config.logMensagens = config.logMensagens.slice(-200);
    salvarConfig(config);

    // Pausa global
    if (config.botPausado === true) return;

    // Ignorar mensagens de status, do próprio bot, vazias ou de grupo (se não permitido)
    if (msg.fromMe || msg.isStatus || !texto || (chat.isGroup && !config.mensagensParaGrupos)) return;

    // --- ATIVA PAUSA AUTOMÁTICA ao digitar '4' ---
    if (texto === '4' && !config.pausaAutomatica?.[msg.from]) {
        config.pausaAutomatica = config.pausaAutomatica || {};
        config.pausaAutomatica[msg.from] = Date.now() + 60 * 60 * 1000;
        salvarConfig(config);
        await chat.sendStateTyping();
        await delay(config.delayMensagem);
        await msg.reply('💬 *Falar com Atendente*\n\nVocê será encaminhado para atendimento humano em instantes...\n(O bot ficará pausado por 1 hora ou até você digitar uma saudação ou 0)');
        return;
    }

    // --- PAUSA AUTOMÁTICA: só processa saudação ou '0' durante a pausa ---
    if (config.pausaAutomatica?.[msg.from]) {
        if (Date.now() > config.pausaAutomatica[msg.from]) {
            delete config.pausaAutomatica[msg.from];
            salvarConfig(config);
        } else {
            // Só libera se for saudação ou '0'
            const textoNorm = texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
            const saudacoes = [
                'bom dia', 'boa tarde', 'boa noite', 'olá', 'ola', 'oi', 'oiê', 'oii', 'oiii', 'eae', 'e aí', 'fala', 'hello', 'hi', 'hey', 'hola', 'oi squidev', 'olá squidev', '👋', '🦑',
                'boa madrugada', 'salve', 'saudações', 'saudacoes', 'opa', 'yo', 'yoo', 'yo!', 'hey there', 'hi there', 'greetings', 'aloha', 'sup', 'sup?', 'tudo bem', 'tudo bom', 'como vai', 'como está', 'como estas', 'como está?', 'como estas?', 'tudo certo', 'tudo ok', 'tudo bem?', 'tudo bom?', 'e aí, beleza?', 'e ai', 'e aí?', 'e ai?', 'e aee', 'e aeee', 'e aew', 'e aeww', 'e aewww', 'e ai beleza', 'e aí beleza', 'e ai beleza?', 'e aí beleza?', 'e ai blz', 'e aí blz', 'e ai blz?', 'e aí blz?', 'oi bot', 'olá bot', 'ola bot', 'oi squibot', 'olá squibot', 'ola squibot', 'squibot', 'squidev', 'squid', 'squid bot', 'squidbot', 'squid dev', 'squiddev', 'squid dev bot', 'squiddev bot', 'squiddevbot', 'squid devbot', 'squid bot dev', 'squid botdev', 'squidbot dev', 'squidbotdev'
            ];
            const saudacoesNorm = saudacoes.map(s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase());
            if (saudacoesNorm.includes(textoNorm) || textoNorm === '0') {
                delete config.pausaAutomatica[msg.from];
                salvarConfig(config);
                await msg.reply('🤖 Bot reativado! Como posso ajudar?');
            }
            return;
        }
    }

    // Responder com emoji
    await msg.react('🤖');

    // Saudação e menu (todas as variações)
    const opcoesTitulos = (config.opcoesMenu || []).map(o => o.titulo.toLowerCase());
    const saudacoes = [
        'bom dia', 'boa tarde', 'boa noite', 'olá', 'ola', 'oi', 'oiê', 'oii', 'oiii', 'eae', 'e aí', 'fala', 'hello', 'hi', 'hey', 'hola', 'oi squidev', 'olá squidev', '👋', '🦑',
        'boa madrugada', 'salve', 'saudações', 'saudacoes', 'opa', 'yo', 'yoo', 'yo!', 'hey there', 'hi there', 'greetings', 'aloha', 'sup', 'sup?', 'tudo bem', 'tudo bom', 'como vai', 'como está', 'como estas', 'como está?', 'como estas?', 'tudo certo', 'tudo ok', 'tudo bem?', 'tudo bom?', 'e aí, beleza?', 'e ai', 'e aí?', 'e ai?', 'e aee', 'e aeee', 'e aew', 'e aeww', 'e aewww', 'e ai beleza', 'e aí beleza', 'e ai beleza?', 'e aí beleza?', 'e ai blz', 'e aí blz', 'e ai blz?', 'e aí blz?', 'oi bot', 'olá bot', 'ola bot', 'oi squibot', 'olá squibot', 'ola squibot', 'squibot', 'squidev', 'squid', 'squid bot', 'squidbot', 'squid dev', 'squiddev', 'squid dev bot', 'squiddev bot', 'squiddevbot', 'squid devbot', 'squid bot dev', 'squid botdev', 'squidbot dev', 'squidbotdev'
    ];
    const textoNorm = texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const saudacoesNorm = saudacoes.map(s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase());
    const opcoesTitulosNorm = opcoesTitulos.map(s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase());
    if (opcoesTitulosNorm.includes(textoNorm) || saudacoesNorm.includes(textoNorm)) {
        await sendTypingAndReply(chat, msg, '🦑 Olá! Eu sou o Squibot, seu assistente virtual da Squidev! 😊\n\nSeja muito bem-vindo ao nosso atendimento. Como posso te ajudar hoje?');
        let menu = (config.opcoesMenu || []).map((o, i) => `${i + 1}️⃣ - ${o.titulo}`).join('\n');
        await sendTypingAndReply(chat, msg, '📋 *Confira as opções a seguir:*\n\n' + menu + '\n\nDigite o *nome* ou *número* da opção.');
        return;
    }

    // Opções do menu (por acionador ou número)
    let idx = -1;
    if (config.opcoesMenu) {
        // Normaliza texto e acionador para comparação robusta
        const textoNorm = texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
        idx = config.opcoesMenu.findIndex(o =>
            o.acionador &&
            String(o.acionador).normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase() === textoNorm
        );
        if (idx === -1 && !isNaN(texto) && Number(texto) > 0) {
            idx = Number(texto) - 1;
        }
    }
    if (config.opcoesMenu && idx >= 0 && config.opcoesMenu[idx]) {
        const opcao = config.opcoesMenu[idx];

        // Inicializa o histórico de respostas se não existir
        config.historicoRespostas = config.historicoRespostas || {};

        // 1. Delay
        if (opcao.delay && !isNaN(opcao.delay)) {
            await delay(Number(opcao.delay));
        }
        // 2. Mostrar digitando
        if (opcao.mostrarDigitando) {
            await chat.sendStateTyping();
            await delay(1200);
        }
        // 3. Mostrar gravando áudio
        if (opcao.mostrarGravandoAudio) {
            await chat.sendStateRecording();
            await delay(1200);
        }
        // 4. Envio conforme tipoResposta
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
                if (resposta.caminho.endsWith('.mp3') || resposta.caminho.endsWith('.webp')) {
                    // Envia texto antes de áudio ou sticker
                    if (resposta.legenda) {
                        await msg.reply(resposta.legenda);
                    }
                    await enviarMidia(msg, resposta.caminho, null);
                } else {
                    // Envia mídia com legenda para outros tipos
                    await enviarMidia(msg, resposta.caminho, resposta.legenda);
                }
            } else if (resposta.tipo === 'texto') {
                // Envia apenas texto
                await msg.reply(resposta);
            }
        }

        // Atualiza o histórico de respostas enviadas após o envio bem-sucedido
        config.historicoRespostas[msg.from] = opcao.resposta;
        salvarConfig(config);

        // 5. Enviar localização
        if (opcao.localizacao && opcao.localizacao.lat && opcao.localizacao.lng) {
            const loc = new Location(opcao.localizacao.lat, opcao.localizacao.lng, opcao.localizacao.descricao || 'Localização');
            await msg.reply(loc);
        }
        // 6. Enviar resposta de texto (se não for só mídia e não tiver sido enviado como legenda de mídia)
        if (opcao.resposta && !opcao.somenteMidia && !respostas.some(r => r.tipo === 'media' && r.legenda === opcao.resposta)) {
            await sendTypingAndReply(chat, msg, opcao.resposta);
        }
        // 7. Pausar/despausar bot
        if (opcao.statusBot === 'pausar') {
            config.botPausado = true;
            salvarConfig(config);
        } else if (opcao.statusBot === 'despausar') {
            config.botPausado = false;
            salvarConfig(config);
        }
        // 8. Tempo de pausa (pausa temporária para o usuário)
        if (opcao.tempoPausa && !isNaN(opcao.tempoPausa) && Number(opcao.tempoPausa) > 0) {
            config.pausaAutomatica = config.pausaAutomatica || {};
            config.pausaAutomatica[msg.from] = Date.now() + Number(opcao.tempoPausa) * 60 * 1000;
            salvarConfig(config);
        }
        return;
    }

    // Votação
    if (["s", "sim"].includes(texto)) {
        config.votos = config.votos || { Sim: 0, Não: 0 };
        config.votos.Sim++;
        salvarConfig(config);
        await sendTypingAndReply(chat, msg, '✅ Seu voto em *Sim* foi registrado! Obrigado pela confiança.');
        return;
    }
    if (["n", "não", "nao"].includes(texto)) {
        config.votos = config.votos || { Sim: 0, Não: 0 };
        config.votos.Não++;
        salvarConfig(config);
        await sendTypingAndReply(chat, msg, '✅ Seu voto em *Não* foi registrado! Se quiser compartilhar o motivo, estamos à disposição para ouvir.');
        return;
    }

    // PDF, áudio, gif, imagem
    if (texto === 'pdf' && config.pdf) {
        await enviarMidia(msg, config.pdf, '🛍️ Confira nosso catálogo de produtos e soluções digitais!');
        return;
    }
    if (texto === 'audio' && config.audio) {
        await enviarMidia(msg, config.audio, '🎵 Ouça a música tema da Squidev!');
        return;
    }
    if (texto === 'gif' && config.gif) {
        await enviarMidia(msg, config.gif, 'Confira nosso gif!');
        return;
    }
    if (texto === 'imagem' && config.imagem) {
        await enviarMidia(msg, config.imagem, 'Confira nossa imagem!');
        return;
    }

    // Default
    await sendTypingAndReply(chat, msg, config.mensagemDefault || '❓ Não consegui entender sua mensagem. Por favor, escolha uma das opções do menu abaixo ou envie sua dúvida para que possamos ajudar.');
});

// Envio de mensagens agendadas (fora do handler de mensagens)
setInterval(async () => {
    config = lerConfig();
    const agora = new Date();
    for (let m of config.mensagensAgendadas || []) {
        if (m.status !== 'enviada' && m.datahora && new Date(m.datahora) <= agora) {
            try {
                const destinatario = m.telefone.endsWith('@c.us') ? m.telefone : m.telefone + '@c.us';
                const respostas = montarRespostas(
                    m.tipoResposta,
                    m.mensagem,
                    m.imagem,
                    m.gif,
                    m.pdf,
                    m.audio,
                    m.sticker
                );
                for (const r of respostas) {
                    if (r.tipo === 'media') await enviarMidia({ from: destinatario, reply: () => { } }, r.caminho, r.legenda);
                    if (r.tipo === 'texto') await client.sendMessage(destinatario, r.texto);
                }
                m.status = 'enviada';
                config.logMensagens = config.logMensagens || [];
                config.logMensagens.push(`[${new Date().toLocaleString()}] [AGENDADA] ${m.nome} (${m.telefone}): ${m.mensagem}`);
                // Recorrência
                if (m.recorrencia && m.recorrencia !== 'unica') {
                    let novaData = new Date(m.datahora);
                    switch (m.recorrencia) {
                        case 'hora': novaData.setHours(novaData.getHours() + 1); break;
                        case 'diaria': novaData.setDate(novaData.getDate() + 1); break;
                        case 'semanal': novaData.setDate(novaData.getDate() + 7); break;
                        case 'mensal': novaData.setMonth(novaData.getMonth() + 1); break;
                    }
                    m.datahora = novaData.toISOString().slice(0, 16);
                    m.status = 'nao_enviada';
                }
            } catch (e) {
                config.logMensagens = config.logMensagens || [];
                config.logMensagens.push(`[${new Date().toLocaleString()}] [ERRO AGENDADA] ${m.nome} (${m.telefone}): ${e.message}`);
            }
        }
    }
    salvarConfig(config);
}, 60000); // Checa a cada minuto

app.post('/admin/reset-votos', express.urlencoded({ extended: true }), (req, res) => {
    votos.Sim = 0;
    votos.Não = 0;
    res.redirect('/admin');
});

client.initialize();

// Função para salvar arquivo de mídia ao adicionar opção de menu (corrigida)
function getFilePath(field, files, req) {
    if (files[field] && files[field][0]) {
        const ext = path.extname(files[field][0].originalname) || '';
        let filename = files[field][0].filename;
        let newPath = path.join('assets', filename + ext);
        let fullNewPath = path.join(__dirname, newPath);
        // Renomeia para garantir extensão correta
        if (fs.existsSync(fullNewPath)) fs.unlinkSync(fullNewPath);
        fs.renameSync(files[field][0].path, fullNewPath);
        return newPath.replace(/\\/g, '/');
    }
    return req.body[field] || '';
}
// Função para salvar arquivo de mídia ao editar opção de menu (corrigida)
function getFilePathEdit(field, oldValue, files, req) {
    if (files[field] && files[field][0]) {
        const ext = path.extname(files[field][0].originalname) || '';
        let filename = files[field][0].filename;
        let newPath = path.join('assets', filename + ext);
        let fullNewPath = path.join(__dirname, newPath);
        if (fs.existsSync(fullNewPath)) fs.unlinkSync(fullNewPath);
        fs.renameSync(files[field][0].path, fullNewPath);
        return newPath.replace(/\\/g, '/');
    }
    return req.body[field] || oldValue || '';
}

// Função utilitária para decidir ordem e tipo de envio
function montarRespostas(tipo, resposta, imagem, gif, pdf, audio, sticker) {
    const respostas = [];

    if (tipo === 'multipla') {
        // Cada item vira uma resposta separada
        if (resposta) respostas.push({ tipo: 'texto', conteudo: resposta });
        if (imagem) respostas.push({ tipo: 'media', caminho: imagem, legenda: resposta });
        if (gif) respostas.push({ tipo: 'media', caminho: gif, legenda: resposta });
        if (pdf) respostas.push({ tipo: 'media', caminho: pdf, legenda: resposta });
        if (audio) {
            if (resposta) respostas.push({ tipo: 'texto', conteudo: resposta }); // Texto antes do áudio
            respostas.push({ tipo: 'media', caminho: audio });
        }
        if (sticker) {
            if (resposta) respostas.push({ tipo: 'texto', conteudo: resposta }); // Texto antes do sticker
            respostas.push({ tipo: 'media', caminho: sticker });
        }
    } else {
        // Envio único com prioridade para mídia com legenda
        if (imagem || gif || pdf) {
            const caminho = imagem || gif || pdf;
            respostas.push({ tipo: 'media', caminho, legenda: resposta });
        } else if (audio || sticker) {
            if (resposta) respostas.push({ tipo: 'texto', conteudo: resposta }); // Texto antes de áudio ou sticker
            const caminho = audio || sticker;
            respostas.push({ tipo: 'media', caminho });
        } else if (resposta) {
            respostas.push({ tipo: 'texto', conteudo: resposta });
        }
    }

    return respostas;
}
