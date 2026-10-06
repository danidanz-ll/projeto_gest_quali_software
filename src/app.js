import { filtrarTarefas, formatarPendencias, TodoStore } from './store.js';

const store = new TodoStore();
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const filters = document.querySelector('#todo-filters');
const pendingCount = document.querySelector('#pending-count');

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

  for (const link of filters.querySelectorAll('a')) {
    if (link.hash === rota) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  pendingCount.textContent = formatarPendencias(tarefas);

  for (const tarefa of tarefas) {
    const item = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tarefa.concluida;

    const label = document.createElement('label');
    label.textContent = tarefa.titulo;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Excluir';

    item.append(checkbox, label, button);
    list.append(item);
  }
}

window.addEventListener('hashchange', render);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const tarefa = store.adicionar(input.value);
  input.value = '';
  render();
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

window.addEventListener('hashchange', render);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const tarefa = store.adicionar(input.value);
  if (!tarefa) return;
  input.value = '';
  input.focus();
  render();
});

render();
