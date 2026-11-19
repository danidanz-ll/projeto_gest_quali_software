import assert from 'node:assert/strict';
import test from 'node:test';

import { FocusStore } from '../src/focus-store.js';
import { DURACAO_PADRAO_MS, PomodoroTimer } from '../src/pomodoro.js';

test('inicia parado com duração padrão e respeita as transições de estado', () => {
  let agora = 1000;
  const timer = new PomodoroTimer({ clock: () => agora });

  assert.deepEqual(timer.obterEstado(), {
    type: 'focus',
    taskId: null,
    status: 'idle',
    durationMs: DURACAO_PADRAO_MS,
    remainingMs: DURACAO_PADRAO_MS,
    endsAt: null,
    completedAt: null,
  });
  assert.equal(timer.pausar(), false);
  assert.equal(timer.retomar(), false);
  assert.equal(timer.iniciar(), true);
  assert.equal(timer.iniciar(), false);

  agora += 5000;
  assert.equal(timer.obterEstado().remainingMs, DURACAO_PADRAO_MS - 5000);
  assert.equal(timer.pausar(), true);
  assert.equal(timer.obterEstado().status, 'paused');
  assert.equal(timer.retomar(), true);
  assert.equal(timer.obterEstado().status, 'running');
});

test('pausa e retomada preservam o tempo restante sem contar o período pausado', () => {
  let agora = 0;
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 10_000,
    },
  });

  timer.iniciar();
  agora = 3000;
  timer.pausar();
  agora = 8000;
  assert.equal(timer.obterEstado().remainingMs, 7000);

  timer.retomar();
  agora = 9000;
  assert.equal(timer.obterEstado().remainingMs, 6000);
});

test('reinicia sessão em execução ou pausada para o tempo configurado', () => {
  let agora = 0;
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 10_000,
    },
  });

  timer.iniciar();
  agora = 2500;
  timer.reiniciar();
  assert.deepEqual(timer.obterEstado(), {
    type: 'focus',
    taskId: null,
    status: 'idle',
    durationMs: 10_000,
    remainingMs: 10_000,
    endsAt: null,
    completedAt: null,
  });

  timer.iniciar();
  agora = 4000;
  timer.pausar();
  timer.reiniciar();
  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().remainingMs, 10_000);
});

test('finaliza automaticamente quando o horário previsto para término chega', () => {
  let agora = 100;
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      durationMs: 2000,
      remainingMs: 2000,
    },
  });

  timer.iniciar();
  agora = 2099;
  assert.equal(timer.obterEstado().remainingMs, 1);
  agora = 2100;
  assert.deepEqual(timer.obterEstado(), {
    type: 'focus',
    taskId: null,
    status: 'completed',
    durationMs: 2000,
    remainingMs: 0,
    endsAt: null,
    completedAt: 2100,
  });
  assert.equal(timer.pausar(), false);
});

test('recupera sessões em execução considerando o tempo transcorrido', () => {
  const timer = new PomodoroTimer({
    clock: () => 6000,
    session: {
      status: 'running',
      durationMs: 10_000,
      remainingMs: 10_000,
      endsAt: 9000,
    },
  });

  assert.equal(timer.obterEstado().remainingMs, 3000);
});

test('recupera sessão pausada sem descontar tempo durante a atualização', () => {
  const timer = new PomodoroTimer({
    clock: () => 50_000,
    session: {
      status: 'paused',
      durationMs: 10_000,
      remainingMs: 4000,
    },
  });

  assert.equal(timer.obterEstado().status, 'paused');
  assert.equal(timer.obterEstado().remainingMs, 4000);
});

test('persiste a sessão em uma chave independente das tarefas', () => {
  const dados = new Map([['todolab:tarefas', '[{"id":"tarefa-1"}]']]);
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const focusStore = new FocusStore(armazenamento);
  const sessao = {
    status: 'paused',
    durationMs: 10_000,
    remainingMs: 4000,
    endsAt: null,
    completedAt: null,
  };

  focusStore.salvar(sessao);

  assert.deepEqual(focusStore.carregar(), sessao);
  assert.equal(dados.get('todolab:tarefas'), '[{"id":"tarefa-1"}]');
});

