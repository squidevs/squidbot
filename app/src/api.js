import express from "express";
import cors from "cors";
import wppconnect from "@wppconnect-team/wppconnect";
import path from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import fs from "fs";
import http from "http";
import fetch from "node-fetch";

// Configuração de caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para resolver caminhos de arquivos
function resolveAssetPath(relativePath) {
  if (!relativePath) return null;

  // Remove ./ do início do caminho se existir
  const cleanPath = relativePath.replace(/^\.\//, "");

  // Se o caminho já for absoluto, retorna ele mesmo
  if (path.isAbsolute(cleanPath)) {
    return cleanPath;
  }

  // Tenta resolver primeiro na pasta assets
  const assetPath = path.resolve(__dirname, "assets", cleanPath);
  if (fs.existsSync(assetPath)) {
    return assetPath;
  }

  // Se não encontrar na pasta assets, tenta resolver no caminho relativo
  return path.resolve(__dirname, cleanPath);
}

// Funções utilitárias
async function isUrl(str) {
  try {
    return str.startsWith("http://") || str.startsWith("https://");
  } catch (error) {
    return false;
  }
}

async function downloadFileFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha ao baixar arquivo");
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch (error) {
    console.error("Erro ao baixar arquivo:", error);
    throw error;
  }
}

function readLocalFile(filepath) {
  try {
    const absolutePath = resolveAssetPath(filepath);
    console.log("Caminho absoluto do arquivo:", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      console.error("Arquivo não encontrado:", absolutePath);
      throw new Error(`Arquivo não encontrado: ${absolutePath}`);
    }

    const buffer = fs.readFileSync(absolutePath);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Erro ao ler arquivo local:", error);
    throw error;
  }
}

async function getFileContent(filePathOrUrl) {
  try {
    if (!filePathOrUrl) {
      throw new Error("Caminho do arquivo não fornecido");
    }

    let buffer;
    if (await isUrl(filePathOrUrl)) {
      const response = await fetch(filePathOrUrl);
      if (!response.ok)
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      buffer = await response.arrayBuffer();
    } else {
      const filePath = resolveAssetPath(filePathOrUrl);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      buffer = await fs.promises.readFile(filePath);
    }

    // Converte para base64 e remove o prefixo "data:..."
    const base64 = Buffer.from(buffer).toString("base64");
    return base64;
  } catch (error) {
    console.error("Erro ao obter conteúdo do arquivo:", error);
    throw error;
  }
}

function lerConfig() {
  const configPath = path.resolve(__dirname, "assets/data.json");
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    console.error("Erro ao ler o arquivo de configuração:", error);
    return {
      mensagensParaGrupos: false,
      mostrarDigitando: false,
      mostrarGravandoAudio: false,
      mensagemDefault: "❓ Não entendi sua mensagem. Como posso ajudar?",
      opcoesMenu: [],
      logMensagens: [],
    };
  }
}

function salvarConfig(config) {
  const configPath = path.resolve(__dirname, "assets/data.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Configuração do Servidor
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

// Estado global
let client = null;
let qrCode = null;
let connectionStatus = "disconnected";
let currentConfig = lerConfig();
let retryCount = 0;
const MAX_RETRIES = 3;

// Middleware
app.use(express.json());
app.use(cors());

// WebSocket broadcast
function broadcastUpdate(type, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type, data }));
    }
  });
}

