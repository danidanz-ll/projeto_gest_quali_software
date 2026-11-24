import assert from 'node:assert/strict';
import test from 'node:test';

import { TodoStore } from '../src/store.js';

function criarArmazenamento(valorInicial = null) {
  let dados = valorInicial;

  return {
    getItem: () => dados,
    setItem: (_, proximoValor) => {
      dados = proximoValor;
    },
  };
}

test('Cenário 1 - persistência das tarefas', () => {
  const tarefasPersistidas = [
    { id: '1', titulo: 'Estudar qualidade', concluida: false, criadaEm: '2024-01-01T00:00:00.000Z' },
    { id: '2', titulo: 'Revisar checklist', concluida: true, criadaEm: '2024-01-01T00:01:00.000Z' },
  ];

  const armazenamentoValido = criarArmazenamento(JSON.stringify(tarefasPersistidas));
  const store = new TodoStore(armazenamentoValido);

  assert.deepEqual(store.listar(), tarefasPersistidas);
  assert.equal(store.listar()[1].concluida, true);
});

test('Cenário 2 - JSON corrompido não trava a aplicação', () => {
  const armazenamentoCorrompido = criarArmazenamento('{bad json');
  const store = new TodoStore(armazenamentoCorrompido);

  assert.deepEqual(store.listar(), []);
  assert.equal(Array.isArray(store.listar()), true);
});

test('Cenário 3 - remoção de tarefas concluídas continua funcionando', () => {
  const tarefas = [
    { id: '1', titulo: 'pendente', concluida: false, criadaEm: '2024-01-01T00:00:00.000Z' },
    { id: '2', titulo: 'concluida 1', concluida: true, criadaEm: '2024-01-01T00:01:00.000Z' },
    { id: '3', titulo: 'concluida 2', concluida: true, criadaEm: '2024-01-01T00:02:00.000Z' },
    { id: '4', titulo: 'pendente 2', concluida: false, criadaEm: '2024-01-01T00:03:00.000Z' },
  ];

  const store = new TodoStore(criarArmazenamento(JSON.stringify(tarefas)));
  const removidas = store.removerConcluidas();

  assert.equal(removidas, 2);
  assert.equal(store.listar().length, 2);
  assert.equal(store.listar().every((tarefa) => !tarefa.concluida), true);
});

test('conclui tarefa pendente e persiste sem repetir a gravação', () => {
  let dados = JSON.stringify([
    { id: '1', titulo: 'Concluir', concluida: false },
  ]);
  let gravacoes = 0;
  const armazenamento = {
    getItem: () => dados,
    setItem: (_, valor) => {
      dados = valor;
      gravacoes += 1;
    },
  };
  const store = new TodoStore(armazenamento);

  assert.deepEqual(store.concluir('1'), { status: 'completed' });
  assert.equal(store.listar()[0].concluida, true);
  assert.equal(JSON.parse(dados)[0].concluida, true);
  assert.equal(gravacoes, 1);

  assert.deepEqual(store.concluir('1'), { status: 'already-completed' });
  assert.equal(gravacoes, 1);
});

test('retorna falha para tarefa inexistente sem alterar ou persistir', () => {
  let gravacoes = 0;
  const armazenamento = {
    getItem: () => JSON.stringify([]),
    setItem: () => {
      gravacoes += 1;
    },
  };
  const store = new TodoStore(armazenamento);

  assert.deepEqual(store.concluir('ausente'), { status: 'not-found' });
  assert.equal(gravacoes, 0);
});

test('reverte o estado em memória quando a persistência falha', () => {
  const dados = JSON.stringify([
    { id: '1', titulo: 'Concluir', concluida: false },
  ]);
  const armazenamento = {
    getItem: () => dados,
    setItem: () => {
      throw new Error('Falha simulada de armazenamento.');
    },
  };
  const store = new TodoStore(armazenamento);

  const resultado = store.concluir('1');

  assert.equal(resultado.status, 'failed');
  assert.match(resultado.error.message, /falha simulada/i);
  assert.equal(store.listar()[0].concluida, false);
  assert.equal(JSON.parse(dados)[0].concluida, false);
});