test('associa e desassocia tarefas somente em sessões de foco idle', () => {
  const timer = new PomodoroTimer();

  assert.equal(timer.associarTarefa('tarefa-1'), true);
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
  assert.equal(timer.desassociarTarefa(), true);
  assert.equal(timer.obterEstado().taskId, null);

  for (const taskId of [null, undefined, '', '   ', 42]) {
    assert.equal(timer.associarTarefa(taskId), false);
  }
  assert.equal(timer.obterEstado().taskId, null);

  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  assert.equal(timer.associarTarefa('tarefa-2'), false);
  assert.equal(timer.desassociarTarefa(), false);
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
});

test('mantém os metadados da sessão ao iniciar, pausar, retomar e reiniciar', () => {
  const timer = new PomodoroTimer();

  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  assert.deepEqual(
    { type: timer.obterEstado().type, taskId: timer.obterEstado().taskId },
    { type: 'focus', taskId: 'tarefa-1' },
  );
  timer.pausar();
  timer.retomar();
  timer.reiniciar();

  assert.deepEqual(timer.obterEstado(), {
    type: 'focus',
    taskId: 'tarefa-1',
    status: 'idle',
    durationMs: DURACAO_PADRAO_MS,
    remainingMs: DURACAO_PADRAO_MS,
    endsAt: null,
    completedAt: null,
  });
});

test('migra sessões antigas e impede associação nos tipos de descanso', () => {
  const sessaoAntiga = new PomodoroTimer({
    session: {
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 10_000,
    },
  });
  assert.equal(sessaoAntiga.obterEstado().type, 'focus');
  assert.equal(sessaoAntiga.obterEstado().taskId, null);

  for (const type of ['shortBreak', 'longBreak']) {
    const descanso = new PomodoroTimer({
      session: {
        type,
        taskId: 'tarefa-1',
        status: 'idle',
        durationMs: 5000,
        remainingMs: 5000,
      },
    });

    assert.equal(descanso.obterEstado().type, type);
    assert.equal(descanso.obterEstado().taskId, null);
    assert.equal(descanso.associarTarefa('tarefa-2'), false);
    assert.equal(descanso.desassociarTarefa(), false);
    descanso.reiniciar();
    assert.equal(descanso.obterEstado().type, type);
    assert.equal(descanso.obterEstado().taskId, null);
  }
});

test('descarta tipo de sessão inválido e tarefa inválida persistidos', () => {
  const tipoInvalido = new PomodoroTimer({
    session: {
      type: 'other',
      taskId: 'tarefa-1',
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 10_000,
    },
  });
  assert.equal(tipoInvalido.obterEstado().type, 'focus');
  assert.equal(tipoInvalido.obterEstado().taskId, null);

  const tarefaInvalida = new PomodoroTimer({
    session: {
      type: 'focus',
      taskId: '  ',
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 10_000,
    },
  });
  assert.equal(tarefaInvalida.obterEstado().taskId, null);
});

test('persiste e recupera sessão focus com tarefa associada', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const focusStore = new FocusStore(armazenamento);
  const timer = new PomodoroTimer();

  assert.equal(timer.associarTarefa('tarefa-1'), true);
  focusStore.salvar(timer.obterEstado());

  const recuperado = new PomodoroTimer({ session: focusStore.carregar() });
  assert.deepEqual(recuperado.obterEstado(), {
    type: 'focus',
    taskId: 'tarefa-1',
    status: 'idle',
    durationMs: DURACAO_PADRAO_MS,
    remainingMs: DURACAO_PADRAO_MS,
    endsAt: null,
    completedAt: null,
  });
});
