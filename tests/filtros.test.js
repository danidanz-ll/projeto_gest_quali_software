import assert from 'node:assert/strict';
import { filtrarTarefas } from '../src/store.js';

export function testarFiltrosDeTarefas() {
  const tarefas = [
    { id: '1', titulo: 'Pendente', concluida: false },
    { id: '2', titulo: 'Finalizada', concluida: true },
  ];

  assert.deepEqual(filtrarTarefas(tarefas, '#/active'), [tarefas[0]]);
  assert.deepEqual(filtrarTarefas(tarefas, '#/completed'), [tarefas[1]]);
  assert.deepEqual(filtrarTarefas(tarefas, '#/'), tarefas);
  assert.deepEqual(filtrarTarefas(tarefas, '#/pendencias'), tarefas);
  assert.deepEqual(filtrarTarefas([], '#/active'), []);
  assert.deepEqual(tarefas.map((tarefa) => tarefa.concluida), [false, true]);
}

testarFiltrosDeTarefas();
console.log('Teste unitário aprovado: filtros, fallback e preservação dos dados.');