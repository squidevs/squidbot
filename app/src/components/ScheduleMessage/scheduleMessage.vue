<template>
  <div class="container py-4">
    <h2 class="mb-3">Agendamentos</h2>
    <button
      class="btn btn-success rounded-pill px-2 m-1 mb-3 bi-plus-circle m-1"
      @click="abrirFormulario()"
    >
      Agendamento
    </button>

    <table class="table table-bordered table-hover">
      <thead class="table-light">
        <tr>
          <th>ID</th>
          <th>Mensagem</th>
          <th>Data</th>
          <th>Hora</th>
          <th class="text-center">Ativo</th>
          <th class="text-center">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="agendamento in agendamentos" :key="agendamento.id">
          <td>{{ agendamento.id }}</td>
          <td>{{ agendamento.mensagem }}</td>
          <td>{{ formatarData(agendamento.data) }}</td>
          <td>{{ agendamento.hora }}</td>
          <td class="text-center">
            <button
              class="btn btn-sm rounded-pill px-4 m-1"
              :class="agendamento.ativo ? 'btn-success' : 'btn-secondary'"
              @click="toggleStatus(agendamento)"
            >
              {{ agendamento.ativo ? "Ativo" : "Inativo" }}
            </button>
          </td>
          <td class="text-center">
            <button
              class="btn btn-sm btn-primary rounded-pill px-2 m-1"
              @click="abrirFormulario(agendamento)"
            >
              <i class="bi bi-pencil"></i>
            </button>
            <button
              class="btn btn-sm btn-danger rounded-pill px-2 m-1"
              @click="confirmarExclusao(agendamento.id)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Formulário -->
    <div class="modal fade" id="modalFormulario" tabindex="-1">
      <div class="modal-dialog">
        <form
          class="modal-content needs-validation"
          novalidate
          @submit.prevent="salvarAgendamento"
        >
          <div class="modal-header">
            <h5 class="modal-title">
              {{ agendamentoEditando ? "Editar" : "Novo" }} Agendamento
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Mensagem</label>
              <input
                v-model="form.mensagem"
                type="text"
                class="form-control"
                required
              />
              <div class="invalid-feedback">Informe a mensagem.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Data</label>
              <input
                v-model="form.data"
                type="date"
                class="form-control"
                :min="dataMinima"
                required
              />
              <div class="invalid-feedback">Informe uma data válida.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Hora</label>
              <input
                v-model="form.hora"
                type="time"
                class="form-control"
                required
              />
              <div class="invalid-feedback">Informe a hora.</div>
            </div>
            <div class="form-check">
              <input
                v-model="form.ativo"
                type="checkbox"
                class="form-check-input"
                id="ativo"
              />
              <label class="form-check-label" for="ativo">Ativo</label>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmação -->
    <div class="modal fade" id="modalConfirmacao" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar Exclusão</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            Tem certeza de que deseja excluir este agendamento?
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button class="btn btn-danger" @click="confirmarExcluir">
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import * as bootstrap from "bootstrap";

const toggleStatus = (item) => {
  item.ativo = !item.ativo;
};

// Estados
const agendamentos = ref([
  {
    id: 1,
    mensagem: "Mensagem 1",
    data: "2025-05-26",
    hora: "10:00",
    ativo: true,
  },
  {
    id: 2,
    mensagem: "Mensagem 2",
    data: "2025-05-27",
    hora: "14:00",
    ativo: false,
  },
]);
const form = ref({ id: null, mensagem: "", data: "", hora: "", ativo: true });
const agendamentoEditando = ref(null);
const idParaExcluir = ref(null);

// Data mínima
const dataMinima = computed(() => {
  const hoje = new Date();
  return hoje.toISOString().split("T")[0];
});

// Métodos
const formatarData = (data) => {
  return new Date(data).toLocaleDateString("pt-BR");
};

const abrirFormulario = (agendamento = null) => {
  if (agendamento) {
    form.value = { ...agendamento };
    agendamentoEditando.value = agendamento;
  } else {
    form.value = { id: null, mensagem: "", data: "", hora: "", ativo: true };
    agendamentoEditando.value = null;
  }
  const modal = new bootstrap.Modal(document.getElementById("modalFormulario"));
  modal.show();
};

const salvarAgendamento = () => {
  const formulario = document.querySelector("#modalFormulario form");
  if (!formulario.checkValidity()) {
    formulario.classList.add("was-validated");
    return;
  }

  if (agendamentoEditando.value) {
    const index = agendamentos.value.findIndex(
      (a) => a.id === agendamentoEditando.value.id
    );
    if (index !== -1) agendamentos.value[index] = { ...form.value };
  } else {
    const novoId = agendamentos.value.length
      ? Math.max(...agendamentos.value.map((a) => a.id)) + 1
      : 1;
    agendamentos.value.push({ ...form.value, id: novoId });
  }

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("modalFormulario")
  );
  modal.hide();
  formulario.classList.remove("was-validated");
};

const confirmarExclusao = (id) => {
  idParaExcluir.value = id;
  const modal = new bootstrap.Modal(
    document.getElementById("modalConfirmacao")
  );
  modal.show();
};

const confirmarExcluir = () => {
  if (idParaExcluir.value !== null) {
    agendamentos.value = agendamentos.value.filter(
      (a) => a.id !== idParaExcluir.value
    );
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalConfirmacao")
    );
    modal.hide();
    idParaExcluir.value = null;
  }
};
</script>
