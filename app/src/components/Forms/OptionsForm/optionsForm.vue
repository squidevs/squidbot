<template>
  <div class="container py-4">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary spinner" role="status">
        <span class="visually-hidden">Carregando...</span>
      </div>
    </div>

    <!-- Existing header div -->
    <div class="d-flex align-items-center mb-4">
      <div class="me-3">
        <button class="btn btn-sm btn-primary rounded-pill" @click="voltarParaLista">
          <i class="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
      <div>
        <h1 class="h4 mb-0">{{ formData.id ? 'Editar' : 'Criar nova' }} resposta</h1>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="needs-validation" novalidate>
      <!-- Seção de Configurações Básicas -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">Configurações Básicas</h5>
        </div>
        <div class="card-body">
          <!-- Acionador e Status -->
          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <label class="form-label">Acionador <span class="text-danger">*</span></label>
              <div class="input-group has-validation">
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.acionador"
                  :class="{ 'is-invalid': !formData.acionador && validated }"
                  placeholder="Palavra ou frase que ativa a resposta"
                  required
                />
                <div class="invalid-feedback">
                  Por favor, insira um acionador.
                </div>
              </div>
            </div>
            <div class="col-md-6">              <label class="form-label">Status de Ação</label>
              <select class="form-select" v-model="formData.statusAcao">
                <option value="nenhum">Nenhum</option>
                <option value="digitando">Digitando</option>
                <option value="gravando">Gravando</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          <!-- Delays condicionais -->
          <div class="row g-3 mb-3" v-if="formData.statusAcao && formData.statusAcao !== 'nenhum'">
            <div class="col-md-6" v-if="showDigitandoDelay">
              <label class="form-label">Delay Digitando (ms)</label>
              <input 
                type="number" 
                class="form-control" 
                v-model.number="formData.delayDigitando"
                min="0"
              />
            </div>
            <div class="col-md-6" v-if="showGravandoDelay">
              <label class="form-label">Delay Gravando (ms)</label>
              <input 
                type="number" 
                class="form-control" 
                v-model.number="formData.delayGravando"
                min="0"
              />
            </div>
          </div>

          <!-- Switches -->
          <div class="form-switches">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="formData.ativo" id="switchAtivo">
              <label class="form-check-label" for="switchAtivo">Ativo</label>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="formData.pausarBot" id="switchPausarBot">
              <label class="form-check-label" for="switchPausarBot">Pausar Bot</label>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="formData.temReacao" id="switchReacao">
              <label class="form-check-label" for="switchReacao">Reação</label>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="formData.temBotoes" id="switchBotoes">
              <label class="form-check-label" for="switchBotoes">Usar Botões</label>
            </div>

            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" v-model="formData.mencao" id="switchMencao">
              <label class="form-check-label" for="switchMencao">Mencionar Usuário</label>
            </div>
          </div>

          <!-- Campos condicionais -->
          <div v-if="formData.pausarBot" class="mt-3">
            <label class="form-label">Tempo de Pausa (segundos)</label>
            <input 
              type="number" 
              class="form-control" 
              v-model.number="formData.tempoPausaBot"
              placeholder="Deixe em branco para pausa indefinida"
              min="0"
            />
          </div>
      <div v-if="formData.tipoMensagem === 'reacao'" class="mt-3">
            <label class="form-label">Emoji de Reação <span class="text-danger">*</span></label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                v-model="formData.reacao"
                placeholder="Selecione um emoji"
                maxlength="2"
                readonly
                required
                :class="{ 'is-invalid': !formData.reacao && validated }"
              />
              <button 
                class="btn btn-outline-secondary" 
                type="button"
                @click="toggleEmojiPicker"
              >
                <i class="bi bi-emoji-smile"></i>
              </button>
            </div>
            <div class="invalid-feedback">
              Por favor, selecione um emoji.
            </div>
            <EmojiPicker 
              :show="showEmojiPicker" 
              @select="selectEmoji"
              @close="showEmojiPicker = false"
            />
          </div>
        </div>
      </div>

      <!-- Tipo de Mensagem -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="card-title mb-0">Tipo de Mensagem</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label">Tipo <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              v-model="formData.tipoMensagem"
              :class="{ 'is-invalid': !formData.tipoMensagem && validated }"
              required
            >
              <option value="">Selecione um tipo</option>
              <option v-for="tipo in tiposMensagem" :key="tipo.valor" :value="tipo.valor">
                {{ tipo.nome }}
              </option>
            </select>
            <div class="invalid-feedback">
              Por favor, selecione um tipo de mensagem.
            </div>
          </div>

          <!-- Campos específicos por tipo -->
          <div class="tipo-mensagem-content" v-if="formData.tipoMensagem">
            <!-- Texto -->
            <div v-if="formData.tipoMensagem === 'texto'" class="mb-3">
              <label class="form-label">Resposta <span class="text-danger">*</span></label>
              <textarea 
                class="form-control" 
                v-model="formData.resposta" 
                rows="3"
                :class="{ 'is-invalid': !formData.resposta && validated }"
                placeholder="Digite a resposta que será enviada"
                required
              ></textarea>
              <div class="form-text">Use {{mencao}} para mencionar o nome do cliente</div>
              <div class="invalid-feedback">
                Por favor, digite uma resposta.
              </div>
            </div>

            <!-- Arquivo -->
            <div v-if="formData.tipoMensagem === 'arquivo'" class="row g-3">
              <div class="col-md-12">
                <label class="form-label">Arquivo <span class="text-danger">*</span></label>
                <input 
                  type="file" 
                  class="form-control"
                  :class="{ 'is-invalid': !formData.arquivo && validated }"
                  @change="handleFileUpload"
                  required
                />
                <div class="invalid-feedback">
                  Por favor, selecione um arquivo.
                </div>
                <FilePreview 
                  v-if="formData.arquivo" 
                  :file="formData.arquivo"
                />
              </div>
              <div class="col-md-12">
                <label class="form-label">Legenda</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.legenda"
                  placeholder="Legenda opcional para o arquivo"
                />
              </div>
            </div>

            <!-- Localização -->
            <div v-if="formData.tipoMensagem === 'localizacao'" class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Latitude <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.localizacao.latitude"
                  :class="{ 'is-invalid': !formData.localizacao.latitude && validated }"
                  placeholder="-22.9519"
                  required
                />
                <div class="invalid-feedback">
                  Latitude é obrigatória.
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Longitude <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.localizacao.longitude"
                  :class="{ 'is-invalid': !formData.localizacao.longitude && validated }"
                  placeholder="-43.2105"
                  required
                />
                <div class="invalid-feedback">
                  Longitude é obrigatória.
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Descrição</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.localizacao.descricao"
                  placeholder="Nome do local"
                />
              </div>
            </div>

            <!-- Link -->
            <div v-if="formData.tipoMensagem === 'link'" class="mb-3">
                <label class="form-label">URL <span class="text-danger">*</span></label>
                <input 
                  type="url" 
                  class="form-control" 
                  v-model="formData.link"
                  :class="{ 'is-invalid': !formData.link && validated }"
                  placeholder="https://exemplo.com"
                  required
                />
                <div class="invalid-feedback">
                  Por favor, insira uma URL válida.
                </div>
              </div>

            <!-- Lista -->
            <div v-if="formData.tipoMensagem === 'lista'" class="lista-config">
              <div class="mb-3">
                <label class="form-label">Título da Lista <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control"
                  v-model="formData.listaConfig.title"
                  :class="{ 'is-invalid': !formData.listaConfig.title && validated }"
                  placeholder="Menu Interativo"
                  required
                />
                <div class="invalid-feedback">
                  Título da lista é obrigatório.
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Descrição</label>
                <input 
                  type="text" 
                  class="form-control"
                  v-model="formData.listaConfig.description"
                  placeholder="Por favor, selecione uma das opções abaixo"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Texto do Botão</label>
                <input 
                  type="text" 
                  class="form-control"
                  v-model="formData.listaConfig.buttonText"
                  placeholder="Escolha uma opção"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Rodapé</label>
                <input 
                  type="text" 
                  class="form-control"
                  v-model="formData.listaConfig.footer"
                  placeholder="Obrigado por participar"
                />
              </div>

              <!-- Opções da Lista -->
              <div class="lista-opcoes mt-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0">Opções da Lista</h6>
                  <button type="button" class="btn btn-sm btn-primary" @click="adicionarOpcaoLista">
                    <i class="bi bi-plus-circle"></i> Adicionar Opção
                  </button>
                </div>

                <div v-for="(opcao, index) in formData.opcoesLista" :key="index" class="card mb-3">
                  <div class="card-body">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label">ID</label>                        <input 
                          type="text" 
                          class="form-control" 
                          :value="'option_' + (index + 1)"
                          disabled
                        />
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Título <span class="text-danger">*</span></label>
                        <input 
                          type="text" 
                          class="form-control"
                          v-model="opcao.title"
                          :class="{ 'is-invalid': !opcao.title && validated }"
                          required
                        />
                        <div class="invalid-feedback">
                          Título da opção é obrigatório.
                        </div>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Descrição</label>
                        <div class="input-group">
                          <input 
                            type="text" 
                            class="form-control"
                            v-model="opcao.description"
                          />
                          <button 
                            type="button" 
                            class="btn btn-outline-danger"
                            @click="removerOpcaoLista(index)"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botões -->
            <div v-if="formData.temBotoes" class="botoes-config">
              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0">Opções de Botões</h6>
                  <button type="button" class="btn btn-sm btn-primary" @click="adicionarBotao">
                    <i class="bi bi-plus-circle"></i> Adicionar Botão
                  </button>
                </div>

                <div v-for="(botao, index) in formData.opcoesBotoes" :key="index" class="card mb-3">
                  <div class="card-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">Texto do Botão <span class="text-danger">*</span></label>
                        <div class="input-group">
                          <input 
                            type="text" 
                            class="form-control"
                            v-model="botao.texto"
                            :class="{ 'is-invalid': !botao.texto && validated }"
                            required
                            placeholder="Clique aqui"
                          />
                          <button 
                            type="button" 
                            class="btn btn-outline-danger"
                            @click="removerBotao(index)"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                        <div class="invalid-feedback">
                          Texto do botão é obrigatório.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fechamento de divs -->
          </div>
        </div>
      </div>

      <!-- Botões de Ação -->
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" @click="voltarParaLista">
          <i class="bi bi-x-circle"></i> Cancelar
        </button>
        <button type="submit" class="btn btn-primary">
          <i class="bi bi-check-circle"></i> Salvar
        </button>
      </div>
    </form>

    <!-- Toast Notification -->
    <div v-if="toast.show" :class="`toast align-items-center text-bg-${toast.type} position-fixed bottom-0 end-0 show`" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          {{ toast.message }}
        </div>
        <button type="button" class="btn-close btn-close-white" @click="toast.show = false" aria-label="Close"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as respostasService from '../../../services/respostasService';
