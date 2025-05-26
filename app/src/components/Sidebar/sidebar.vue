<script setup>
import { ref } from "vue";
import "./sidebar.css";
defineProps({
  msg: String,
});
const submenuOpen = ref(false);
const toggleSubmenu = () => {
  submenuOpen.value = !submenuOpen.value;
};

const count = ref(0);
</script>

<template>
  <div class="sidebar">
    <a
      href="/"
      class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none"
    >
      <svg class="bi me-2" width="40" height="32">
        <use xlink:href="#bootstrap"></use>
      </svg>
      <span class="fs-4">Squidev</span>
    </a>
    <hr />
    <ul class="nav-pills flex-column mb-auto">
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
                @click="$emit('navigate', 'OptionsForm')"
                class="cursor-pointer"
              >
                <i class="bi bi-plus m-1"></i>Novo
              </li>
              <li @click="$emit('navigate', 'CrudForm')" class="cursor-pointer">
                <i class="bi bi-eye m-1"></i>Ver
              </li>
            </ul>
          </div>
        </li>
      </ul>

      <li class="nav-item" @click="$emit('navigate', 'ScheduleMessage')">
        <i class="bi bi-clock"></i> Agendar mensagem
      </li>
      <li>
        <a href="#" class="nav-link text-white">
          <svg class="bi me-2" width="16" height="16">
            <use xlink:href="#people-circle"></use>
          </svg>
        </a>
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
    </div>
  </div>
</template>
