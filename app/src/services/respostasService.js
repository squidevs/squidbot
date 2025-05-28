import { ref, watch } from 'vue';
import { RespostaChatBot } from '../types/RespostaChatBot';

// Estado global
const respostas = ref([]);
const configuracoesGlobais = ref({
    usarArquivoJSON: true,
    mensagensParaGrupos: false,
    usarLocalStorage: true
});

// Constantes
const STORAGE_KEY = 'chatbot_respostas';
const CONFIG_STORAGE_KEY = 'chatbot_config';
const UPLOAD_PATH = '/uploads';
const DATA_FILE_PATH = '/api/data.json';

// Funções auxiliares
async function getRespostasFromStorage() {
    let dadosRespostas = [];
    
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

    if (configuracoesGlobais.value.usarArquivoJSON) {
        try {
            const response = await fetch(DATA_FILE_PATH);
            const data = await response.json();
            return data.opcoesMenu.map(r => new RespostaChatBot(r));
        } catch (error) {
            console.error('Erro ao ler arquivo data.json:', error);
            return dadosRespostas.map(r => new RespostaChatBot(r));
        }
    }
    
    return dadosRespostas.map(r => new RespostaChatBot(r));
}

async function saveRespostasToStorage(respostasParaSalvar) {
    if (configuracoesGlobais.value.usarLocalStorage) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(respostasParaSalvar));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
    }

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

// Observar mudanças
watch(configuracoesGlobais, async () => {
    await carregarRespostas();
}, { deep: true });

// Função para carregar configurações iniciais
function carregarConfiguracoes() {
    const configSalva = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (configSalva) {
        configuracoesGlobais.value = JSON.parse(configSalva);
    }
}

// Upload de arquivos
function validarArquivo(file) {
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
        throw new Error(`O arquivo ${file.name} é muito grande. Tamanho máximo: 16MB`);
    }
}

async function processarArquivo(file, tipo) {
    try {
        validarArquivo(file);
        const filename = `${Date.now()}_${file.name}`;
        const path = `${UPLOAD_PATH}/${tipo}/${filename}`;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', tipo);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Erro ao fazer upload do arquivo');
        }
        
        const result = await response.json();
        return result.path;
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        throw error;
    }
}

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
    return respostas.value;
}

export async function atualizarResposta(dados) {
    try {
        const index = respostas.value.findIndex(r => r.id === dados.id);
        if (index === -1) throw new Error('Resposta não encontrada');
        
        const respostaAtualizada = new RespostaChatBot(dados);
        respostas.value[index] = respostaAtualizada;
        await saveRespostasToStorage(respostas.value);
        return respostaAtualizada;
    } catch (error) {
        console.error('Erro ao atualizar resposta:', error);
        throw error;
    }
}

export async function excluirResposta(id) {
    try {
        const index = respostas.value.findIndex(r => r.id === id);
        if (index === -1) throw new Error('Resposta não encontrada');
        
        respostas.value.splice(index, 1);
        await saveRespostasToStorage(respostas.value);
    } catch (error) {
        console.error('Erro ao excluir resposta:', error);
        throw error;
    }
}

// Inicialização
respostas.value = await getRespostasFromStorage();
