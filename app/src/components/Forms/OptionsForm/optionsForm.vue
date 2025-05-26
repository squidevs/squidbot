<template>
  <div>
    <div class="row align-items-center mb-4">
      <div class="col-auto">
        <!-- Botão de Voltar -->
        <button
          class="btn btn-sm btn-primary rounded-pill"
          @click="$emit('navigate', 'CrudForm')"
        >
          <i class="bi bi-arrow-left"></i>
        </button>
      </div>
      <div class="col">
        <h1 class="h4 mb-0">Criar nova opção</h1>
      </div>
    </div>

    <!-- Formulário existente -->
    <form>
      <div class="text-end">
        <button class="btn btn-primary" type="submit">Salvar</button>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="titulo" class="form-label">Título</label>
          <input
            type="text"
            class="form-control"
            id="titulo"
            placeholder="Título"
            required
          />
        </div>
        <div class="col-md-6">
          <label for="acionador" class="form-label">Acionador</label>
          <input
            type="text"
            class="form-control"
            id="acionador"
            placeholder="Acionador"
            required
          />
        </div>
      </div>
      <div class="mb-3">
        <label for="resposta" class="form-label">Resposta do chatbot</label>
        <textarea
          class="form-control"
          id="resposta"
          placeholder="Resposta"
          rows="4"
          required
        ></textarea>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="imagem" class="form-label">Imagem</label>
          <input
            type="file"
            class="form-control"
            id="imagem"
            accept="image/*"
          />
        </div>
        <div class="col-md-6">
          <label for="gif" class="form-label">GIF</label>
          <input
            type="file"
            class="form-control"
            id="gif"
            accept="image/gif"
          />
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="pdf" class="form-label">PDF</label>
          <input
            type="file"
            class="form-control"
            id="pdf"
            accept="application/pdf"
          />
        </div>
        <div class="col-md-6">
          <label for="audio" class="form-label">Áudio</label>
          <input
            type="file"
            class="form-control"
            id="audio"
            accept="audio/*"
          />
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="delay" class="form-label">Delay</label>
          <input
            type="number"
            class="form-control"
            id="delay"
            placeholder="Delay em ms"
          />
        </div>
        <div class="col-md-6">
          <label for="statusBot" class="form-label">Status do Bot</label>
          <select class="form-control" id="statusBot">
            <option value="normal">Normal</option>
            <option value="pausar">Pausar</option>
          </select>
        </div>
      </div>
      <div class="row mb-3">
        <div class="col-md-6">
          <label for="tempoPausa" class="form-label">Tempo de Pausa</label>
          <input
            type="number"
            class="form-control"
            id="tempoPausa"
            placeholder="Tempo de Pausa em segundos"
          />
        </div>
        <div class="col-md-6">
          <label for="tipoResposta" class="form-label">Tipo de Resposta</label>
          <select class="form-control" id="tipoResposta">
            <option value="unica">Única</option>
            <option value="multipla">Múltipla</option>
          </select>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
// Adicione lógica aqui, se necessário
</script>

<style scoped>
form {
  max-width: 700px;
  margin: 50px auto;
}
</style>
