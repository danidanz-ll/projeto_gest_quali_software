import assert from 'node:assert/strict';
import test from 'node:test';

let appTestInstance = 0;

function criarElemento() {
  const listeners = new Map();
  return {
    children: [],
    dataset: {},
    textContent: '',
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
    focus() {},
    select() {},
  };
}

async function prepararApp(context, { tarefas = [], sessao = null, confirmar = true } = {}) {
  const nomesGlobais = ['document', 'window', 'localStorage', 'setInterval'];
  const descritoresOriginais = new Map(
    nomesGlobais.map((nome) => [nome, Object.getOwnPropertyDescriptor(globalThis, nome)]),
  );
  const dateNowOriginal = Date.now;
  let agora = 1000;
  const restaurarGlobal = (nome) => {
    const descritor = descritoresOriginais.get(nome);
    if (descritor) {
      Object.defineProperty(globalThis, nome, descritor);
    } else {
      delete globalThis[nome];
    }
  };
  context.after(() => {
    for (const nome of nomesGlobais) restaurarGlobal(nome);
    Date.now = dateNowOriginal;
  });

  const dados = new Map([['todolab:tarefas', JSON.stringify(tarefas)]]);
  const gravacoes = new Map();
  let falharGravacaoTarefas = false;
  globalThis.localStorage = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => {
      if (chave === 'todolab:tarefas' && falharGravacaoTarefas) {
        throw new Error('Falha simulada de persistência.');
      }
      dados.set(chave, valor);
      gravacoes.set(chave, (gravacoes.get(chave) ?? 0) + 1);
    },
  };
  Date.now = () => agora;

  if (sessao) dados.set('todolab:pomodoro', JSON.stringify(sessao));

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
    'focus-task-associated',
    'focus-task-complete',
    'focus-task-completion-message',
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
  elementos.get('focus-task-complete').hidden = true;
  elementos.get('focus-task-completion-message').hidden = true;
  elementos.get('focus-message').hidden = true;
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
  const confirmacoes = [];
  globalThis.window = {
    location: { hash: '#/' },
    addEventListener() {},
    confirm: (mensagem) => {
      confirmacoes.push(mensagem);
      return confirmar;
    },
  };
  const intervalos = [];
  globalThis.setInterval = (callback) => {
    intervalos.push(callback);
    return intervalos.length;
  };

  appTestInstance += 1;
  await import(`../src/app.js?focus05-test=${appTestInstance}`);
  intervalos[0]();

  return {
    elementos,
    dados,
    gravacoes,
    confirmacoes,
    intervalos,
    definirAgora: (valor) => { agora = valor; },
    falharGravacaoTarefas: (valor) => { falharGravacaoTarefas = valor; },
  };
}

function criarSessao(status, taskId = 'tarefa-1') {
  const completed = status === 'completed';
  const paused = status === 'paused';
  return {
    status,
    type: 'focus',
    taskId,
    durationMs: 60_000,
    remainingMs: completed ? 0 : paused ? 20_000 : 60_000,
    endsAt: status === 'running' ? 61_000 : null,
    completedAt: completed ? 1000 : null,
    focusSessionsCompleted: completed ? 1 : 0,
    nextType: completed ? 'shortBreak' : null,
  };
}

function criarTarefa({ id = 'tarefa-1', concluida = false } = {}) {
  return { id, titulo: 'Preparar revisão', concluida };
}

test('mantém seletor, feedback de início e início válido da FOCUS-04', async (context) => {
  const app = await prepararApp(context, {
    tarefas: [
      criarTarefa(),
      { id: 'concluida', titulo: 'Tarefa concluída', concluida: true },
    ],
  });
  const { elementos } = app;
  const seletor = elementos.get('focus-task-select');
  const iniciar = elementos.get('focus-start');
  const mensagem = elementos.get('focus-message');
  const estado = elementos.get('focus-status');

  assert.deepEqual(
    seletor.children.map((option) => option.value),
    ['', 'tarefa-1'],
  );
  iniciar.dispatch('click');
  assert.equal(mensagem.hidden, false);
  assert.match(mensagem.textContent, /selecione uma tarefa pendente/i);
  assert.equal(estado.textContent, 'Foco disponível');

  seletor.value = 'tarefa-1';
  seletor.dispatch('change');
  iniciar.dispatch('click');

  assert.equal(mensagem.hidden, true);
  assert.equal(estado.textContent, 'Sessão em andamento');
});

