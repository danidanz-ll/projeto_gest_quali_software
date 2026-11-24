import { filtrarTarefas, formatarPendencias, TodoStore } from './store.js';
import { FocusStore } from './focus-store.js';
import { limparTarefaInexistente } from './focus-session.js';
import { PomodoroTimer } from './pomodoro.js';

const store = new TodoStore();
const focusStore = new FocusStore();
function validarTarefa(taskId) {
  return store.estaDisponivel(taskId);
}
const sessaoPersistida = focusStore.carregar();
const sessaoRecuperada = limparTarefaInexistente(sessaoPersistida, store.listar());
if (sessaoRecuperada !== sessaoPersistida) {
  focusStore.salvar(sessaoRecuperada);
}
const pomodoro = new PomodoroTimer({
  session: sessaoRecuperada,
  validarTarefa,
});
const estadoInicialFoco = pomodoro.obterEstado();
if (JSON.stringify(estadoInicialFoco) !== JSON.stringify(sessaoPersistida)) {
  focusStore.salvar(estadoInicialFoco);
}
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const filters = document.querySelector('#todo-filters');
const toggleAll = document.querySelector('#toggle-all');
const pendingCount = document.querySelector('#pending-count');
const focusTimer = document.querySelector('#focus-timer');
const focusType = document.querySelector('#focus-type');
const focusStatus = document.querySelector('#focus-status');
const focusTaskSelect = document.querySelector('#focus-task-select');
const focusMessage = document.querySelector('#focus-message');
const focusCount = document.querySelector('#focus-count');
const focusStart = document.querySelector('#focus-start');
const focusPause = document.querySelector('#focus-pause');
const focusResume = document.querySelector('#focus-resume');
const focusReset = document.querySelector('#focus-reset');
const clearCompleted = document.querySelector('#clear-completed');
const focusNext = document.querySelector('#focus-next');

const rotulosTipoFoco = {
  focus: 'Foco',
  shortBreak: 'Pausa curta',
  longBreak: 'Pausa longa',
};

const rotulosEstadoFoco = {
  idle: 'Pronto para iniciar',
  running: 'Sessão em andamento',
  paused: 'Sessão pausada',
  completed: 'Sessão finalizada',
};

let estadoFocoAnterior = null;

