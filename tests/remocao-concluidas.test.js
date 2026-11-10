import assert from 'node:assert/strict';
import { TodoStore } from '../src/store.js';

function criarArmazenamento(tarefas) {
  let dados = JSON.stringify(tarefas);
  return {
    getItem: () => dados,
    setItem: (_, valor) => {
      dados = valor;
    },
  };
}

function testarRemocaoDeTarefasConcluidas() {
  const tarefasComConcluidas = [
    { id: '1', titulo: 'pendente', concluida: false, criadaEm: '2024-01-01T00:00:00.000Z' },
    { id: '2', titulo: 'concluida 1', concluida: true, criadaEm: '2024-01-01T00:01:00.000Z' },
    { id: '3', titulo: 'concluida 2', concluida: true, criadaEm: '2024-01-01T00:02:00.000Z' },
    { id: '4', titulo: 'pendente 2', concluida: false, criadaEm: '2024-01-01T00:03:00.000Z' },
  ];

  const lojaComConcluidas = new TodoStore(criarArmazenamento(tarefasComConcluidas));
  const removidas = lojaComConcluidas.removerConcluidas();

  assert.equal(removidas, 2, 'Cenário 1: deve remover exatamente 2 tarefas concluídas.');
  assert.equal(lojaComConcluidas.listar().length, 2, 'Cenário 1: devem permanecer apenas tarefas pendentes.');
  assert.ok(
    lojaComConcluidas.listar().every((tarefa) => !tarefa.concluida),
    'Cenário 1: todas as tarefas restantes devem estar pendentes.',
  );

  const tarefasSemConcluidas = [
    { id: '5', titulo: 'pendente A', concluida: false, criadaEm: '2024-01-01T00:04:00.000Z' },
    { id: '6', titulo: 'pendente B', concluida: false, criadaEm: '2024-01-01T00:05:00.000Z' },
  ];

  const lojaSemConcluidas = new TodoStore(criarArmazenamento(tarefasSemConcluidas));
  const removidasSemConcluidas = lojaSemConcluidas.removerConcluidas();

  assert.equal(removidasSemConcluidas, 0, 'Cenário 2: quando não há tarefas concluídas, não deve remover nenhuma.');
  assert.equal(
    lojaSemConcluidas.listar().length,
    2,
    'Cenário 2: a lista deve permanecer intacta quando não houver concluídas.',
  );

  console.log('Teste de limpeza de tarefas concluídas: OK');
}

testarRemocaoDeTarefasConcluidas();