import FilePreview from './FilePreview.vue';
import EmojiPicker from './EmojiPicker.vue';
import './optionsForm.css';

// Props e Emits
const props = defineProps({
  respostaParaEditar: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['navigate']);

// Toast e Loading States
const toast = ref({
  show: false,
  message: '',
  type: 'success'
});

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

const isLoading = ref(false);

// Emoji Picker
const showEmojiPicker = ref(false);

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const selectEmoji = (emoji) => {
  formData.value.reacao = emoji;
  showEmojiPicker.value = false;
};

// Computed properties
const showDigitandoDelay = computed(() => {
  return formData.value.statusAcao === 'digitando' || formData.value.statusAcao === 'todos';
});

const showGravandoDelay = computed(() => {
  return formData.value.statusAcao === 'gravando' || formData.value.statusAcao === 'todos';
});

// Tipos de mensagem disponíveis
const tiposMensagem = [
  { nome: 'Texto', valor: 'texto', icone: 'bi bi-chat-text' },
  { nome: 'Lista', valor: 'lista', icone: 'bi bi-list-ul' },
  { nome: 'Arquivo', valor: 'arquivo', icone: 'bi bi-file-earmark' },
  { nome: 'Link', valor: 'link', icone: 'bi bi-link' },
  { nome: 'Localização', valor: 'localizacao', icone: 'bi bi-geo-alt' },
  { nome: 'Reação', valor: 'reacao', icone: 'bi bi-emoji-smile' }
];

// Estado do formulário e validação
const validated = ref(false);
const formData = ref({
  // Dados básicos
  id: null,
  acionador: '',
  tipoMensagem: '',
  resposta: '',
  statusAcao: 'nenhum',
  delayDigitando: 1000,
  delayGravando: 1000,
    // Status
  pausarBot: false,
  tempoPausaBot: null,
  mostraDigitando: false,
  mostraGravando: false,
  ativo: true,

  // Tempo de delay
  tempoDelay: 1000,
  
  // Arquivos de mídia
  arquivo: null,
  legenda: '',
  arquivos: {
    audio: null,
    pdf: null,
    imagem: null,
    sticker: null,
    video: null,
    gif: null
  },
  
  // Localização
  localizacao: {
    latitude: '',
    longitude: '',
    descricao: ''
  },
  
  // Botões
  temBotoes: false,
  opcoesBotoes: [],
  
  // Lista
  temLista: false,
  opcoesLista: [],
  listaConfig: {
    title: '',
    description: '',
    buttonText: 'Escolha uma opção',
    footer: ''
  },
  
  // Outros recursos
  reacao: '',
  mencao: false,
  link: ''
});

// Gerenciamento de botões
const adicionarBotao = () => {
  formData.value.opcoesBotoes.push({
    texto: ''
  });
};

const removerBotao = (index) => {
  formData.value.opcoesBotoes.splice(index, 1);
};

// Gerenciamento de lista
const adicionarOpcaoLista = () => {
  formData.value.opcoesLista.push({
    rowId: `option_${formData.value.opcoesLista.length + 1}`,
    title: '',
    description: ''
  });
};

const removerOpcaoLista = (index) => {
  formData.value.opcoesLista.splice(index, 1);
  // Atualiza os IDs das opções restantes
  formData.value.opcoesLista.forEach((opcao, i) => {
    opcao.rowId = `option_${i + 1}`;
  });
};

// Gerenciamento de arquivos
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  formData.value.arquivo = file;
  
  // Determina o tipo de arquivo
  if (file.type.startsWith('image/')) {
    if (file.type === 'image/gif') {
      formData.value.arquivos.gif = file;
    } else if (file.type === 'image/webp') {
      formData.value.arquivos.sticker = file;
    } else {
      formData.value.arquivos.imagem = file;
    }
  } else if (file.type.startsWith('video/')) {
    formData.value.arquivos.video = file;
  } else if (file.type.startsWith('audio/')) {
    formData.value.arquivos.audio = file;
  } else if (file.type === 'application/pdf') {
    formData.value.arquivos.pdf = file;
  }
};