function formatarTempo(ms) {
  const segundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

function renderizarFoco() {
  const sessao = pomodoro.obterEstado();
  focusTimer.textContent = formatarTempo(sessao.remainingMs);
  focusTimer.setAttribute('aria-label', `Tempo restante: ${focusTimer.textContent}`);
  focusType.textContent = rotulosTipoFoco[sessao.type];
  focusStatus.textContent = sessao.status === 'completed'
    ? `${rotulosEstadoFoco.completed} · ${rotulosTipoFoco[sessao.nextType]} disponível`
    : sessao.status === 'idle'
      ? `${rotulosTipoFoco[sessao.type]} disponível`
      : rotulosEstadoFoco[sessao.status];
  focusCount.textContent = `Focos concluídos: ${sessao.focusSessionsCompleted}`;
  focusTaskSelect.disabled = sessao.type !== 'focus' || sessao.status !== 'idle';
  focusStart.disabled = sessao.status !== 'idle';
  focusPause.disabled = sessao.status !== 'running';
  focusResume.disabled = sessao.status !== 'paused';
  focusNext.disabled = sessao.status !== 'completed' || !sessao.nextType;

  if (sessao.status === 'completed' && estadoFocoAnterior !== 'completed') {
    focusStore.salvar(sessao);
  }
  estadoFocoAnterior = sessao.status;
}

function atualizarOpcoesTarefas(tarefas) {
  const sessao = pomodoro.obterEstado();
  focusTaskSelect.replaceChildren();

  const semTarefa = document.createElement('option');
  semTarefa.value = '';
  semTarefa.textContent = 'Sem tarefa';
  focusTaskSelect.append(semTarefa);

  for (const tarefa of tarefas.filter((item) => validarTarefa(item.id))) {
    const option = document.createElement('option');
    option.value = tarefa.id;
    option.textContent = tarefa.titulo;
    focusTaskSelect.append(option);
  }

  focusTaskSelect.value = sessao.taskId ?? '';
}

function mostrarMensagemFoco(mensagem) {
  focusMessage.textContent = mensagem;
  focusMessage.hidden = mensagem.length === 0;
}

function desassociarTarefaAntesDeRemover(taskId) {
  const sessao = pomodoro.obterEstado();
  if (sessao.taskId !== taskId) return true;

  if (sessao.status !== 'idle' || !pomodoro.desassociarTarefa()) {
    mostrarMensagemFoco('Não é possível remover a tarefa associada enquanto a sessão não estiver parada.');
    return false;
  }

  focusStore.salvar(pomodoro.obterEstado());
  renderizarFoco();
  return true;
}

function executarAcaoFoco(acao) {
  const sucesso = pomodoro[acao]();
  if (sucesso) {
    focusStore.salvar(pomodoro.obterEstado());
    if (acao === 'iniciar') {
      mostrarMensagemFoco('');
    }
  } else if (acao === 'iniciar') {
    const sessao = pomodoro.obterEstado();
    if (
      sessao.type === 'focus'
      && sessao.status === 'idle'
      && !validarTarefa(sessao.taskId)
    ) {
      mostrarMensagemFoco('Selecione uma tarefa pendente para iniciar o foco.');
    }
  }
  renderizarFoco();
}

focusStart.addEventListener('click', () => executarAcaoFoco('iniciar'));
focusPause.addEventListener('click', () => executarAcaoFoco('pausar'));
focusResume.addEventListener('click', () => executarAcaoFoco('retomar'));
focusReset.addEventListener('click', () => executarAcaoFoco('reiniciar'));
focusNext.addEventListener('click', () => executarAcaoFoco('iniciarProximaEtapa'));
focusTaskSelect.addEventListener('change', () => {
  const taskId = focusTaskSelect.value;
  const sessao = pomodoro.obterEstado();
  let associacaoAtualizada = false;

  if (sessao.type !== 'focus' || sessao.status !== 'idle') {
    mostrarMensagemFoco('A tarefa só pode ser alterada em uma sessão de foco parada.');
  } else if (taskId.length === 0) {
    associacaoAtualizada = pomodoro.desassociarTarefa();
  } else if (validarTarefa(taskId)) {
    associacaoAtualizada = pomodoro.associarTarefa(taskId);
  } else {
    mostrarMensagemFoco('A tarefa selecionada não existe mais.');
  }

  if (associacaoAtualizada) {
    mostrarMensagemFoco('');
    focusStore.salvar(pomodoro.obterEstado());
  } else {
    const estadoAtual = pomodoro.obterEstado();
    focusTaskSelect.value = estadoAtual.taskId ?? '';
    if (focusMessage.hidden) {
      mostrarMensagemFoco('Não foi possível atualizar a tarefa associada.');
    }
  }
  renderizarFoco();
});
document.addEventListener('visibilitychange', renderizarFoco);
setInterval(renderizarFoco, 1000);

function render() {
  const todasTarefas = store.listar();
  const rota = ['#/active', '#/completed'].includes(window.location.hash)
    ? window.location.hash
    : '#/';

  const tarefas = filtrarTarefas(todasTarefas, rota);

  list.replaceChildren();
  emptyState.hidden = tarefas.length > 0;
  emptyState.textContent = todasTarefas.length === 0
    ? 'Nenhuma tarefa ainda. Comece com um critério claro.'
    : 'Nenhuma tarefa neste filtro.';
  toggleAll.disabled = todasTarefas.length === 0;
  toggleAll.textContent = todasTarefas.length > 0 && todasTarefas.every((tarefa) => tarefa.concluida)
    ? 'Reabrir todas'
    : 'Concluir todas';
  clearCompleted.disabled = !todasTarefas.some((tarefa) => tarefa.concluida);
  atualizarOpcoesTarefas(todasTarefas);

  for (const link of filters.querySelectorAll('a')) {
    if (link.hash === rota) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  pendingCount.textContent = formatarPendencias(todasTarefas);

  for (const tarefa of tarefas) {
    const item = document.createElement('li');
    item.className = `todo ${tarefa.concluida ? 'todo--done' : ''}`;
    item.dataset.id = tarefa.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tarefa.concluida;
    checkbox.setAttribute('aria-label', `Marcar ${tarefa.titulo} como concluída`);
    checkbox.addEventListener('change', () => {
      store.alternar(tarefa.id);
      render();
    });

    const title = document.createElement('span');
    title.textContent = tarefa.titulo;
    title.addEventListener('dblclick', () => {
      ativarEdicao(item, tarefa.id, title);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remover';
    remove.setAttribute('aria-label', `Remover ${tarefa.titulo}`);
    remove.addEventListener('click', () => {
      if (!desassociarTarefaAntesDeRemover(tarefa.id)) return;
      mostrarMensagemFoco('');
      store.remover(tarefa.id);
      render();
      renderizarFoco();
    });

    item.append(checkbox, title, remove);
    list.append(item);
  }
}

function ativarEdicao(item, id, titleElement) {
  const tituloOriginal = titleElement.textContent;
  const inputEdicao = document.createElement('input');
  inputEdicao.type = 'text';
  inputEdicao.value = tituloOriginal;
  inputEdicao.className = 'todo-edit';
  inputEdicao.setAttribute('aria-label', `Editar tarefa ${tituloOriginal}`);
  inputEdicao.setAttribute('maxlength', '200');

  let finalizado = false;

  const confirmarEdicao = (cancelar = false) => {
    if (finalizado) return;
    finalizado = true;

    if (cancelar) {
      titleElement.textContent = tituloOriginal;
      item.replaceChild(titleElement, inputEdicao);
      return;
    }

    const valor = inputEdicao.value.trim();
    if (valor.length === 0) {
      titleElement.textContent = tituloOriginal;
      item.replaceChild(titleElement, inputEdicao);
      return;
    }

    const atualizado = store.atualizarTitulo(id, valor);
    titleElement.textContent = atualizado ? valor : tituloOriginal;
    item.replaceChild(titleElement, inputEdicao);

    if (atualizado) {
      render();
    }
  };

  item.replaceChild(inputEdicao, titleElement);
  inputEdicao.focus();
  inputEdicao.select();

  inputEdicao.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmarEdicao(false);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      confirmarEdicao(true);
    }
  });

  inputEdicao.addEventListener('blur', () => {
    confirmarEdicao(false);
  }, { once: true });
}

window.addEventListener('hashchange', render);

toggleAll.addEventListener('click', () => {
  store.alternarTodas();
  render();
});

clearCompleted.addEventListener('click', () => {
  const tarefasConcluidas = store.listar().filter((tarefa) => tarefa.concluida);
  const sessao = pomodoro.obterEstado();
  if (sessao.taskId && tarefasConcluidas.some((tarefa) => tarefa.id === sessao.taskId)) {
    if (!desassociarTarefaAntesDeRemover(sessao.taskId)) return;
  }

  mostrarMensagemFoco('');
  store.removerConcluidas();
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const tarefa = store.adicionar(input.value);
  if (!tarefa) return;
  input.value = '';
  input.focus();
  render();
  renderizarFoco();
});

render();
