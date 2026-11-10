import assert from 'node:assert/strict';
import test from 'node:test';
import { TodoStore } from '../src/store.js';

function criarArmazenamento(tarefas) {
  let dados = JSON.stringify(tarefas);
  let gravacoes = 0;

  return {
    getItem() {
      return dados;
    },
    setItem(chave, valor) {
      dados = valor;
      gravacoes += 1;
    },
    lerTarefas() {
      return JSON.parse(dados);
    },
    get gravacoes() {
      return gravacoes;
    },
  };
}

test('conclui todas as tarefas se alguma estiver pendente e persiste os dados', () => {
  const iniciais = [
    { id: '1', titulo: 'Pendente', concluida: false, extra: 'preservado' },
    { id: '2', titulo: 'Concluída', concluida: true },
  ];
  const armazenamento = criarArmazenamento(iniciais);
  const store = new TodoStore(armazenamento);

  store.alternarTodas();

  assert.deepEqual(store.listar(), [
    { id: '1', titulo: 'Pendente', concluida: true, extra: 'preservado' },
    { id: '2', titulo: 'Concluída', concluida: true },
  ]);
  assert.deepEqual(armazenamento.lerTarefas(), store.listar());
  assert.equal(armazenamento.gravacoes, 1);
});

test('reabre todas as tarefas quando já estão concluídas', () => {
  const armazenamento = criarArmazenamento([
    { id: '1', titulo: 'Primeira', concluida: true },
    { id: '2', titulo: 'Segunda', concluida: true },
  ]);
  const store = new TodoStore(armazenamento);

  store.alternarTodas();

  assert.deepEqual(store.listar().map((tarefa) => tarefa.concluida), [false, false]);
  assert.deepEqual(armazenamento.lerTarefas(), store.listar());
});

test('mantém a lista vazia sem erro nem gravação', () => {
  const armazenamento = criarArmazenamento([]);
  const store = new TodoStore(armazenamento);

  assert.doesNotThrow(() => store.alternarTodas());
  assert.deepEqual(store.listar(), []);
  assert.equal(armazenamento.gravacoes, 0);
});

test('mantém o estado após recriar o store usando o mesmo armazenamento', () => {
  const armazenamento = criarArmazenamento([
    { id: '1', titulo: 'Persistente', concluida: false },
  ]);

  new TodoStore(armazenamento).alternarTodas();
  const storeRecarregado = new TodoStore(armazenamento);

  assert.deepEqual(storeRecarregado.listar().map((tarefa) => tarefa.concluida), [true]);
});
