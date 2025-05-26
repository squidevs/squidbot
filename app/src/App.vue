<template>
  <div class="row">
    <div class="col-3">
      <Sidebar />
    </div>
    <div class="col-9">
      <Config />
    </div>
  </div>
</template>

<script>
import Sidebar from "./components/Sidebar/sidebar.vue";
import Config from "./components/Config/config.vue";

export default {
  name: "App",
  components: {
    Sidebar,
    Config,
  },
};
</script>
