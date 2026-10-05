const CHAVE = 'todolab:tarefas';

 feature/issue-05-Filtros_atividades
export function filtrarTarefas(tarefas, hash) {
  if (hash === '#/active') return tarefas.filter((tarefa) => !tarefa.concluida);
  if (hash === '#/completed') return tarefas.filter((tarefa) => tarefa.concluida);
  return [...tarefas];
=======
export function formatarPendencias(tarefas = []) {
  const quantidade = tarefas.filter((tarefa) => !tarefa.concluida).length;
  const unidade = quantidade === 1 ? 'item restante' : 'itens restantes';
  return `${quantidade} ${unidade}`;
 main
}

function criarTarefa(titulo) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    titulo,
    concluida: false,
    criadaEm: new Date().toISOString(),
  };
}

export class TodoStore {
  constructor(armazenamento = globalThis.localStorage) {
    this.armazenamento = armazenamento;
    this.tarefas = this.carregar();
  }

  carregar() {
    if (!this.armazenamento) return [];
    const bruto = this.armazenamento.getItem(CHAVE);
    if (!bruto) return [];
    return JSON.parse(bruto);
  }

  salvar() {
    if (!this.armazenamento) return;
    this.armazenamento.setItem(CHAVE, JSON.stringify(this.tarefas));
  }

  listar() {
    return [...this.tarefas];
  }

  adicionar(titulo) {
    if (typeof titulo !== 'string' || titulo.trim().length === 0) return null;
    const tarefa = criarTarefa(titulo);
    this.tarefas.push(tarefa);
    this.salvar();
    return tarefa;
  }

  alternar(id) {
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return;
    tarefa.concluida = !tarefa.concluida;
    this.salvar();
  }

  remover(id) {
    const indice = this.tarefas.findIndex((tarefa) => tarefa.id === id);
    if (indice === -1) return;
    this.tarefas.splice(indice, 1);
    this.salvar();
  }

  removerConcluidas() {
    const tarefasConcluidas = this.tarefas.filter((tarefa) => tarefa.concluida);
    this.tarefas = this.tarefas.filter((tarefa) => !tarefa.concluida);
    if (tarefasConcluidas.length > 0) {
      this.salvar();
    }
    return tarefasConcluidas.length;
  }
}

export function executarTesteLimpezaDeConcluidas() {
  const assert = (condicao, mensagem) => {
    if (!condicao) {
      throw new Error(mensagem);
    }
  };

  const criarArmazenamento = (tarefas) => {
    let dados = JSON.stringify(tarefas);
    return {
      getItem: () => dados,
      setItem: (_, valor) => {
        dados = valor;
      },
    };
  };

  const tarefasComConcluidas = [
    { id: '1', titulo: 'pendente', concluida: false, criadaEm: '2024-01-01T00:00:00.000Z' },
    { id: '2', titulo: 'concluida 1', concluida: true, criadaEm: '2024-01-01T00:01:00.000Z' },
    { id: '3', titulo: 'concluida 2', concluida: true, criadaEm: '2024-01-01T00:02:00.000Z' },
    { id: '4', titulo: 'pendente 2', concluida: false, criadaEm: '2024-01-01T00:03:00.000Z' },
  ];

  const lojaComConcluidas = new TodoStore(criarArmazenamento(tarefasComConcluidas));
  const removidas = lojaComConcluidas.removerConcluidas();

  assert(removidas === 2, 'Cenário 1: deve remover exatamente 2 tarefas concluídas.');
  assert(lojaComConcluidas.listar().length === 2, 'Cenário 1: devem permanecer apenas tarefas pendentes.');
  assert(
    lojaComConcluidas.listar().every((tarefa) => !tarefa.concluida),
    'Cenário 1: todas as tarefas restantes devem estar pendentes.'
  );

  const tarefasSemConcluidas = [
    { id: '5', titulo: 'pendente A', concluida: false, criadaEm: '2024-01-01T00:04:00.000Z' },
    { id: '6', titulo: 'pendente B', concluida: false, criadaEm: '2024-01-01T00:05:00.000Z' },
  ];

  const lojaSemConcluidas = new TodoStore(criarArmazenamento(tarefasSemConcluidas));
  const removidasSemConcluidas = lojaSemConcluidas.removerConcluidas();

  assert(removidasSemConcluidas === 0, 'Cenário 2: quando não há tarefas concluídas, não deve remover nenhuma.');
  assert(
    lojaSemConcluidas.listar().length === 2,
    'Cenário 2: a lista deve permanecer intacta quando não houver concluídas.'
  );

  console.log('Teste de limpeza de tarefas concluídas: OK');
  return true;
}
