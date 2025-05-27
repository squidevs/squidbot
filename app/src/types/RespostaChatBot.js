// Estrutura de uma resposta do chatbot
export class RespostaChatBot {
    constructor({
        acionador = '',
        resposta = '',
        pausarBot = false,
        mostraDigitando = false,
        mostraGravando = false,
        arquivoAudio = '',
        arquivoPdf = '',
        arquivoImagem = '',
        arquivoSticker = '',
        temBotoes = false,
        opcoesBotoes = [],
        tempoDelay = 0,
        link = '',
        ativo = true,
        id = Date.now().toString()
    }) {
        this.id = id;
        this.acionador = acionador;
        this.resposta = resposta;
        this.pausarBot = pausarBot;
        this.mostraDigitando = mostraDigitando;
        this.mostraGravando = mostraGravando;
        this.arquivoAudio = arquivoAudio;
        this.arquivoPdf = arquivoPdf;
        this.arquivoImagem = arquivoImagem;
        this.arquivoSticker = arquivoSticker;
        this.temBotoes = temBotoes;
        this.opcoesBotoes = opcoesBotoes;
        this.tempoDelay = tempoDelay;
        this.link = link;
        this.ativo = ativo;
    }
}
