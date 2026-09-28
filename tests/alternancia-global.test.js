import assert from 'node:assert/strict';
import test from 'node:test';
import { TodoStore } from '../src/store.js';

function criarArmazenamento(tarefas = []) {
  let dados = tarefas.length ? JSON.stringify(tarefas) : null;
  return {
    getItem() {
      return dados;
    },
    setItem(chave, valor) {
      dados = valor;
    },
    lerTarefas() {
      return dados ? JSON.parse(dados) : [];
    },
  };
}

export function testarAlternanciaGlobal() {
  const tarefasIniciais = [
    { id: '1', titulo: 'Pendente', concluida: false },
    { id: '2', titulo: 'Concluída', concluida: true },
  ];
  const armazenamento = criarArmazenamento(tarefasIniciais);
  const store = new TodoStore(armazenamento);

  store.alternarTodas();
  assert.deepEqual(store.listar().map((tarefa) => tarefa.concluida), [true, true]);
  assert.deepEqual(armazenamento.lerTarefas(), store.listar());
  assert.deepEqual(store.listar().map((tarefa) => tarefa.titulo), ['Pendente', 'Concluída']);

  store.alternarTodas();
  assert.deepEqual(store.listar().map((tarefa) => tarefa.concluida), [false, false]);
  assert.deepEqual(armazenamento.lerTarefas(), store.listar());
}

export function testarAlternanciaGlobalComListaVazia() {
  const armazenamento = criarArmazenamento();
  const store = new TodoStore(armazenamento);

  assert.doesNotThrow(() => store.alternarTodas());
  assert.deepEqual(store.listar(), []);
  assert.deepEqual(armazenamento.lerTarefas(), []);
}

test('marca tarefas mistas e depois desmarca todas, persistindo o estado', testarAlternanciaGlobal);
test('não falha nem cria dados ao alternar uma lista vazia', testarAlternanciaGlobalComListaVazia);