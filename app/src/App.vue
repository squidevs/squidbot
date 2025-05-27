<template>
  <div class="row">
    <div class="col-3">
      <Sidebar @navigate="setPage" />
    </div>
    <div class="col-9">
      <component 
        :is="currentComponent" 
        :resposta-para-editar="currentEditItem"
        @navigate="setPage" 
      />
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
import GerenciadorRespostas from './components/Config/GerenciadorRespostas.vue';

export default {
  name: "App",
  components: {
    Sidebar,
    Config,
    CrudForm,
    OptionsForm,
    ScheduleMessage,
    GerenciadorRespostas,
  },
  setup() {
    const currentComponent = ref("Config");
    const currentEditItem = ref(null);

    const setPage = (pageName, editItem = null) => {
      currentComponent.value = pageName;
      currentEditItem.value = editItem;
    };

    return {
      currentComponent,
      currentEditItem,
      setPage,
    };
  },
};
</script>

<style>
.row {
  margin: 0;
  height: 100vh;
}

.col-9 {
  padding: 2rem;
}
</style>