for (const status of ['running', 'paused', 'completed']) {
  test(`conclui tarefa explicitamente durante sessão ${status} sem alterar o Pomodoro`, async (context) => {
    const app = await prepararApp(context, {
      tarefas: [criarTarefa()],
      sessao: criarSessao(status),
    });
    const { elementos, dados, gravacoes, confirmacoes } = app;
    const acaoConcluir = elementos.get('focus-task-complete');
    const tarefaAssociada = elementos.get('focus-task-associated');
    const mensagem = elementos.get('focus-task-completion-message');
    const timer = elementos.get('focus-timer');
    const estado = elementos.get('focus-status');
    const timerAntes = timer.textContent;
    const sessaoAntes = dados.get('todolab:pomodoro');
    const gravacoesTarefasAntes = gravacoes.get('todolab:tarefas') ?? 0;

    assert.equal(acaoConcluir.hidden, false);
    acaoConcluir.dispatch('click');

    assert.equal(confirmacoes.length, 1);
    assert.equal(gravacoes.get('todolab:tarefas'), gravacoesTarefasAntes + 1);
    assert.equal(JSON.parse(dados.get('todolab:tarefas'))[0].concluida, true);
    assert.equal(dados.get('todolab:pomodoro'), sessaoAntes);
    assert.equal(JSON.parse(dados.get('todolab:pomodoro')).taskId, 'tarefa-1');
    assert.equal(timer.textContent, timerAntes);
    assert.equal(estado.textContent, status === 'completed'
      ? 'Sessão finalizada · Pausa curta disponível'
      : status === 'paused'
        ? 'Sessão pausada'
        : 'Sessão em andamento');
    assert.match(tarefaAssociada.textContent, /Preparar revisão · Concluída/);
    assert.equal(acaoConcluir.hidden, true);
    assert.equal(mensagem.textContent, 'Tarefa concluída.');

    const writesAfterFirstClick = gravacoes.get('todolab:tarefas');
    acaoConcluir.dispatch('click');
    assert.equal(gravacoes.get('todolab:tarefas'), writesAfterFirstClick);
  });
}

test('cancelar confirmação não altera tarefa, sessão ou cronômetro', async (context) => {
  const app = await prepararApp(context, {
    tarefas: [criarTarefa()],
    sessao: criarSessao('running'),
    confirmar: false,
  });
  const { elementos, dados, gravacoes } = app;
  const acaoConcluir = elementos.get('focus-task-complete');
  const timer = elementos.get('focus-timer');
  const timerAntes = timer.textContent;
  const tarefaAntes = dados.get('todolab:tarefas');
  const sessaoAntes = dados.get('todolab:pomodoro');
  const gravacoesAntes = gravacoes.get('todolab:tarefas') ?? 0;

  acaoConcluir.dispatch('click');

  assert.equal(elementos.get('focus-task-completion-message').hidden, true);
  assert.equal(dados.get('todolab:tarefas'), tarefaAntes);
  assert.equal(dados.get('todolab:pomodoro'), sessaoAntes);
  assert.equal(timer.textContent, timerAntes);
  assert.equal(gravacoes.get('todolab:tarefas') ?? 0, gravacoesAntes);
});

test('falha de persistência não mostra sucesso nem muda o timer', async (context) => {
  const app = await prepararApp(context, {
    tarefas: [criarTarefa()],
    sessao: criarSessao('running'),
  });
  const { elementos, dados, falharGravacaoTarefas } = app;
  const erroOriginal = console.error;
  context.after(() => { console.error = erroOriginal; });
  console.error = () => {};

  const timerAntes = elementos.get('focus-timer').textContent;
  const sessaoAntes = dados.get('todolab:pomodoro');
  falharGravacaoTarefas(true);
  elementos.get('focus-task-complete').dispatch('click');

  assert.equal(JSON.parse(dados.get('todolab:tarefas'))[0].concluida, false);
  assert.equal(dados.get('todolab:pomodoro'), sessaoAntes);
  assert.equal(elementos.get('focus-timer').textContent, timerAntes);
  assert.match(
    elementos.get('focus-task-completion-message').textContent,
    /não foi possível salvar/i,
  );
});

test('tarefa já concluída permanece identificada e não oferece outra conclusão', async (context) => {
  const app = await prepararApp(context, {
    tarefas: [criarTarefa({ concluida: true })],
    sessao: criarSessao('completed'),
  });
  const { elementos, confirmacoes } = app;

  assert.match(elementos.get('focus-task-associated').textContent, /Preparar revisão · Concluída/);
  assert.equal(elementos.get('focus-task-complete').hidden, true);
  assert.equal(confirmacoes.length, 0);
});

test('tick e renderização não concluem automaticamente a tarefa', async (context) => {
  const app = await prepararApp(context, {
    tarefas: [criarTarefa()],
    sessao: criarSessao('running'),
  });
  const { elementos, dados, intervalos, definirAgora } = app;

  intervalos[0]();
  assert.equal(JSON.parse(dados.get('todolab:tarefas'))[0].concluida, false);
  assert.equal(elementos.get('focus-task-completion-message').hidden, true);

  definirAgora(61_000);
  intervalos[0]();
  assert.equal(elementos.get('focus-status').textContent, 'Sessão finalizada · Pausa curta disponível');
  assert.equal(JSON.parse(dados.get('todolab:tarefas'))[0].concluida, false);
  assert.equal(elementos.get('focus-task-complete').hidden, false);
});
