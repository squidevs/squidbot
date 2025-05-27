<template>
  <div class="container py-4">
    <div class="row align-items-center mb-4">
      <div class="col-auto">
        <button
          class="btn btn-sm btn-primary rounded-pill"
          @click="voltarParaLista"
        >
          <i class="bi bi-arrow-left"></i> Voltar
        </button>
      </div>
      <div class="col">
        <h1 class="h4 mb-0">{{ formData.id ? 'Editar' : 'Criar nova' }} resposta</h1>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
      <div class="card mb-4">
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="acionador" class="form-label">Acionador</label>
              <input
                type="text"
                class="form-control"
                id="acionador"
                v-model="formData.acionador"
                placeholder="Palavra ou frase que ativa a resposta"
                required
              />
            </div>
            <div class="col-md-6">
              <label for="titulo" class="form-label">Título</label>
              <input
                type="text"
                class="form-control"
                id="titulo"
                v-model="formData.titulo"
                placeholder="Título para identificação"
                required
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="resposta" class="form-label">Resposta do chatbot</label>
            <textarea
              class="form-control"
              id="resposta"
              v-model="formData.resposta"
              placeholder="Digite a resposta que o bot enviará"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label for="imagem" class="form-label">Imagem (PNG, JPG)</label>
              <input
                type="file"
                class="form-control"
                id="imagem"
                accept="image/png,image/jpeg"
                @change="e => handleFileUpload(e, 'imagem')"
              />
            </div>
            <div class="col-md-6">
              <label for="gif" class="form-label">GIF</label>
              <input
                type="file"
                class="form-control"
                id="gif"
                accept="image/gif"
                @change="e => handleFileUpload(e, 'gif')"
              />
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6">
              <label for="audio" class="form-label">Áudio (MP3, WAV)</label>
              <input
                type="file"
                class="form-control"
                id="audio"
                accept="audio/mpeg,audio/wav"
                @change="e => handleFileUpload(e, 'audio')"
              />
            </div>
            <div class="col-md-6">
              <label for="sticker" class="form-label">Sticker (WebP)</label>
              <input
                type="file"
                class="form-control"
                id="sticker"
                accept="image/webp"
                @change="e => handleFileUpload(e, 'sticker')"
              />
            </div>
          </div>

          <div class="mb-3">
            <label for="pdf" class="form-label">PDF</label>
            <input
              type="file"
              class="form-control"
              id="pdf"
              accept="application/pdf"
              @change="e => handleFileUpload(e, 'pdf')"
            />
          </div>

          <!-- Preview de arquivos -->
          <div v-if="hasPreviewableFiles" class="mb-4">
            <h5 class="mb-3">Visualização de Arquivos</h5>
            <div class="row g-3">
              <template v-if="previewUrls.imagem">
                <div class="col-md-4">
                  <div class="card h-100">
                    <img :src="previewUrls.imagem" class="card-img-top" alt="Preview de Imagem" />
                    <div class="card-body">
                      <button class="btn btn-sm btn-danger w-100" @click="removerArquivo('imagem')">
                        <i class="bi bi-trash"></i> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <template v-if="previewUrls.gif">
                <div class="col-md-4">
                  <div class="card h-100">
                    <img :src="previewUrls.gif" class="card-img-top" alt="Preview de GIF" />
                    <div class="card-body">
                      <button class="btn btn-sm btn-danger w-100" @click="removerArquivo('gif')">
                        <i class="bi bi-trash"></i> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <template v-if="previewUrls.sticker">
                <div class="col-md-4">
                  <div class="card h-100">
                    <img :src="previewUrls.sticker" class="card-img-top" alt="Preview de Sticker" />
                    <div class="card-body">
                      <button class="btn btn-sm btn-danger w-100" @click="removerArquivo('sticker')">
                        <i class="bi bi-trash"></i> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <template v-if="previewUrls.audio">
                <div class="col-md-4">
                  <div class="card h-100">
                    <div class="card-body">
                      <audio controls class="w-100 mb-2">
                        <source :src="previewUrls.audio" type="audio/mpeg">
                        Seu navegador não suporta o elemento de áudio.
                      </audio>
                      <button class="btn btn-sm btn-danger w-100" @click="removerArquivo('audio')">
                        <i class="bi bi-trash"></i> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <template v-if="formData.arquivoPdf">
                <div class="col-md-4">
                  <div class="card h-100">
                    <div class="card-body text-center">
                      <i class="bi bi-file-pdf display-4 text-danger"></i>
                      <p class="mb-2">{{ formData.arquivoPdf }}</p>
                      <button class="btn btn-sm btn-danger w-100" @click="removerArquivo('pdf')">
                        <i class="bi bi-trash"></i> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Configurações avançadas -->
          <div class="card">
            <div class="card-header bg-light">
              <h5 class="mb-0">Configurações Avançadas</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-check form-switch mb-3">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="mostraDigitando"
                      v-model="formData.mostraDigitando"
                    >
                    <label class="form-check-label" for="mostraDigitando">
                      Mostrar "digitando..."
                    </label>
                  </div>
                  <div class="form-check form-switch mb-3">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="mostraGravando"
                      v-model="formData.mostraGravando"
                    >
                    <label class="form-check-label" for="mostraGravando">
                      Mostrar "gravando áudio..."
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="tempoDelay" class="form-label">Tempo de Delay (ms)</label>
                    <input 
                      type="number" 
                      class="form-control" 
                      id="tempoDelay"
                      v-model="formData.tempoDelay"
                      min="0" 
                      step="500"
                    >
                  </div>
                  <div class="mb-3">
                    <label for="link" class="form-label">Link (opcional)</label>
                    <input 
                      type="url" 
                      class="form-control" 
                      id="link"
                      v-model="formData.link"
                      placeholder="https://..."
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-end">
        <button type="button" class="btn btn-secondary me-2" @click="voltarParaLista">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary">
          {{ formData.id ? 'Atualizar' : 'Salvar' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as respostasService from '../../../services/respostasService';

// Define as props
const props = defineProps({
  respostaParaEditar: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['navigate']);

// Estado do formulário
const formData = ref({
  id: null,
  titulo: '',
  acionador: '',
  resposta: '',
  arquivoImagem: '',
  arquivoGif: '',
  arquivoPdf: '',
  arquivoAudio: '',
  arquivoSticker: '',
  tipoResposta: 'unica',
  tempoDelay: 1000,
  mostraDigitando: true,
  mostraGravando: false,
  link: '',
  ativo: true
});

// Estado das previews
const previewUrls = ref({
  imagem: null,
  gif: null,
  audio: null,
  sticker: null
});

// Computed para verificar se há arquivos para preview
const hasPreviewableFiles = computed(() => {
  return Object.values(previewUrls.value).some(url => url) || formData.value.arquivoPdf;
});

// Validação de arquivos
const validarArquivo = (file, tipo) => {
  const limitesTamanho = {
    imagem: 5 * 1024 * 1024,    // 5MB
    gif: 8 * 1024 * 1024,       // 8MB
    pdf: 10 * 1024 * 1024,      // 10MB
    audio: 16 * 1024 * 1024,    // 16MB
    sticker: 1 * 1024 * 1024    // 1MB
  };

  if (!file) return { valido: false, mensagem: 'Nenhum arquivo selecionado' };
  
  if (file.size > limitesTamanho[tipo]) {
    return { 
      valido: false, 
      mensagem: `O arquivo é muito grande. Tamanho máximo: ${limitesTamanho[tipo] / (1024 * 1024)}MB` 
    };
  }

  return { valido: true };
};

// Gerenciamento de uploads
const handleFileUpload = async (event, tipo) => {
  const file = event.target.files[0];
  if (!file) return;

  const validacao = validarArquivo(file, tipo);
  if (!validacao.valido) {
    alert(validacao.mensagem);
    event.target.value = ''; // Limpa o input
    return;
  }

  // Criar URL para preview
  if (tipo !== 'pdf') {
    previewUrls.value[tipo] = URL.createObjectURL(file);
  }

  // Atualiza o formData com o nome do arquivo
  switch (tipo) {
    case 'imagem':
      formData.value.arquivoImagem = file.name;
      break;
    case 'gif':
      formData.value.arquivoGif = file.name;
      break;
    case 'pdf':
      formData.value.arquivoPdf = file.name;
      break;
    case 'audio':
      formData.value.arquivoAudio = file.name;
      break;
    case 'sticker':
      formData.value.arquivoSticker = file.name;
      break;
  }
};

// Remover arquivo
const removerArquivo = (tipo) => {
  if (tipo !== 'pdf' && previewUrls.value[tipo]) {
    URL.revokeObjectURL(previewUrls.value[tipo]);
    previewUrls.value[tipo] = null;
  }

  switch (tipo) {
    case 'imagem':
      formData.value.arquivoImagem = '';
      break;
    case 'gif':
      formData.value.arquivoGif = '';
      break;
    case 'pdf':
      formData.value.arquivoPdf = '';
      break;
    case 'audio':
      formData.value.arquivoAudio = '';
      break;
    case 'sticker':
      formData.value.arquivoSticker = '';
      break;
  }
};

// Submit do formulário
const handleSubmit = async (event) => {
  event.preventDefault();
  
  try {
    if (formData.value.id) {
      await respostasService.atualizarResposta(formData.value);
    } else {
      await respostasService.criarResposta(formData.value);
    }

    // Limpar URLs de preview
    Object.keys(previewUrls.value).forEach(key => {
      if (previewUrls.value[key]) {
        URL.revokeObjectURL(previewUrls.value[key]);
      }
    });

    voltarParaLista();
  } catch (error) {
    alert('Erro ao salvar resposta: ' + error.message);
  }
};

// Voltar para a listagem
const voltarParaLista = () => {
  emit('navigate', 'CrudForm');
};

// Se houver uma resposta para editar, preenche o formulário
if (props.respostaParaEditar) {
  formData.value = { ...props.respostaParaEditar };
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.preview-container {
  background-color: #f8f9fa;
  border-radius: 0.25rem;
  padding: 1rem;
}

.preview-item {
  text-align: center;
}

.card-img-top {
  height: 200px;
  object-fit: contain;
  background-color: #f8f9fa;
}

.bi-file-pdf {
  font-size: 3rem;
}

audio {
  width: 100%;
}

.form-check-input:checked {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-danger {
  transition: all 0.2s;
}

.btn-danger:hover {
  transform: scale(1.05);
}
</style>
