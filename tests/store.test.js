import assert from 'node:assert/strict';
import { TodoStore } from '../src/store.js';

export function testarRemocaoDeTarefa() {
  const tarefasIniciais = [
    { id: 'tarefa-1', titulo: 'Mesmo título', concluida: false, criadaEm: '2026-09-28T00:00:00.000Z' },
    { id: 'tarefa-2', titulo: 'Mesmo título', concluida: false, criadaEm: '2026-09-28T00:00:00.000Z' },
    { id: 'tarefa-3', titulo: 'Outra tarefa', concluida: true, criadaEm: '2026-09-28T00:00:00.000Z' },
  ];
  const armazenamentoEmMemoria = {
    dados: new Map([['todolab:tarefas', JSON.stringify(tarefasIniciais)]]),
    getItem(chave) {
      return this.dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      this.dados.set(chave, valor);
    },
  };
  const store = new TodoStore(armazenamentoEmMemoria);

  store.remover('tarefa-2');
  assert.deepEqual(store.listar().map((tarefa) => tarefa.id), ['tarefa-1', 'tarefa-3']);
  assert.deepEqual(
    JSON.parse(armazenamentoEmMemoria.getItem('todolab:tarefas')).map((tarefa) => tarefa.id),
    ['tarefa-1', 'tarefa-3'],
  );

  const dadosPersistidos = armazenamentoEmMemoria.getItem('todolab:tarefas');
  store.remover('id-inexistente');
  store.remover(null);
  assert.deepEqual(store.listar().map((tarefa) => tarefa.id), ['tarefa-1', 'tarefa-3']);
  assert.equal(armazenamentoEmMemoria.getItem('todolab:tarefas'), dadosPersistidos);

  store.remover('tarefa-1');
  store.remover('tarefa-3');
  assert.deepEqual(store.listar(), []);
  assert.deepEqual(JSON.parse(armazenamentoEmMemoria.getItem('todolab:tarefas')), []);
  store.remover('id-inexistente');
  assert.deepEqual(store.listar(), []);
}

testarRemocaoDeTarefa();
console.log('Teste unitário aprovado: remoção individual e casos de borda.');