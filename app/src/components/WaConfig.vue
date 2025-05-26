<script setup>
import { ref } from "vue";
import data from "../data.json";

const qrCode = ref(null);
const expectedMessage = ref("");
const botResponse = ref("");
const successMessage = ref("");

function execute() {
  console.log("Executar");
  // Lógica para executar o wppconnectExample.js
}

function reset() {
  console.log("Resetar");
  // Lógica para resetar
}

function shutdown() {
  console.log("Desligar");
  // Lógica para desligar
}

function saveData() {
  data.expectedMessages.push(expectedMessage.value);
  data.botResponses.push(botResponse.value);
  successMessage.value = "Dados salvos com sucesso!";
  setTimeout(() => (successMessage.value = ""), 3000);
}
</script>

<template>
  <div class="layout">
    <div class="control-panel">
      <div class="left-panel">
        <h1>Painel de Controle</h1>

        <!-- <div class="p-3">
          <button class="btn btn-primary m-1" @click="execute">Executar</button>
          <button class="btn btn-secondary m-1" @click="reset">Resetar</button>
          <button class="btn btn-danger m-1" @click="shutdown">Desligar</button>
        </div> -->

        <label class="form-label">Permitir respostas para grupos?</label><br />
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="mensagensParaGrupos"
            name="mensagensParaGrupos"
          />
          <label class="form-check-label" for="mensagensParaGrupos"
            >Ativar</label
          >
        </div>
        <label class="form-label">Mostrar digitando</label><br />
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="mensagensParaGrupos"
            name="mensagensParaGrupos"
          />
          <label class="form-check-label" for="mensagensParaGrupos"
            >Ativar</label
          >
        </div>

        <label class="form-label">Mostrar Gravando audio</label><br />
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="mensagensParaGrupos"
            name="mensagensParaGrupos"
          />
          <label class="form-check-label" for="mensagensParaGrupos"
            >Ativar</label
          >
        </div>

        
        <!-- <form @submit.prevent="saveData">
          <div class="form-group">
            <label for="expectedMessage">Mensagem Esperada (Cliente):</label>
            <input id="expectedMessage" v-model="expectedMessage" type="text" />
          </div>
          <div>
            <label for="botResponse">Resposta (Bot):</label>
            <input id="botResponse" v-model="botResponse" type="text" />
          </div>
          <button class="btn btn-success" type="submit">Salvar</button>
        </form> -->

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </div>

      <div class="right-panel">
        <h2>QR Code</h2>
        <p>Escaneie o QR Code para conectar ao WhatsApp Web.</p>
        <img
          :src="
            qrCode ||
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReXB6tvgHUw7BV-VIRDiLRjQDhFepQsGNxWA&s'
          "
          alt="QR Code"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
}

.sidebar {
  width: 200px;
  background-color: #343a40;
  color: white;
  padding: 20px;
}

.sidebar h2 {
  color: #fff;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin: 10px 0;
  cursor: pointer;
}

.sidebar li:hover {
  text-decoration: underline;
}

.control-panel {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 20px;
}

.left-panel {
  flex: 1;
  margin-right: 20px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.success-message {
  color: green;
  font-weight: bold;
}
</style>
