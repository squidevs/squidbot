<template>
  <div class="container py-4">
    <h2 class="mb-3">Gerenciamento de Itens</h2>

    <!-- Botão de Adicionar -->
    <button class="btn btn-success rounded-pill px-2 m-1 " @click="$emit('navigate', 'OptionsForm')">
      <i class="bi bi-plus-circle"></i> Adicionar Item
    </button>

    <!-- Tabela de Listagem -->
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Descrição</th>
            <th class="text-center">Status</th>
            <th class="text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-start" v-for="item in itens" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.nome }}</td>
            <td>{{ item.descricao }}</td>
            <td class="text-center">
              <button class="btn btn-sm rounded-pill px-4 m-1" :class="item.ativo ? 'btn-success' : 'btn-secondary'" @click="toggleStatus(item)">{{ item.ativo ? 'Ativo' : 'Inativo' }}</button>
            </td>
            <td class="text-center">
              <button class="btn btn-sm btn-info rounded-pill px-2 m-1" @click="abrirDetalhes(item)"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-primary rounded-pill px-2 m-1" @click="abrirFormulario(item)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-danger rounded-pill px-2 m-1" @click="excluirItem(item.id)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Formulário -->
    <div class="modal fade" id="modalFormulario" tabindex="-1" aria-labelledby="modalFormularioLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioLabel">{{ itemEditando ? 'Editar Item' : 'Adicionar Item' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="salvarItem">
              <div class="mb-3">
                <label for="nome" class="form-label">Nome</label>
                <input type="text" id="nome" v-model="form.nome" class="form-control" required />
              </div>
              <div class="mb-3">
                <label for="descricao" class="form-label">Descrição</label>
                <textarea id="descricao" v-model="form.descricao" class="form-control" rows="3" required></textarea>
              </div>
              <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="ativo" v-model="form.ativo" />
                <label class="form-check-label" for="ativo">Ativo</label>
              </div>
              <button type="submit" class="btn btn-primary">Salvar</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Detalhes -->
    <div class="modal fade" id="modalDetalhes" tabindex="-1" aria-labelledby="modalDetalhesLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalDetalhesLabel">Detalhes do Item</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p><strong>ID:</strong> {{ itemDetalhes?.id }}</p>
            <p><strong>Nome:</strong> {{ itemDetalhes?.nome }}</p>
            <p><strong>Descrição:</strong> {{ itemDetalhes?.descricao }}</p>
            <p><strong>Status:</strong> {{ itemDetalhes?.ativo ? 'Ativo' : 'Inativo' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import Option from "./OptionsForm/optionsForm.vue";

export default {
  name: 'CrudForm',
  components: {
    Option,
  },
  setup() {
    const itens = ref([
      { id: 1, nome: 'Item 1', descricao: 'Descrição do Item 1', ativo: true },
      { id: 2, nome: 'Item 2', descricao: 'Descrição do Item 2', ativo: false },
    ]);

    const form = ref({ id: null, nome: '', descricao: '', ativo: false });
    const itemEditando = ref(null);
    const itemDetalhes = ref(null);

    const abrirFormulario = (item = null) => {
      if (item) {
        form.value = { ...item };
        itemEditando.value = item;
      } else {
        form.value = { id: null, nome: '', descricao: '', ativo: false };
        itemEditando.value = null;
      }
      const modal = new bootstrap.Modal(document.getElementById('modalFormulario'));
      modal.show();
    };

    const abrirDetalhes = (item) => {
      itemDetalhes.value = item;
      const modal = new bootstrap.Modal(document.getElementById('modalDetalhes'));
      modal.show();
    };

    const salvarItem = () => {
      if (itemEditando.value) {
        const index = itens.value.findIndex((i) => i.id === itemEditando.value.id);
        if (index !== -1) itens.value[index] = { ...form.value };
      } else {
        const novoId = itens.value.length ? Math.max(...itens.value.map((i) => i.id)) + 1 : 1;
        itens.value.push({ ...form.value, id: novoId });
      }
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalFormulario'));
      modal.hide();
    };

    const excluirItem = (id) => {
      itens.value = itens.value.filter((item) => item.id !== id);
    };

    const toggleStatus = (item) => {
      item.ativo = !item.ativo;
    };

    onMounted(() => {
      if (!window.bootstrap) {
        console.error('Bootstrap JS não está carregado. Verifique a inclusão do arquivo.');
      } else {
        console.log('Bootstrap JS carregado com sucesso.');
      }
    });

    return {
      itens,
      form,
      itemEditando,
      itemDetalhes,
      abrirFormulario,
      abrirDetalhes,
      salvarItem,
      excluirItem,
      toggleStatus,
    };
  },
};
</script>

<script setup>
import { ref, onMounted } from "vue";
import * as bootstrap from 'bootstrap';

const itens = ref([
  { id: 1, nome: "Item 1", descricao: "Descrição do Item 1", ativo: true },
  { id: 2, nome: "Item 2", descricao: "Descrição do Item 2", ativo: false },
]);

const form = ref({ id: null, nome: "", descricao: "", ativo: false });
const itemEditando = ref(null);
const itemDetalhes = ref(null);

const abrirFormulario = (item = null) => {
  if (item) {
    form.value = { ...item };
    itemEditando.value = item;
  } else {
    form.value = { id: null, nome: "", descricao: "", ativo: false };
    itemEditando.value = null;
  }
  const modalFormulario = new bootstrap.Modal(document.getElementById("modalFormulario"));
  modalFormulario.show();
};

const abrirDetalhes = (item) => {
  itemDetalhes.value = item;
  const modalDetalhes = new bootstrap.Modal(document.getElementById("modalDetalhes"));
  modalDetalhes.show();
};

const salvarItem = () => {
  if (itemEditando.value) {
    const index = itens.value.findIndex((i) => i.id === itemEditando.value.id);
    if (index !== -1) itens.value[index] = { ...form.value };
  } else {
    const novoId = itens.value.length ? Math.max(...itens.value.map((i) => i.id)) + 1 : 1;
    itens.value.push({ ...form.value, id: novoId });
  }
  const modalFormulario = bootstrap.Modal.getInstance(document.getElementById("modalFormulario"));
  if (modalFormulario) {
    modalFormulario.hide();
  }
};

const excluirItem = (id) => {
  itens.value = itens.value.filter((item) => item.id !== id);
};

const toggleStatus = (item) => {
  item.ativo = !item.ativo;
};

onMounted(() => {
  if (!window.bootstrap) {
    console.error("Bootstrap JS não está carregado. Verifique a inclusão do arquivo.");
  } else {
    console.log("Bootstrap JS carregado com sucesso.");
  }
});
</script>

<style scoped>
.table {
  margin-top: 20px;
}
</style>