import { filtrarTarefas, formatarPendencias, TodoStore } from './store.js';
import { FocusStore } from './focus-store.js';
import { PomodoroTimer } from './pomodoro.js';

const store = new TodoStore();
const focusStore = new FocusStore();
const pomodoro = new PomodoroTimer({ session: focusStore.carregar() });
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
const focusCount = document.querySelector('#focus-count');
const focusStart = document.querySelector('#focus-start');
const focusPause = document.querySelector('#focus-pause');
const focusResume = document.querySelector('#focus-resume');
const focusReset = document.querySelector('#focus-reset');
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
  focusStart.disabled = sessao.status !== 'idle';
  focusPause.disabled = sessao.status !== 'running';
  focusResume.disabled = sessao.status !== 'paused';
  focusNext.disabled = sessao.status !== 'completed' || !sessao.nextType;

  if (sessao.status === 'completed' && estadoFocoAnterior !== 'completed') {
    focusStore.salvar(sessao);
  }
  estadoFocoAnterior = sessao.status;
}

function executarAcaoFoco(acao) {
  if (pomodoro[acao]()) {
    focusStore.salvar(pomodoro.obterEstado());
  }
  renderizarFoco();
}

focusStart.addEventListener('click', () => executarAcaoFoco('iniciar'));
focusPause.addEventListener('click', () => executarAcaoFoco('pausar'));
focusResume.addEventListener('click', () => executarAcaoFoco('retomar'));
focusReset.addEventListener('click', () => executarAcaoFoco('reiniciar'));
focusNext.addEventListener('click', () => executarAcaoFoco('iniciarProximaEtapa'));
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
      store.remover(tarefa.id);
      render();
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
