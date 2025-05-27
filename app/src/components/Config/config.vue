<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import "./config.css";

const qrCode = ref(null);
const ws = ref(null);
const isConnecting = ref(false);
const isConnected = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Função para limpar e processar a string base64 do QR code
function cleanBase64(base64String) {
  const cleanStr = base64String.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ""
  );
  return cleanStr.replace(/[\n\r\s]/g, "");
}

// Função para conectar ao WebSocket
function setupWebSocket() {
  try {
    ws.value = new WebSocket("ws://localhost:3000");

    ws.value.onopen = () => {
      console.log("WebSocket conectado");
      errorMessage.value = "";
    };

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Mensagem recebida:", data);

        switch (data.type) {
          case "qr":
            const cleanQR = cleanBase64(data.data);
            console.log("QR code limpo e processado");
            qrCode.value = `data:image/png;base64,${cleanQR}`;
            successMessage.value = "QR code gerado! Escaneie com seu WhatsApp.";
            errorMessage.value = "";
            isConnecting.value = true;
            isConnected.value = false;
            break;

          case "connected":
            isConnected.value = true;
            isConnecting.value = false;
            successMessage.value = "WhatsApp conectado com sucesso!";
            qrCode.value = null;
            break;

          case "status":
            if (data.data === "connected") {
              isConnected.value = true;
              isConnecting.value = false;
              successMessage.value = "WhatsApp conectado com sucesso!";
              qrCode.value = null;
            }
            break;

          default:
            console.log("Mensagem não tratada:", data);
        }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    };

    ws.value.onerror = (error) => {
      console.error("Erro WebSocket:", error);
      errorMessage.value = "Erro na conexão com o servidor";
    };

    ws.value.onclose = () => {
      console.log("WebSocket desconectado");
      setTimeout(setupWebSocket, 5000); // Tenta reconectar a cada 5 segundos
    };
  } catch (error) {
    console.error("Erro ao configurar WebSocket:", error);
    setTimeout(setupWebSocket, 5000);
  }
}

async function generateQRCode() {
  try {
    isConnecting.value = true;
    errorMessage.value = "";
    successMessage.value = "Conectando ao servidor...";

    const response = await fetch("http://localhost:3000/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Resposta do servidor:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.qrCode) {
      const cleanQR = cleanBase64(data.qrCode);
      qrCode.value = `data:image/png;base64,${cleanQR}`;
      successMessage.value = "QR code gerado! Escaneie com seu WhatsApp.";
    } else if (data.status === "already_connected") {
      isConnected.value = true;
      successMessage.value = "WhatsApp já está conectado!";
    } else {
      successMessage.value = "Aguardando QR code...";
    }
  } catch (error) {
    console.error("Erro:", error);
    errorMessage.value = `Erro: ${error.message}`;
    successMessage.value = "";
  } finally {
    isConnecting.value = false;
  }
}

// Dispara automaticamente ao carregar a página
onMounted(() => {
  setupWebSocket();
  generateQRCode(); // Gera o QR Code automaticamente
});

// Fecha a conexão WebSocket ao sair da página
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
            id="mostrarDigitando"
            name="mostrarDigitando"
          />
          <label class="form-check-label" for="mostrarDigitando">Ativar</label>
        </div>

        <label class="form-label">Mostrar Gravando audio</label><br />
        <div class="form-check form-switch">
          <input
            class="form-check-input"
            type="checkbox"
            id="mostrarGravando"
            name="mostrarGravando"
          />
          <label class="form-check-label" for="mostrarGravando">Ativar</label>
        </div>
      </div>

      <div class="right-panel">
        <h2>QR Code</h2>
        <p>Escaneie o QR Code abaixo com seu WhatsApp.</p>

        <div v-if="errorMessage" class="alert alert-danger mb-3">
          {{ errorMessage }}
        </div>

        <div v-if="qrCode" class="qr-container">
          <img :src="qrCode" alt="QR Code" class="qr-code" />
        </div>
        <div v-else-if="isConnecting" class="placeholder-box">
          <i class="bi bi-qr-code" style="font-size: 48px"></i>
          <p>Gerando QR Code...</p>
        </div>
        <div v-else-if="isConnected" class="placeholder-box success">
          <i
            class="bi bi-check-circle"
            style="font-size: 48px; color: #198754"
          ></i>
          <p>Chatbot conectado <br> ao whatsapp com sucesso!</p>
        </div>
        <div v-else class="placeholder-box">
          <i class="bi bi-qr-code" style="font-size: 48px"></i>
          <p>Aguardando QRcode ...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* (Seu CSS permanece o mesmo) */
</style>