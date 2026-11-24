import assert from 'node:assert/strict';
import test from 'node:test';

function criarElemento() {
  const listeners = new Map();
  return {
    children: [],
    dataset: {},
    hidden: false,
    disabled: false,
    value: '',
    append(...elementos) {
      this.children.push(...elementos);
    },
    replaceChildren(...elementos) {
      this.children = [...elementos];
    },
    addEventListener(tipo, listener) {
      const callbacks = listeners.get(tipo) ?? [];
      callbacks.push(listener);
      listeners.set(tipo, callbacks);
    },
    dispatch(tipo, event = {}) {
      for (const listener of listeners.get(tipo) ?? []) {
        listener({ preventDefault() {}, ...event });
      }
    },
    setAttribute() {},
    removeAttribute() {},
    querySelectorAll() {
      return [];
    },
  };
}

test('exibe orientação sem tarefa e lista apenas tarefas disponíveis', async (context) => {
  const descritoresOriginais = new Map(
    ['document', 'window', 'localStorage', 'setInterval'].map((nome) => [
      nome,
      Object.getOwnPropertyDescriptor(globalThis, nome),
    ]),
  );
  const restaurarGlobal = (nome) => {
    const descritor = descritoresOriginais.get(nome);
    if (descritor) {
      Object.defineProperty(globalThis, nome, descritor);
    } else {
      delete globalThis[nome];
    }
  };
  context.after(() => {
    for (const nome of descritoresOriginais.keys()) restaurarGlobal(nome);
  });

  const tarefas = [
    { id: 'pendente', titulo: 'Tarefa pendente', concluida: false },
    { id: 'concluida', titulo: 'Tarefa concluída', concluida: true },
  ];
  const dados = new Map([['todolab:tarefas', JSON.stringify(tarefas)]]);
  globalThis.localStorage = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };

  const ids = [
    'todo-form',
    'todo-input',
    'todo-list',
    'empty-state',
    'todo-filters',
    'toggle-all',
    'pending-count',
    'focus-timer',
    'focus-type',
    'focus-status',
    'focus-task-select',
    'focus-message',
    'focus-count',
    'focus-start',
    'focus-pause',
    'focus-resume',
    'focus-reset',
    'clear-completed',
    'focus-next',
  ];
  const elementos = new Map(ids.map((id) => [id, criarElemento()]));
  const links = ['#/', '#/active', '#/completed'].map((hash) => ({
    hash,
    setAttribute() {},
    removeAttribute() {},
  }));
  elementos.get('todo-filters').querySelectorAll = () => links;

  globalThis.document = {
    querySelector: (seletor) => elementos.get(seletor.slice(1)),
    createElement: () => criarElemento(),
    addEventListener() {},
  };
  globalThis.window = {
    location: { hash: '#/' },
    addEventListener() {},
  };
  globalThis.setInterval = () => 0;

  await import(`../src/app.js?focus-feedback-test=${Date.now()}`);

  const seletor = elementos.get('focus-task-select');
  const iniciar = elementos.get('focus-start');
  const mensagem = elementos.get('focus-message');
  const estado = elementos.get('focus-status');

  assert.deepEqual(
    seletor.children.map((option) => option.value),
    ['', 'pendente'],
  );

  iniciar.dispatch('click');
  assert.equal(mensagem.hidden, false);
  assert.match(mensagem.textContent, /selecione uma tarefa pendente/i);
  assert.equal(estado.textContent, 'Foco disponível');

  seletor.value = 'pendente';
  seletor.dispatch('change');
  iniciar.dispatch('click');

  assert.equal(mensagem.hidden, true);
  assert.equal(estado.textContent, 'Sessão em andamento');
});
