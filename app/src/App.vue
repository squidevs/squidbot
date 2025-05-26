<template>
  <div class="row">
    <div class="col-3">
      <Sidebar @navigate="setPage" />
    </div>
    <div class="col-9">
      <!-- Componente para componentes -->
      <component :is="currentComponent" @navigate="setPage" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import Sidebar from "./components/Sidebar/sidebar.vue";
import Config from "./components/Config/config.vue";
import CrudForm from "./components/Forms/crudForm.vue";
import OptionsForm from './components/Forms/OptionsForm/optionsForm.vue';
import ScheduleMessage from './components/ScheduleMessage/ScheduleMessage.vue';

export default {
  name: "App",
  components: {
    Sidebar,
    Config,
    CrudForm,
    OptionsForm,
    ScheduleMessage,
  },
  setup() {
    const currentComponent = ref("Config");

    const setPage = (pageName) => {
      currentComponent.value = pageName;
    };

    return {
      currentComponent,
      setPage,
    };
  },
};
</script>