// Emoji selector
const abrirSeletorEmoji = () => {
  // Aqui você pode implementar um seletor de emoji ou usar uma biblioteca
  alert('Implementar seletor de emoji');
};

// Validação e salvamento
const validarFormulario = () => {
  validated.value = true;
  // Validação básica
  if (!formData.value.acionador) return false;
  if (!formData.value.tipoMensagem) return false;
  
  // Validações específicas por tipo
  switch (formData.value.tipoMensagem) {
    case 'texto':
      if (!formData.value.resposta) return false;
      break;
    case 'arquivo':
      if (!formData.value.arquivo) return false;
      break;
    case 'localizacao':
      if (!formData.value.localizacao.latitude || !formData.value.localizacao.longitude) return false;
      break;
    case 'lista':
      if (!formData.value.listaConfig.title) return false;
      if (formData.value.opcoesLista.length === 0) return false;
      if (formData.value.opcoesLista.some(opcao => !opcao.title)) return false;
      break;
    case 'reacao':
      if (!formData.value.reacao) return false;
      break;
    case 'link':
      if (!formData.value.link) return false;
      break;
  }

  // Validação de botões
  if (formData.value.temBotoes) {
    if (formData.value.opcoesBotoes.length === 0) return false;
    if (formData.value.opcoesBotoes.some(botao => !botao.texto)) return false;
  }

  return true;
};

