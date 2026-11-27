import assert from 'node:assert/strict';
import test from 'node:test';

import { FocusHistoryStore } from '../src/focus-history.js';

function criarArmazenamento() {
  const dados = new Map();

  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
}

test('inicia com histórico vazio', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  assert.deepEqual(store.carregar(), []);
});

test('registra e recupera uma sessão', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  const sessao = {
    sessionId: 'sessao-1',
    completedAt: '2026-11-26T10:00:00.000Z',
  };

  assert.equal(store.registrar(sessao), true);
  assert.deepEqual(store.carregar(), [sessao]);
});

test('não registra sessões duplicadas', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  const sessao = {
    sessionId: 'sessao-1',
    completedAt: '2026-11-26T10:00:00.000Z',
  };

  assert.equal(store.registrar(sessao), true);
  assert.equal(store.registrar(sessao), false);
  assert.equal(store.carregar().length, 1);
});

test('não registra sessão sem identificador', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  assert.equal(store.registrar(null), false);
  assert.equal(store.registrar({}), false);
  assert.deepEqual(store.carregar(), []);
});

test('atualiza a conclusão de uma tarefa', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  store.registrar({
    sessionId: 'sessao-1',
    completedAt: '2026-11-26T10:00:00.000Z',
  });

  assert.equal(
    store.atualizarConclusaoTarefa(
      'sessao-1',
      '2026-11-26T10:30:00.000Z',
    ),
    true,
  );

  assert.deepEqual(store.carregar()[0], {
    sessionId: 'sessao-1',
    completedAt: '2026-11-26T10:00:00.000Z',
    taskCompleted: true,
    taskCompletedAt: '2026-11-26T10:30:00.000Z',
  });
});

test('retorna false para sessão inexistente', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  assert.equal(
    store.atualizarConclusaoTarefa('inexistente', '2026-11-26'),
    false,
  );
});

test('lista sessões da mais recente para a mais antiga', () => {
  const store = new FocusHistoryStore(criarArmazenamento());

  const antiga = {
    sessionId: 'sessao-antiga',
    completedAt: '2026-11-24T10:00:00.000Z',
  };

  const recente = {
    sessionId: 'sessao-recente',
    completedAt: '2026-11-26T10:00:00.000Z',
  };

  store.registrar(antiga);
  store.registrar(recente);

  assert.deepEqual(store.listar(), [recente, antiga]);
});

test('funciona sem armazenamento disponível', () => {
  const store = new FocusHistoryStore(null);

  assert.deepEqual(store.carregar(), []);
  assert.deepEqual(store.listar(), []);
  assert.equal(store.registrar({
    sessionId: 'sessao-1',
  }), true);
});