// Inicialização do Cliente WhatsApp
async function initWhatsApp() {
  try {
    console.log("Iniciando WhatsApp...");
    connectionStatus = "connecting";
    qrCode = null;
    broadcastUpdate("status", "connecting");

    client = await wppconnect.create({
      session: "mySession-backend",
      catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
        console.log("QR Code recebido, escaneie por favor.");
        qrCode = base64Qrimg;
        connectionStatus = "qrCode";
        broadcastUpdate("qr", base64Qrimg);
      },
      statusFind: (statusSession, session) => {
        console.log("Status da Sessão:", statusSession);
        console.log("Nome da Sessão:", session);
        connectionStatus = statusSession;

        if (
          statusSession === "isLogged" ||
          statusSession === "inChat" ||
          statusSession === "isConnected"
        ) {
          qrCode = null;
          broadcastUpdate("status", "connected");
        }

        if (
          statusSession === "notLogged" ||
          statusSession === "qrReadFail" ||
          statusSession === "browserClose"
        ) {
          qrCode = null;
          broadcastUpdate("status", "disconnected");

          // Tentar reconectar se necessário
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(
              `Tentando reconectar (tentativa ${retryCount} de ${MAX_RETRIES})...`
            );
            setTimeout(() => {
              initWhatsApp();
            }, 5000);
          }
        }
      },
      headless: true,
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: true,
      browserArgs: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--disable-notifications",
      ],
      puppeteerOptions: {
        userDataDir: "./tokens-backend/mySession-backend",
      },
      autoClose: 90000,
      createPathFileToken: true,
      waitForLogin: true,
    });

    console.log("Cliente WhatsApp conectado!");
    retryCount = 0; // Resetar contador de tentativas após sucesso

    // Handler de mensagens
    client.onMessage(async (message) => {
      try {
        currentConfig = lerConfig();
        const texto = message.body.toLowerCase().trim();
        const nome =
          message.sender?.pushname ||
          message.sender?.notifyName ||
          message.from;
        const telefone = message.from.replace("@c.us", "");

        console.log(`[MSG RECEBIDA] ${nome} (${telefone}): ${texto}`);

        // Registrar no log
        currentConfig.logMensagens = currentConfig.logMensagens || [];
        currentConfig.logMensagens.push(
          `[${new Date().toLocaleString()}] ${nome} (${telefone}): ${texto}`
        );
        if (currentConfig.logMensagens.length > 200) {
          currentConfig.logMensagens = currentConfig.logMensagens.slice(-200);
        }        salvarConfig(currentConfig);

        // Procurar resposta configurada
        const opcao = currentConfig.opcoesMenu.find(
          (o) => o.acionador && o.acionador.toLowerCase() === texto && o.ativo
        );

        if (opcao) {
          if (opcao.mostraDigitando) {
            await client.startTyping(message.from);
          }

          if (opcao.mostraGravando) {
            await client.startRecording(message.from);
          }

          if (opcao.tempoDelay > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, opcao.tempoDelay)
            );
          }

          // Processamento baseado no tipo de mensagem
          switch (opcao.tipoMensagem) {
            case "texto":
              let resposta = opcao.resposta
                .replace("{nome}", nome)
                .replace("{telefone}", telefone);
              await client.sendText(message.from, resposta);
              break;            case "lista":
              try {
                // Esta seção só cuida da exibição inicial da lista
                // As respostas serão tratadas em outro lugar
                if (opcao.temLista && opcao.opcoesLista?.length > 0) {
                  console.log("Enviando lista para:", message.from);
                  console.log("Opções da lista:", opcao.opcoesLista);
                  
                  // Melhor estrutura para enviar a lista
                  await client.sendListMessage(message.from, {
                    buttonText: "Escolha uma opção",
                    description: opcao.resposta,
                    sections: opcao.opcoesLista
                  });
                } else {
                  console.error("Configuração de lista inválida:", opcao);
                  await client.sendText(
                    message.from,
                    "❌ Erro na configuração da lista. Por favor, contate o administrador."
                  );
                }
              } catch (error) {
                console.error("Erro ao enviar lista:", error);
                await client.sendText(
                  message.from,
                  "❌ Erro ao enviar a lista de opções. Por favor, tente novamente."
                );
              }
              break;

            case "localizacao":
              if (opcao.localizacao?.latitude && opcao.localizacao?.longitude) {
                await client.sendLocation(
                  message.from,
                  opcao.localizacao.latitude,
                  opcao.localizacao.longitude,
                  opcao.localizacao.descricao
                );
              }
              break;

            case "imagem":
              if (opcao.arquivoImagem) {
                try {
                  const imagePath = resolveAssetPath(opcao.arquivoImagem);
                  if (!imagePath) {
                    throw new Error("Caminho da imagem inválido");
                  }

                  await client.sendImage(
                    message.from,
                    imagePath,
                    path.basename(opcao.arquivoImagem),
                    opcao.resposta || ""
                  );
                } catch (error) {
                  console.error("Erro ao enviar imagem:", error);
                  await client.sendText(
                    message.from,
                    "❌ Erro ao enviar imagem. Por favor, tente novamente."
                  );
                }
              }
              break;

            case "pdf":
              if (opcao.arquivoPdf) {
                try {
                  const pdfPath = resolveAssetPath(opcao.arquivoPdf);
                  if (!pdfPath) {
                    throw new Error("Caminho do PDF inválido");
                  }

                  await client.sendFile(
                    message.from,
                    pdfPath,
                    path.basename(opcao.arquivoPdf),
                    opcao.resposta || ""
                  );
                } catch (error) {
                  console.error("Erro ao enviar PDF:", error);
                  await client.sendText(
                    message.from,
                    "❌ Erro ao enviar PDF. Por favor, tente novamente."
                  );
                }
              }
              break;

            case "audio":
              if (opcao.arquivoAudio) {
                try {
                  const audioPath = resolveAssetPath(opcao.arquivoAudio);
                  if (!audioPath) {
                    throw new Error("Caminho do áudio inválido");
                  }

                  // Tenta primeiro como PTT (áudio de voz)
                  try {
                    await client.sendPtt(message.from, audioPath);
                  } catch (pttError) {
                    console.log(
                      "Erro ao enviar como PTT, tentando como áudio normal:",
                      pttError
                    );
                    // Se falhar como PTT, envia como áudio normal
                    await client.sendFile(
                      message.from,
                      audioPath,
                      path.basename(opcao.arquivoAudio),
                      opcao.resposta || ""
                    );
                  }
                } catch (error) {
                  console.error("Erro ao enviar áudio:", error);
                  await client.sendText(
                    message.from,
                    "❌ Erro ao enviar áudio. Por favor, tente novamente."
                  );
                }
              }
              break;

            case "sticker":
              if (opcao.arquivoSticker) {
                try {
                  const stickerPath = resolveAssetPath(opcao.arquivoSticker);
                  if (!stickerPath) {
                    throw new Error("Caminho do sticker inválido");
                  }

                  // Configura as opções do sticker
                  const stickerOptions = {
                    pack: opcao.stickerConfig?.pack || "MyStickers",
                    author: opcao.stickerConfig?.author || "Bot",
                  };

                  // Tenta enviar como sticker
                  try {
                    await client.sendImageAsSticker(
                      message.from,
                      stickerPath,
                      stickerOptions
                    );
                  } catch (stickerError) {
                    console.log(
                      "Erro ao enviar como sticker, tentando converter imagem:",
                      stickerError
                    );
                    // Se falhar, tenta enviar como imagem e converter para sticker
                    await client.sendFile(
                      message.from,
                      stickerPath,
                      "sticker.webp",
                      "",
                      null,
                      true // Força envio como sticker
                    );
                  }
                } catch (error) {
                  console.error("Erro ao enviar sticker:", error);
                  await client.sendText(
                    message.from,
                    "❌ Erro ao enviar sticker. Por favor, tente novamente."
                  );
                }
              }
              break;
            case "link_preview":
              try {
                if (opcao.mostraDigitando) {
                  await client.startTyping(message.from);
                }

                await new Promise((resolve) =>
                  setTimeout(resolve, opcao.tempoDelay || 1000)
                );

                // Enviar o link
                await client.sendText(
                  message.from,
                  `${opcao.resposta}\n${opcao.link}`
                );

                if (opcao.mostraDigitando) {
                  await client.stopTyping(message.from);
                }
              } catch (error) {
                console.error("Erro ao enviar link:", error);
                await client.sendText(
                  message.from,
                  "❌ Erro ao enviar link. Por favor, tente novamente."
                );
              }
              break;
          }          // Parar estados
          if (opcao.mostraDigitando) {
            await client.stopTyping(message.from);
          }
          if (opcao.mostraGravando) {
            await client.stopRecording(message.from);
          }        } else {          // Verificar se é uma resposta de lista de algum menu (há várias possibilidades)
          if (message.listResponse || message.list || message.selectedDisplayText || message.selectedId || texto.startsWith('option_') || texto === 'sim' || texto === 'nao' || texto === 'talvez') {
            console.log("▶️ Analisando possível resposta de lista");
            console.log("▶️ Mensagem completa:", JSON.stringify(message));
            console.log("▶️ listResponse:", message.listResponse);
            console.log("▶️ list:", message.list);
            console.log("▶️ selectedDisplayText:", message.selectedDisplayText);
            console.log("▶️ selectedId:", message.selectedId);
            console.log("▶️ Body:", message.body);// O rowId pode vir em diferentes formatos dependendo da versão do WhatsApp
            let rowId = null;
            
            // Tentativa 1: Propriedade listResponse.singleSelectReply.selectedRowId (formato comum WPPConnect)
            if (message.listResponse && message.listResponse.singleSelectReply && message.listResponse.singleSelectReply.selectedRowId) {
              rowId = message.listResponse.singleSelectReply.selectedRowId.toLowerCase();
              console.log(`▶️ RowID encontrado em listResponse.singleSelectReply.selectedRowId: "${rowId}"`);
            }
            // Tentativa 2: Propriedade listResponse.rowId (formato alternativo)
            else if (message.listResponse && message.listResponse.rowId) {
              rowId = message.listResponse.rowId.toLowerCase();
              console.log(`▶️ RowID encontrado em listResponse.rowId: "${rowId}"`);
            }
            // Tentativa 3: Propriedades selectedDisplayText ou selectedId (outro formato possível)
            else if (message.selectedDisplayText || message.selectedId) {
              rowId = (message.selectedId || message.selectedDisplayText || '').toLowerCase();
              console.log(`▶️ RowID encontrado em selectedId/selectedDisplayText: "${rowId}"`);
            }
            // Tentativa 4: Propriedade list (formato WPPConnect alternativo)
            else if (message.list && message.list.listResponse) {
              rowId = message.list.listResponse.singleSelectReply.selectedRowId.toLowerCase();
              console.log(`▶️ RowID encontrado em list.listResponse: "${rowId}"`);
            }
            // Tentativa 5: Objetos no corpo da mensagem (formato whatsapp-web.js)
            else if (message.body && typeof message.body === 'object' && message.body.listResponse) {
              rowId = message.body.listResponse.toLowerCase();
              console.log(`▶️ RowID encontrado em body.listResponse: "${rowId}"`);
            }            // Tentativa 6: Campo de seleção na própria mensagem (texto direto)
            else if (texto.startsWith('option_') || texto === 'sim' || texto === 'nao' || texto === 'não' || texto === 'talvez') {
              // Normaliza "não" para "nao" para garantir consistência
              rowId = texto === 'não' ? 'nao' : texto.toLowerCase();
              console.log(`▶️ RowID encontrado no texto da mensagem: "${rowId}"`);
            }
            // Tentativa 7: Verificar se o texto da mensagem contém o título ou descrição de alguma opção
            else if (message.body) {
              const bodyText = message.body.toLowerCase();
              console.log(`▶️ Verificando se o corpo da mensagem "${bodyText}" contém alguma opção conhecida`);
              
              // Procurar palavras-chave comuns em respostas de lista
              if (bodyText.includes('sim') || bodyText.includes('confirmar')) {
                rowId = 'sim';
                console.log(`▶️ Palavra-chave 'sim' encontrada no texto da mensagem`);
              } else if (bodyText.includes('não') || bodyText.includes('nao') || bodyText.includes('cancelar')) {
                rowId = 'nao';
                console.log(`▶️ Palavra-chave 'não/cancelar' encontrada no texto da mensagem`);
              } else if (bodyText.includes('talvez') || bodyText.includes('depois')) {
                rowId = 'talvez';
                console.log(`▶️ Palavra-chave 'talvez' encontrada no texto da mensagem`);
              }
            }
              if (!rowId) {
              console.log("❌ Não foi possível extrair rowId da resposta de lista");
              
              // Em vez de enviar uma mensagem de erro, vamos oferecer ao usuário uma nova tentativa
              // com instruções claras
              await client.sendText(message.from, `Não consegui identificar sua escolha. Por favor, responda apenas com uma das opções: "sim", "não" ou "talvez".`);
              
              // Re-enviar a lista para facilitar a escolha
              for (const menuOption of currentConfig.opcoesMenu) {
                if (menuOption.tipoMensagem === "lista" && menuOption.acionador === "1") {
                  if (menuOption.temLista && menuOption.opcoesLista?.length > 0) {
                    console.log("Re-enviando lista de opções para:", message.from);
                    await client.sendListMessage(message.from, {
                      buttonText: "Escolha uma opção",
                      description: menuOption.resposta,
                      sections: menuOption.opcoesLista
                    });
                  }
                  break;
                }
              }
              
              return;
            }
            
            // Extrair o ID base para correspondência (remover prefixos como "option_" se houver)
            const baseId = rowId.replace('option_', '');
            console.log(`▶️ ID base para correspondência: "${baseId}"`);
            
            // Procurar em todas as opções de menu qual tem a resposta apropriada
            for (const menuOption of currentConfig.opcoesMenu) {
              if (menuOption.tipoMensagem === "lista" && 
                  menuOption.respostasLista && 
                  menuOption.opcoesLista?.length > 0) {
                
                console.log("▶️ Verificando menu:", menuOption.id, menuOption.acionador);
                console.log("▶️ Respostas disponíveis:", JSON.stringify(menuOption.respostasLista));
                
                // 1. Correspondência direta com rowId
                if (menuOption.respostasLista[rowId]) {
                  console.log(`▶️ Resposta encontrada para "${rowId}":`, menuOption.respostasLista[rowId]);
                  await client.sendText(message.from, menuOption.respostasLista[rowId]);
                  return;
                }
                
                // 2. Correspondência com o ID base (sem prefixos)
                if (baseId !== rowId && menuOption.respostasLista[baseId]) {
                  console.log(`▶️ Resposta encontrada para ID base "${baseId}":`, menuOption.respostasLista[baseId]);
                  await client.sendText(message.from, menuOption.respostasLista[baseId]);
                  return;
                }
                
                // 3. Verificar nas opções da lista
                let found = false;
                for (const section of menuOption.opcoesLista) {
                  for (const row of section.rows) {
                    if (row.rowId.toLowerCase() === rowId || row.rowId.toLowerCase() === baseId) {
                      console.log(`▶️ Encontrou correspondência nas linhas da lista: ${row.rowId}`);
                      
                      // Usa a resposta associada a este rowId 
                      if (menuOption.respostasLista[row.rowId.toLowerCase()]) {
                        await client.sendText(message.from, menuOption.respostasLista[row.rowId.toLowerCase()]);
                        found = true;
                        break;
                      } else {
                        // Fallback - usar o título da opção
                        await client.sendText(message.from, `Você selecionou: ${row.title}`);
                        found = true;
                        break;
                      }
                    }
                  }
                  if (found) break;
                }
                if (found) return;
                
                // 4. Verificar sem acentos
                const normalizedRowId = rowId.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                const normalizedBaseId = baseId.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                
                console.log(`▶️ Tentando sem acentos: "${normalizedRowId}", "${normalizedBaseId}"`);
                
                for (const key in menuOption.respostasLista) {
                  const normalizedKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                  
                  if (normalizedKey === normalizedRowId || normalizedKey === normalizedBaseId) {
                    console.log(`▶️ Correspondência sem acentos encontrada com "${key}"`);
                    await client.sendText(message.from, menuOption.respostasLista[key]);
                    return;
                  }
                }
              }
            }
              // Se chegou até aqui, não encontrou resposta específica, mas sabemos que é uma resposta de lista
            console.log(`▶️ Não encontrou resposta configurada para "${rowId}", tentando fallback...`);
            
            // Verificar respostas padrão para sim/não/talvez
            if (rowId === 'sim' || rowId === 'yes' || rowId === 'option_yes') {
              await client.sendText(message.from, 'Você confirmou a ação! ✅');
              return;
            } else if (rowId === 'nao' || rowId === 'não' || rowId === 'no' || rowId === 'option_no') {
              await client.sendText(message.from, 'Ação cancelada! ❌');
              return;
            } else if (rowId === 'talvez' || rowId === 'maybe' || rowId === 'option_maybe') {
              await client.sendText(message.from, 'Ok, você pode decidir depois! ⏳');
              return;
            }
            
            // Se ainda não encontrou uma resposta, envia mensagem genérica
            await client.sendText(message.from, `Seleção recebida: ${rowId}`);
            return;
          }
          
          // Se não é resposta de lista, envia mensagem padrão
          await client.sendText(message.from, currentConfig.mensagemDefault);
        }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
        try {
          await client.sendText(
            message.from,
            "❌ Ocorreu um erro ao processar sua mensagem."
          );
        } catch (sendError) {
          console.error("Erro ao enviar mensagem de erro:", sendError);
        }
      }
    });

    return true;
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    connectionStatus = "error";
    broadcastUpdate("status", "error");
    return false;
  }
}

