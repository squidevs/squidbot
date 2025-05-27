import { ref, watch } from 'vue';
import { RespostaChatBot } from '../types/RespostaChatBot';

// Estado global
const respostas = ref([]);
const configuracoesGlobais = ref({
  usarArquivoJSON: true,
  mensagensParaGrupos: false,
  usarLocalStorage: true
});

// Constantes para configuração
const STORAGE_KEY = 'chatbot_respostas';
const CONFIG_STORAGE_KEY = 'chatbot_config';
const UPLOAD_PATH = '/uploads';
const DATA_FILE_PATH = '/api/data.json';

// Funções auxiliares
async function getRespostasFromStorage() {
  let dadosRespostas = [];
  
  // Tentar carregar do localStorage se habilitado
  if (configuracoesGlobais.value.usarLocalStorage) {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try {
        dadosRespostas = JSON.parse(localData);
      } catch (e) {
        console.error('Erro ao carregar do localStorage:', e);
      }
    }
  }

  // Tentar carregar do arquivo se habilitado
  if (configuracoesGlobais.value.usarArquivoJSON) {
    try {
      const response = await fetch(DATA_FILE_PATH);
      const data = await response.json();
      return data.opcoesMenu.map(r => new RespostaChatBot(r));
    } catch (error) {
      console.error('Erro ao ler arquivo data.json:', error);
      return [];
    }
  } else {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data).map(r => new RespostaChatBot(r));
  }
}

async function saveRespostasToStorage(respostasParaSalvar) {
  // Salvar no localStorage se habilitado
  if (configuracoesGlobais.value.usarLocalStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(respostasParaSalvar));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }

  // Salvar no arquivo se habilitado
  if (configuracoesGlobais.value.usarArquivoJSON) {
    try {
      const response = await fetch('/api/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opcoesMenu: respostasParaSalvar })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar dados no servidor');
      }
    } catch (error) {
      console.error('Erro ao salvar no arquivo data.json:', error);
    }
  }
  
  // Sempre salva no localStorage como backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(respostas));
}

// Funções de configuração
export function lerConfiguracoes() {
  const configSalva = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (configSalva) {
    try {
      const config = JSON.parse(configSalva);
      configuracoesGlobais.value = { ...configuracoesGlobais.value, ...config };
    } catch (e) {
      console.error('Erro ao ler configurações:', e);
    }
  }
  return configuracoesGlobais.value;
}

export function atualizarConfiguracoes(novasConfiguracoes) {
  configuracoesGlobais.value = { ...configuracoesGlobais.value, ...novasConfiguracoes };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configuracoesGlobais.value));
}

// Observar mudanças nas configurações
watch(configuracoesGlobais, async (novoValor) => {
  // Recarregar respostas quando mudar o modo de armazenamento
  await carregarRespostas();
}, { deep: true });

// Função para carregar configurações iniciais
function carregarConfiguracoes() {
  const configSalva = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (configSalva) {
    configuracoesGlobais.value = JSON.parse(configSalva);
  }
}

// Funções auxiliares
function validarArquivo(file) {
  const maxSize = 16 * 1024 * 1024; // 16MB
  if (file.size > maxSize) {
    throw new Error(`O arquivo ${file.name} é muito grande. Tamanho máximo: 16MB`);
  }
}

// Função para processar upload de arquivo
async function processarArquivo(file, tipo) {
  try {
    validarArquivo(file);
    const filename = `${Date.now()}_${file.name}`;
    const path = `${UPLOAD_PATH}/${tipo}/${filename}`;
    
    // Aqui você pode implementar o upload real do arquivo
    // Por exemplo, usando uma API ou serviço de armazenamento

    return {
      nome: filename,
      caminho: path,
      tipo: file.type,
      tamanho: file.size
    };
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    throw error;
  }
}

async function excluirArquivo(path) {
  try {
    // Aqui você pode implementar a exclusão real do arquivo
    // Por exemplo, usando uma API ou serviço de armazenamento
    console.log('Arquivo excluído:', path);
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    throw error;
  }
}

// Inicializar o estado com os dados do localStorage
respostas.value = await getRespostasFromStorage();

// Observar mudanças e salvar automaticamente
watch(respostas, async (novoValor) => {
  await saveRespostasToStorage(novoValor);
}, { deep: true });

// CRUD de respostas
export async function criarResposta(dados) {
  try {
    const novaResposta = new RespostaChatBot({
      ...dados,
      id: Date.now()
    });
    
    respostas.value.push(novaResposta);
    await saveRespostasToStorage(respostas.value);
    return novaResposta;
  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    throw error;
  }
}

export function listarRespostas() {
  try {
    return respostas.value;
  } catch (error) {
    console.error('Erro ao listar respostas:', error);
    throw error;
  }
}

export async function atualizarResposta(dados) {
  try {
    const index = respostas.value.findIndex(r => r.id === dados.id);
    
    if (index === -1) {
      throw new Error('Resposta não encontrada');
    }

    const respostaAtualizada = new RespostaChatBot(dados);
    respostas.value[index] = respostaAtualizada;
    return respostaAtualizada;
  } catch (error) {
    console.error('Erro ao atualizar resposta:', error);
    throw error;
  }
}

export async function excluirResposta(id) {
  try {
    const resposta = respostas.value.find(r => r.id === id);
    
    if (!resposta) {
      throw new Error('Resposta não encontrada');
    }

    // Remove arquivos associados
    if (resposta.arquivoImagem) await excluirArquivo(resposta.arquivoImagem);
    if (resposta.arquivoGif) await excluirArquivo(resposta.arquivoGif);
    if (resposta.arquivoPdf) await excluirArquivo(resposta.arquivoPdf);
    if (resposta.arquivoAudio) await excluirArquivo(resposta.arquivoAudio);
    if (resposta.arquivoSticker) await excluirArquivo(resposta.arquivoSticker);

    respostas.value = respostas.value.filter(r => r.id !== id);
  } catch (error) {
    console.error('Erro ao excluir resposta:', error);
    throw error;
  }
}

// Função para obter URL de preview
export function obterUrlPreview(path) {
  // Em um ambiente real, retornaria a URL completa do arquivo
  // Por enquanto, retorna apenas o caminho
  return path;
}

// Inicialização
carregarConfiguracoes();
respostas.value = await getRespostasFromStorage();
