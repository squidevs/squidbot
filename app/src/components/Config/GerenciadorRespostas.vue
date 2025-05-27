<template>
  <div class="gerenciador-respostas">
    <h2>Gerenciar Respostas do ChatBot</h2>
    
    <!-- Formulário de Resposta -->
    <form @submit.prevent="salvarResposta" class="form-resposta">
      <div class="form-group">
        <label>Acionador (palavra-chave)</label>
        <input v-model="resposta.acionador" required class="form-control" />
      </div>
      
      <div class="form-group">
        <label>Resposta</label>
        <textarea v-model="resposta.resposta" required class="form-control"></textarea>
      </div>
      
      <div class="form-switches">
        <div class="form-check form-switch">
          <input
            v-model="resposta.mostraDigitando"
            class="form-check-input"
            type="checkbox"
            id="mostraDigitando"
          />
          <label class="form-check-label" for="mostraDigitando">
            Mostrar Digitando
          </label>
        </div>
        
        <div class="form-check form-switch">
          <input
            v-model="resposta.mostraGravando"
            class="form-check-input"
            type="checkbox"
            id="mostraGravando"
          />
          <label class="form-check-label" for="mostraGravando">
            Mostrar Gravando
          </label>
        </div>
      </div>
      
      <div class="form-files">
        <div class="form-group">
          <label>Arquivo de Áudio</label>
          <input type="file" accept="audio/*" @change="onAudioChange" class="form-control" />
        </div>
        
        <div class="form-group">
          <label>Arquivo PDF</label>
          <input type="file" accept="application/pdf" @change="onPdfChange" class="form-control" />
        </div>
        
        <div class="form-group">
          <label>Imagem</label>
          <input type="file" accept="image/*" @change="onImagemChange" class="form-control" />
        </div>
        
        <div class="form-group">
          <label>Sticker</label>
          <input type="file" accept="image/webp" @change="onStickerChange" class="form-control" />
        </div>
      </div>
      
      <div class="form-group">
        <label>Link</label>
        <input v-model="resposta.link" type="url" class="form-control" />
      </div>
      
      <div class="form-group">
        <label>Tempo de Delay (ms)</label>
        <input v-model.number="resposta.tempoDelay" type="number" min="0" class="form-control" />
      </div>
      
      <div v-if="resposta.temBotoes" class="form-group">
        <label>Opções de Botões</label>
        <div v-for="(opcao, index) in resposta.opcoesBotoes" :key="index" class="opcao-botao">
          <input v-model="opcao.texto" placeholder="Texto do botão" class="form-control" />
          <button type="button" @click="removerOpcao(index)" class="btn btn-danger">
            Remover
          </button>
        </div>
        <button type="button" @click="adicionarOpcao" class="btn btn-secondary">
          Adicionar Opção
        </button>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">{{ modoEdicao ? 'Atualizar' : 'Criar' }}</button>
        <button type="button" @click="limparFormulario" class="btn btn-secondary">Limpar</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RespostaChatBot } from '../../types/RespostaChatBot';
import * as respostasService from '../../services/respostasService';

const resposta = ref(new RespostaChatBot({}));
const respostas = ref([]);
const modoEdicao = ref(false);

// Carregar respostas
function carregarRespostas() {
  respostas.value = respostasService.listarRespostas();
}

// Salvar resposta
async function salvarResposta() {
  if (modoEdicao.value) {
    respostasService.atualizarResposta(resposta.value.id, resposta.value);
  } else {
    respostasService.criarResposta(resposta.value);
  }
  
  limparFormulario();
  carregarRespostas();
}

// Editar resposta
function editarResposta(item) {
  resposta.value = new RespostaChatBot({ ...item });
  modoEdicao.value = true;
}

// Excluir resposta
function excluirResposta(id) {
  if (confirm('Tem certeza que deseja excluir esta resposta?')) {
    respostasService.excluirResposta(id);
    carregarRespostas();
  }
}

// Limpar formulário
function limparFormulario() {
  resposta.value = new RespostaChatBot({});
  modoEdicao.value = false;
}

// Manipuladores de arquivos
function onAudioChange(event) {
  // TODO: Implementar upload de arquivo
  resposta.value.arquivoAudio = event.target.files[0]?.name || '';
}

function onPdfChange(event) {
  resposta.value.arquivoPdf = event.target.files[0]?.name || '';
}

function onImagemChange(event) {
  resposta.value.arquivoImagem = event.target.files[0]?.name || '';
}

function onStickerChange(event) {
  resposta.value.arquivoSticker = event.target.files[0]?.name || '';
}

// Gerenciamento de opções de botões
function adicionarOpcao() {
  if (!resposta.value.opcoesBotoes) {
    resposta.value.opcoesBotoes = [];
  }
  resposta.value.opcoesBotoes.push({ texto: '' });
}

function removerOpcao(index) {
  resposta.value.opcoesBotoes.splice(index, 1);
}

// Inicialização
onMounted(() => {
  carregarRespostas();
});
</script>

<style scoped>
.gerenciador-respostas {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.form-resposta {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-switches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.form-files {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.lista-respostas {
  margin-top: 30px;
}

.resposta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 10px;
}

.resposta-acoes {
  display: flex;
  gap: 10px;
}

.opcao-botao {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
</style>
