import wppconnect from '@wppconnect-team/wppconnect';

wppconnect.create().then((client) => {
  client.onMessage((message) => {
    console.log('Mensagem recebida:', message); // Log detalhado da mensagem recebida

    if (message.body.toLowerCase() === 'oi') { // Garantir que a comparação seja case-insensitive
      client.sendText(message.from, 'Olá! Como posso ajudar você?')
        .then(() => console.log('Mensagem enviada com sucesso!'))
        .catch((error) => console.error('Erro ao enviar mensagem:', error));
    }
  });
}).catch((error) => {
  console.error('Erro ao iniciar o WPPConnect:', error);
});
