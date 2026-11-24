import assert from 'node:assert/strict';
import test from 'node:test';

import { FocusStore } from '../src/focus-store.js';
import { limparTarefaInexistente } from '../src/focus-session.js';
import { PomodoroTimer } from '../src/pomodoro.js';

function criarFocusStore() {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  return new FocusStore(armazenamento);
}

test('preserva referências em running, paused e completed e limpa idle', () => {
  const cenarios = [
    {
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 7000,
      endsAt: null,
      completedAt: null,
    },
    {
      status: 'running',
      durationMs: 10_000,
      remainingMs: 7000,
      endsAt: 8000,
      completedAt: null,
    },
    {
      status: 'paused',
      durationMs: 10_000,
      remainingMs: 6000,
      endsAt: null,
      completedAt: null,
    },
    {
      status: 'completed',
      durationMs: 10_000,
      remainingMs: 0,
      endsAt: null,
      completedAt: 7000,
      nextType: 'shortBreak',
    },
  ];

  for (const dadosSessao of cenarios) {
    const focusStore = criarFocusStore();
    const session = {
      type: 'focus',
      taskId: 'tarefa-removida',
      ...dadosSessao,
    };

    focusStore.salvar(session);
    const recuperada = limparTarefaInexistente(focusStore.carregar(), []);
    const esperada = dadosSessao.status === 'idle'
      ? { ...session, taskId: null }
      : session;
    assert.deepEqual(recuperada, esperada);
    focusStore.salvar(recuperada);

    const timer = new PomodoroTimer({
      clock: () => 1000,
      session: focusStore.carregar(),
    });
    const estado = timer.obterEstado();

    assert.equal(estado.status, session.status);
    assert.equal(estado.type, 'focus');
    assert.equal(
      estado.taskId,
      dadosSessao.status === 'idle' ? null : 'tarefa-removida',
    );
    assert.equal(estado.durationMs, session.durationMs);
    assert.equal(estado.remainingMs, dadosSessao.status === 'running'
      ? 7000
      : session.remainingMs);
    assert.deepEqual(focusStore.carregar(), esperada);
  }
});

test('mantém a associação quando a tarefa ainda existe', () => {
  const session = {
    type: 'focus',
    taskId: 'tarefa-existente',
    status: 'idle',
    durationMs: 10_000,
    remainingMs: 10_000,
    endsAt: null,
    completedAt: null,
  };
  const tarefas = [{ id: 'tarefa-existente', titulo: 'Tarefa válida' }];

  assert.equal(limparTarefaInexistente(session, tarefas), session);
});
