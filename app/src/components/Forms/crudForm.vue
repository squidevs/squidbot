<template>
  <div class="container py-4">
    <h2 class="mb-3">Gerenciamento de Respostas do ChatBot</h2>

    <!-- Botão de Adicionar -->
    <button class="btn btn-success rounded-pill px-2 m-1" @click="$emit('navigate', 'GerenciadorRespostas')">
      <i class="bi bi-plus-circle"></i> Adicionar Resposta
    </button>

    <!-- Tabela de Listagem -->
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th>Acionador</th>
            <th>Resposta</th>
            <th>Tipo</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-start" v-for="item in respostas" :key="item.id">
            <td>{{ item.acionador }}</td>
            <td>{{ item.resposta }}</td>
            <td>
              {{ getTipoResposta(item) }}
            </td>
            <td class="text-center">
              <button 
                class="btn btn-sm rounded-pill px-4 m-1" 
                :class="item.ativo ? 'btn-success' : 'btn-secondary'" 
                @click="toggleStatus(item)"
              >
                {{ item.ativo ? 'Ativo' : 'Inativo' }}
              </button>
            </td>
            <td class="text-center">
              <button class="btn btn-sm btn-info rounded-pill px-2 m-1" @click="abrirDetalhes(item)">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary rounded-pill px-2 m-1" @click="abrirFormulario(item)">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger rounded-pill px-2 m-1" @click="excluirResposta(item.id)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
   
    <!-- Lista de Respostas -->
    <!-- <div class="lista-respostas">
      <h3>Respostas Cadastradas</h3>
      <div v-for="item in respostas" :key="item.id" class="resposta-item">
        <div class="resposta-conteudo">
          <strong>Acionador:</strong> {{ item.acionador }}
          <br />
          <strong>Resposta:</strong> {{ item.resposta }}
        </div>
        <div class="resposta-acoes">
          <button @click="editarResposta(item)" class="btn btn-sm btn-primary rounded-circle m-1"><i class="bi bi-pencil"></i></button>
          <button @click="excluirResposta(item.id)" class="btn btn-sm btn-danger rounded-circle m-1"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div> -->
    <!-- Modal de Detalhes -->
    <div class="modal fade" id="modalDetalhes" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalhes da Resposta</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="itemDetalhes">
            <!-- Informações Básicas -->
            <div class="section-basic mb-3">
              <h6 class="section-title">Informações Básicas</h6>
              <p><strong>Acionador:</strong> {{ itemDetalhes.acionador }}</p>
              <p><strong>Tipo de Mensagem:</strong> {{ itemDetalhes.tipoMensagem }}</p>
              <p><strong>Resposta:</strong> {{ itemDetalhes.resposta }}</p>
              <p><strong>Status:</strong> {{ itemDetalhes.ativo ? 'Ativo' : 'Inativo' }}</p>
            </div>

            <!-- Configurações de Status -->
            <div class="section-status mb-3">
              <h6 class="section-title">Configurações de Status</h6>
              <p><strong>Mostra Digitando:</strong> {{ itemDetalhes.mostraDigitando ? 'Sim' : 'Não' }}</p>
              <p><strong>Mostra Gravando:</strong> {{ itemDetalhes.mostraGravando ? 'Sim' : 'Não' }}</p>
              <p><strong>Tempo de Delay:</strong> {{ itemDetalhes.tempoDelay }}ms</p>
              <p><strong>Pausar Bot:</strong> {{ itemDetalhes.pausarBot ? 'Sim' : 'Não' }}</p>
            </div>

            <!-- Arquivos -->
            <div class="section-files mb-3" v-if="hasFiles">
              <h6 class="section-title">Arquivos</h6>
              <div v-if="itemDetalhes.arquivoAudio" class="file-preview">
                <p><strong>Áudio:</strong></p>
                <audio controls :src="itemDetalhes.arquivoAudio"></audio>
              </div>
              <div v-if="itemDetalhes.arquivoPdf" class="file-preview">
                <p><strong>PDF:</strong></p>
                <a :href="itemDetalhes.arquivoPdf" target="_blank">Visualizar PDF</a>
              </div>
              <div v-if="itemDetalhes.arquivoImagem" class="file-preview">
                <p><strong>Imagem:</strong></p>
                <img :src="itemDetalhes.arquivoImagem" alt="Preview" class="img-fluid" />
              </div>
              <div v-if="itemDetalhes.arquivoSticker" class="file-preview">
                <p><strong>Sticker:</strong></p>
                <img :src="itemDetalhes.arquivoSticker" alt="Sticker" class="img-fluid" />
              </div>
              <div v-if="itemDetalhes.arquivoVideo" class="file-preview">
                <p><strong>Vídeo:</strong></p>
                <video controls :src="itemDetalhes.arquivoVideo" class="img-fluid"></video>
              </div>
            </div>

            <!-- Link -->
            <div class="section-link mb-3" v-if="itemDetalhes.link">
              <h6 class="section-title">Link</h6>
              <p><strong>URL:</strong> <a :href="itemDetalhes.link" target="_blank">{{ itemDetalhes.link }}</a></p>
            </div>

            <!-- Localização -->
            <div class="section-location mb-3" v-if="hasLocation">
              <h6 class="section-title">Localização</h6>
              <p><strong>Latitude:</strong> {{ itemDetalhes.localizacao?.latitude }}</p>
              <p><strong>Longitude:</strong> {{ itemDetalhes.localizacao?.longitude }}</p>
              <p v-if="itemDetalhes.localizacao?.descricao"><strong>Descrição:</strong> {{ itemDetalhes.localizacao.descricao }}</p>
            </div>

            <!-- Lista -->
            <div class="section-list mb-3" v-if="itemDetalhes.temLista">
              <h6 class="section-title">Configuração da Lista</h6>
              <div class="list-config">
                <p><strong>Título:</strong> {{ itemDetalhes.listaConfig?.title }}</p>
                <p v-if="itemDetalhes.listaConfig?.description"><strong>Descrição:</strong> {{ itemDetalhes.listaConfig.description }}</p>
                <p v-if="itemDetalhes.listaConfig?.buttonText"><strong>Texto do Botão:</strong> {{ itemDetalhes.listaConfig.buttonText }}</p>
                <p v-if="itemDetalhes.listaConfig?.footer"><strong>Rodapé:</strong> {{ itemDetalhes.listaConfig.footer }}</p>
              </div>
              <div class="list-options" v-if="itemDetalhes.opcoesLista?.length">
                <h6 class="mt-2">Opções da Lista</h6>
                <ul class="list-unstyled">
                  <li v-for="(opcao, index) in itemDetalhes.opcoesLista" :key="index" class="mb-2">
                    <p class="mb-1"><strong>Opção {{ index + 1 }}:</strong></p>
                    <p class="mb-1 ms-3">Título: {{ opcao.title }}</p>
                    <p v-if="opcao.description" class="mb-1 ms-3">Descrição: {{ opcao.description }}</p>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Botões -->
            <div class="section-buttons mb-3" v-if="itemDetalhes.temBotoes && itemDetalhes.opcoesBotoes?.length">
              <h6 class="section-title">Botões</h6>
              <ul class="list-unstyled">
                <li v-for="(botao, index) in itemDetalhes.opcoesBotoes" :key="index" class="mb-2">
                  <p class="mb-1"><strong>Botão {{ index + 1 }}:</strong> {{ botao.texto }}</p>
                </li>
              </ul>
            </div>

            <!-- Recursos Adicionais -->
            <div class="section-additional mb-3" v-if="hasAdditionalFeatures">
              <h6 class="section-title">Recursos Adicionais</h6>
              <p v-if="itemDetalhes.reacao"><strong>Reação:</strong> {{ itemDetalhes.reacao }}</p>
              <p><strong>Menção ao Usuário:</strong> {{ itemDetalhes.mencao ? 'Sim' : 'Não' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import * as bootstrap from 'bootstrap';
import './crudForm.css';
import * as respostasService from '../../services/respostasService';

const respostas = ref([]);
const itemDetalhes = ref(null);

// Computed properties para controle de exibição das seções
const hasFiles = computed(() => {
  if (!itemDetalhes.value) return false;
  return !!(
    itemDetalhes.value.arquivoAudio ||
    itemDetalhes.value.arquivoPdf ||
    itemDetalhes.value.arquivoImagem ||
    itemDetalhes.value.arquivoSticker ||
    itemDetalhes.value.arquivoVideo
  );
});

const hasLocation = computed(() => {
  if (!itemDetalhes.value?.localizacao) return false;
  return !!(
    itemDetalhes.value.localizacao.latitude ||
    itemDetalhes.value.localizacao.longitude
  );
});

const hasAdditionalFeatures = computed(() => {
  if (!itemDetalhes.value) return false;
  return !!(itemDetalhes.value.reacao || itemDetalhes.value.mencao);
});

// Carregar respostas
function carregarRespostas() {
  respostas.value = respostasService.listarRespostas();
}

// Determinar tipo de resposta
function getTipoResposta(item) {
  if (item.arquivoAudio) return 'Áudio';
  if (item.arquivoPdf) return 'PDF';
  if (item.arquivoImagem) return 'Imagem';
  if (item.arquivoSticker) return 'Sticker';
  if (item.link) return 'Link';
  if (item.temBotoes) return 'Botões';
  return 'Texto';
}

// Abrir modal de detalhes
async function abrirDetalhes(item) {
  itemDetalhes.value = item;
  const modal = new bootstrap.Modal(document.getElementById('modalDetalhes'));
  modal.show();
}

// Abrir formulário de edição
function abrirFormulario(item) {
  emit('navigate', 'OptionsForm', item);
}

// Toggle status ativo/inativo
async function toggleStatus(item) {
  try {
    const novoStatus = !item.ativo;
    await respostasService.atualizarResposta({ ...item, ativo: novoStatus });
    carregarRespostas();
  } catch (error) {
    alert('Erro ao alterar status: ' + error.message);
  }
}

// Excluir resposta
async function excluirResposta(id) {
  if (!confirm('Tem certeza que deseja excluir esta resposta?')) {
    return;
  }

  try {
    await respostasService.excluirResposta(id);
    carregarRespostas();
  } catch (error) {
    alert('Erro ao excluir resposta: ' + error.message);
  }
}

// Carregar dados iniciais
onMounted(() => {
  carregarRespostas();
});

const emit = defineEmits(['navigate']);
</script>

<style scoped>
.table th {
  font-weight: 600;
}

.table td {
  vertical-align: middle;
}

.btn-group-sm > .btn,
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
}

/* Estilo para ícones nos botões */
.btn i {
  margin-right: 0.25rem;
}

/* Estilo para status badge */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

/* Estilo para o modal de detalhes */
.modal-body strong {
  color: #495057;
}

.modal-body p {
  margin-bottom: 0.5rem;
}

/* Animações para transições de estado */
.table tr {
  transition: background-color 0.2s ease;
}

.btn {
  transition: all 0.2s ease;
}

/* Responsividade para telas pequenas */
@media (max-width: 768px) {
  .table-responsive {
    margin-bottom: 1rem;
    border: 0;
  }

  .btn-group-sm > .btn,
  .btn-sm {
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
  }
}
</style>