// Rotas da API
app.get("/status", (req, res) => {
  res.json({
    status: connectionStatus,
    qrCode: qrCode,
  });
});

app.post("/connect", async (req, res) => {
  try {
    if (connectionStatus === "connected") {
      return res.json({ status: "already_connected" });
    }

    if (connectionStatus === "connecting") {
      return res.json({
        status: "connecting",
        qrCode: qrCode,
      });
    }

    const success = await initWhatsApp();
    res.json({
      success,
      status: connectionStatus,
      qrCode: qrCode,
    });
  } catch (error) {
    console.error("Erro ao conectar:", error);
    res.status(500).json({ error: error.message });
  }
});

// Rotas para envio de mensagens
app.post("/send-text", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!client) {
      return res.status(400).json({ error: "Cliente não conectado." });
    }
    if (!to || !message) {
      return res
        .status(400)
        .json({ error: "Número de destino e mensagem são obrigatórios." });
    }

    const result = await client.sendText(to, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/save-data", async (req, res) => {
  try {
    const newConfig = { ...lerConfig(), ...req.body };
    salvarConfig(newConfig);
    currentConfig = newConfig;
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/data.json", (req, res) => {
  try {
    const config = lerConfig();
    res.json(config);
  } catch (error) {
    console.error("Erro ao ler dados:", error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket Connections
wss.on("connection", (ws) => {
  console.log("Nova conexão WebSocket");
  ws.send(
    JSON.stringify({
      type: "status",
      data: connectionStatus,
    })
  );

  if (qrCode) {
    ws.send(
      JSON.stringify({
        type: "qr",
        data: qrCode,
      })
    );
  }
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
