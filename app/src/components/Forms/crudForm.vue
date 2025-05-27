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
            <p><strong>Acionador:</strong> {{ itemDetalhes.acionador }}</p>
            <p><strong>Resposta:</strong> {{ itemDetalhes.resposta }}</p>
            <p><strong>Status:</strong> {{ itemDetalhes.ativo ? 'Ativo' : 'Inativo' }}</p>
            <p><strong>Mostra Digitando:</strong> {{ itemDetalhes.mostraDigitando ? 'Sim' : 'Não' }}</p>
            <p><strong>Mostra Gravando:</strong> {{ itemDetalhes.mostraGravando ? 'Sim' : 'Não' }}</p>
            <p><strong>Tempo de Delay:</strong> {{ itemDetalhes.tempoDelay }}ms</p>
            <p v-if="itemDetalhes.arquivoAudio"><strong>Áudio:</strong> {{ itemDetalhes.arquivoAudio }}</p>
            <p v-if="itemDetalhes.arquivoPdf"><strong>PDF:</strong> {{ itemDetalhes.arquivoPdf }}</p>
            <p v-if="itemDetalhes.arquivoImagem"><strong>Imagem:</strong> {{ itemDetalhes.arquivoImagem }}</p>
            <p v-if="itemDetalhes.arquivoSticker"><strong>Sticker:</strong> {{ itemDetalhes.arquivoSticker }}</p>
            <p v-if="itemDetalhes.link"><strong>Link:</strong> {{ itemDetalhes.link }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as bootstrap from 'bootstrap';
import './crudForm.css';
import * as respostasService from '../../services/respostasService';

const respostas = ref([]);
const itemDetalhes = ref(null);

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