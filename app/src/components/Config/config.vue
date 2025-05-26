<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import './config.css';

const qrCode = ref(null);
const ws = ref(null);
const isConnecting = ref(false);
const isConnected = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Função para limpar e processar a string base64 do QR code
function cleanBase64(base64String) {
  // Remove cabeçalhos de data URL se existirem
  const cleanStr = base64String.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  // Remove caracteres inválidos
  return cleanStr.replace(/[\n\r\s]/g, '');
}

// Função para conectar ao WebSocket
function setupWebSocket() {
  try {
    ws.value = new WebSocket('ws://localhost:3000');
    
    ws.value.onopen = () => {
      console.log('WebSocket conectado');
      errorMessage.value = "";
    };
    
    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Mensagem recebida:', data);
        
        switch (data.type) {
          case 'qr':
            const cleanQR = cleanBase64(data.data);
            console.log('QR code limpo e processado'); // Debug
            qrCode.value = `data:image/png;base64,${cleanQR}`;
            successMessage.value = "QR code gerado! Escaneie com seu WhatsApp.";
            errorMessage.value = "";
            isConnecting.value = true;
            isConnected.value = false;
            break;
            
          case 'connected':
            isConnected.value = true;
            isConnecting.value = false;
            successMessage.value = "WhatsApp conectado com sucesso!";
            qrCode.value = null;
            break;
            
          case 'status':
            if (data.data === 'connected') {
              isConnected.value = true;
              isConnecting.value = false;
              successMessage.value = "WhatsApp conectado com sucesso!";
              qrCode.value = null;
            }
            break;
            
          default:
            console.log('Mensagem não tratada:', data);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };
    
    ws.value.onerror = (error) => {
      console.error('Erro WebSocket:', error);
      errorMessage.value = "Erro na conexão com o servidor";
    };
    
    ws.value.onclose = () => {
      console.log('WebSocket desconectado');
      setTimeout(setupWebSocket, 5000); // Tenta reconectar a cada 5 segundos
    };
  } catch (error) {
    console.error('Erro ao configurar WebSocket:', error);
    setTimeout(setupWebSocket, 5000);
  }
}

async function generateQRCode() {
  try {
    isConnecting.value = true;
    errorMessage.value = "";
    successMessage.value = "Conectando ao servidor...";
    
    const response = await fetch('http://localhost:3000/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Resposta do servidor:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (data.qrCode) {
      const cleanQR = cleanBase64(data.qrCode);
      qrCode.value = `data:image/png;base64,${cleanQR}`;
      successMessage.value = "QR code gerado! Escaneie com seu WhatsApp.";
    } else if (data.status === 'already_connected') {
      isConnected.value = true;
      successMessage.value = "WhatsApp já está conectado!";
    } else {
      successMessage.value = "Aguardando QR code...";
    }
  } catch (error) {
    console.error('Erro:', error);
    errorMessage.value = `Erro: ${error.message}`;
    successMessage.value = "";
  } finally {
    isConnecting.value = false;
  }
}

onMounted(() => {
  setupWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    ws.value.close();
  }
});
</script>

<template>
  <div class="">
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
      </div>      <div class="right-panel">
        <h2>QR Code</h2>
        <p>Clique no botão abaixo para gerar um novo QR Code e depois escaneie com seu WhatsApp.</p>
        
        <button 
          class="btn btn-primary mb-3" 
          @click="generateQRCode"
          :disabled="isConnecting || isConnected"
        >
          {{ isConnecting ? 'Conectando...' : isConnected ? 'Conectado' : 'Gerar QR Code' }}
        </button>

        <div v-if="successMessage" class="alert alert-info mb-3">
          {{ successMessage }}
        </div>

        <div v-if="errorMessage" class="alert alert-danger mb-3">
          {{ errorMessage }}
        </div>

        <div v-if="qrCode" class="qr-container">
          <img
            :src="qrCode"
            alt="QR Code"
            class="qr-code"
          />
        </div>
        <div v-else-if="!isConnected" class="placeholder-box">
          <i class="bi bi-qr-code" style="font-size: 48px;"></i>
          <p>Clique no botão acima para gerar o QR Code</p>
        </div>
        <div v-else class="placeholder-box success">
          <i class="bi bi-check-circle" style="font-size: 48px; color: #198754;"></i>
          <p>WhatsApp conectado com sucesso!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.control-panel {
  display: flex;
  justify-content: space-between;
  padding: 30px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  gap: 40px;
}

.left-panel {
  flex: 1;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 20px 0;
  perspective: 1000px;
}

.qr-code {
  max-width: 300px;
  width: 100%;
  height: auto;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.qr-code:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.placeholder-box {
  width: 300px;
  height: 300px;
  border: 2px dashed #ddd;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.placeholder-box.success {
  border: none;
  background-color: #e8f5e9;
  color: #1b5e20;
}

.placeholder-box i {
  margin-bottom: 15px;
  transition: transform 0.3s ease;
}

.placeholder-box:hover i {
  transform: scale(1.1);
}

.placeholder-box p {
  margin-top: 15px;
  text-align: center;
  font-size: 1.1em;
}

.alert {
  width: 100%;
  max-width: 300px;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: none;
}

.alert-info {
  background-color: #e3f2fd;
  color: #0d47a1;
}

.alert-danger {
  background-color: #ffebee;
  color: #c62828;
}

.form-check {
  margin-bottom: 1.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  font-size: 1.1em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>

