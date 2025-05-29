<script setup>
import { ref } from "vue";
import "./sidebar.css";

defineProps({
  msg: String,
});

// Estado do submenu
const submenuOpen = ref(false);

// Função para fechar o submenu após a navegação
const handleNavigation = (page) => {
  // Fechar o menu collapse após a navegação
  const menuCollapse = document.getElementById("menu-collapse");
  if (menuCollapse) {
    menuCollapse.classList.remove("show");
  }
  // Emitir o evento de navegação
  emit("navigate", page);
};

const emit = defineEmits(["navigate"]);

const disconnect = () => {};
</script>

<template>
  <div class="sidebar">
    <a href="#"
      ><img src="../../assets/logotipo.png" width="250" alt="Squidev"
    /></a>
    <hr />
    <ul class="nav-pills flex-column mb-auto list-unstyled">
      <li @click="$emit('navigate', 'Config')">
        <i class="bi bi-gear"></i> Configurações
      </li>
      <!-- Submenu com collapse -->
      <ul class="list-unstyled">
        <li>
          <a
            class="collapsed d-block text-decoration-none bi bi-chat"
            data-bs-toggle="collapse"
            href="#menu-collapse"
            role="button"
            aria-expanded="false"
            aria-controls="menu-collapse"
          >
            Menu de opções
          </a>

          <div class="collapse" id="menu-collapse">
            <ul class="list-unstyled ms-3">
              <li
                class="cursor-pointer"
                @click="handleNavigation('optionsForm')"
              >
                <i class="bi bi-plus m-1"></i>Novo
              </li>
              <li class="cursor-pointer" @click="handleNavigation('CrudForm')">
                <i class="bi bi-eye m-1"></i>Ver
              </li>
              <li class="cursor-pointer" @click="handleNavigation('GerenciadorRespostas')">
                <i class="bi bi-eye m-1"></i>emoji
              </li>
              <li class="cursor-pointer" @click="handleNavigation('emojiPicker')">
                <i class="bi bi-eye m-1"></i>filep
              </li>
                            <li class="cursor-pointer" @click="handleNavigation('folePreview')">
                <i class="bi bi-eye m-1"></i>filep
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <li class="nav-item" @click="$emit('navigate', 'ScheduleMessage')">
        <i class="bi bi-clock"></i> Agendar mensagem
      </li>
    </ul>
    <hr />
    <div class="dropdown">
      <a
        href="#"
        class="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
        id="dropdownUser1"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <img
          src="../../assets/logo.png"
          alt=""
          width="32"
          height="32"
          class="rounded-circle me-2"
        />
        <strong>Squidev</strong>
      </a>
      <ul
        class="dropdown-menu text-small shadow"
        aria-labelledby="dropdownUser1"
      >
        <li>
          <b
            ><a class="dropdown-item text-danger" href="#" @click="disconnect"
              >Desconectar</a
            ></b
          >
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.nav-pills li {
  cursor: pointer;
  padding: 0.5rem 1rem;
  color: #fff;
  transition: background-color 0.2s;
}

.nav-pills li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.collapsed {
  cursor: pointer;
  padding: 0.5rem 1rem;
  color: #fff;
}

.collapsed:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

#menu-collapse {
  color: #fff;
}

#menu-collapse li {
  padding: 0.5rem 1rem;
  transition: background-color 0.2s;
}

#menu-collapse li:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.25rem;
}
</style>