const handleSubmit = async (event) => {
  if (!validarFormulario()) {
    return;
  }

  try {    // Prepara os dados no formato da classe RespostaChatBot
    const dadosParaSalvar = {
      id: formData.value.id || Date.now().toString(),
      acionador: formData.value.acionador,
      tipoMensagem: formData.value.tipoMensagem,
      resposta: formData.value.resposta,
      pausarBot: formData.value.pausarBot,
      mostraDigitando: formData.value.statusAcao === 'digitando' || formData.value.statusAcao === 'todos',
      mostraGravando: formData.value.statusAcao === 'gravando' || formData.value.statusAcao === 'todos',
      tempoDelay: formData.value.statusAcao === 'digitando' ? formData.value.delayDigitando : 
                 formData.value.statusAcao === 'gravando' ? formData.value.delayGravando : 1000,
      
      // Arquivos de mídia
      arquivoAudio: formData.value.arquivos.audio ? URL.createObjectURL(formData.value.arquivos.audio) : '',
      arquivoPdf: formData.value.arquivos.pdf ? URL.createObjectURL(formData.value.arquivos.pdf) : '',
      arquivoImagem: formData.value.arquivos.imagem ? URL.createObjectURL(formData.value.arquivos.imagem) : '',
      arquivoSticker: formData.value.arquivos.sticker ? URL.createObjectURL(formData.value.arquivos.sticker) : '',
      arquivoVideo: formData.value.arquivos.video ? URL.createObjectURL(formData.value.arquivos.video) : '',
      
      // Localização
      localizacao: {
        latitude: formData.value.localizacao.latitude,
        longitude: formData.value.localizacao.longitude,
        descricao: formData.value.localizacao.descricao
      },
      
      // Botões
      temBotoes: formData.value.temBotoes,
      opcoesBotoes: formData.value.opcoesBotoes,
      
      // Lista
      temLista: formData.value.tipoMensagem === 'lista',
      opcoesLista: formData.value.opcoesLista,
      
      // Outros recursos
      reacao: formData.value.reacao,
      mencao: formData.value.mencao,
      link: formData.value.link,
      ativo: formData.value.ativo
    };

    isLoading.value = true;

    if (formData.value.id) {
      await respostasService.atualizarResposta(dadosParaSalvar);
    } else {
      await respostasService.adicionarResposta(dadosParaSalvar);
    }

    showToast('Resposta salva com sucesso!');
    voltarParaLista();
  } catch (error) {
    console.error('Erro ao salvar:', error);
    showToast('Erro ao salvar resposta: ' + error.message, 'danger');
  } finally {
    isLoading.value = false;
  }
};

// Navegação
const voltarParaLista = () => {
  emit('navigate', 'CrudForm');
};

// Inicialização
onMounted(() => {
  if (props.respostaParaEditar) {
    formData.value = {
      ...formData.value,
      ...props.respostaParaEditar,
      statusAcao: props.respostaParaEditar.mostraDigitando && props.respostaParaEditar.mostraGravando ? 'todos' :
                 props.respostaParaEditar.mostraDigitando ? 'digitando' :
                 props.respostaParaEditar.mostraGravando ? 'gravando' : ''
    };
  }
});
</script>

