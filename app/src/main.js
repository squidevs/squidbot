import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

// Importar CSS do Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
// Importar ícones do Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'
// Importar JS do Bootstrap (opcional, necessário para dropdowns, modals etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

createApp(App).mount('#app')
