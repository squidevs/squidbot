// Estrutura de uma resposta do chatbot
export class RespostaChatBot {
    constructor({
        acionador = '',
        tipoMensagem = 'texto',
        resposta = '',
        pausarBot = false,
        mostraDigitando = false,
        mostraGravando = false,
        tempoDelay = 1000,
        
        // Arquivos de mídia
        arquivoAudio = '',
        arquivoPdf = '',
        arquivoImagem = '',
        arquivoSticker = '',
        arquivoVideo = '',
        
        // Localização
        localizacao = {
            latitude: '',
            longitude: '',
            descricao: ''
        },
        
        // Botões
        temBotoes = false,
        opcoesBotoes = [],
        
        // Lista
        temLista = false,
        opcoesLista = [],
        
        // Outros recursos
        reacao = '',
        mencao = false,
        link = '',
        ativo = true,
        id = Date.now().toString()
    }) {
        this.id = id;
        this.acionador = acionador;
        this.tipoMensagem = tipoMensagem;
        this.resposta = resposta;
        this.pausarBot = pausarBot;
        this.mostraDigitando = mostraDigitando;
        this.mostraGravando = mostraGravando;
        this.tempoDelay = tempoDelay;
        
        // Arquivos de mídia
        this.arquivoAudio = arquivoAudio;
        this.arquivoPdf = arquivoPdf;
        this.arquivoImagem = arquivoImagem;
        this.arquivoSticker = arquivoSticker;
        this.arquivoVideo = arquivoVideo;
        
        // Localização
        this.localizacao = {
            latitude: localizacao.latitude,
            longitude: localizacao.longitude,
            descricao: localizacao.descricao
        };
        
        // Botões
        this.temBotoes = temBotoes;
        this.opcoesBotoes = opcoesBotoes;
        
        // Lista
        this.temLista = temLista;
        this.opcoesLista = opcoesLista;
        
        // Outros recursos
        this.reacao = reacao;
        this.mencao = mencao;
        this.link = link;
        this.ativo = ativo;
    }

    toJSON() {
        return {
            id: this.id,
            acionador: this.acionador,
            tipoMensagem: this.tipoMensagem,
            resposta: this.resposta,
            pausarBot: this.pausarBot,
            mostraDigitando: this.mostraDigitando,
            mostraGravando: this.mostraGravando,
            arquivoAudio: this.arquivoAudio,
            arquivoPdf: this.arquivoPdf,
            arquivoImagem: this.arquivoImagem,
            arquivoSticker: this.arquivoSticker,
            arquivoVideo: this.arquivoVideo,
            localizacao: this.localizacao,
            temBotoes: this.temBotoes,
            opcoesBotoes: this.opcoesBotoes,
            temLista: this.temLista,
            opcoesLista: this.opcoesLista,
            reacao: this.reacao,
            mencao: this.mencao,
            tempoDelay: this.tempoDelay,
            link: this.link,
            ativo: this.ativo
        };
    }
}
