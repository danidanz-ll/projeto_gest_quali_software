const CHAVE = 'todolab:tarefas';

export function filtrarTarefas(tarefas, hash) {
  if (hash === '#/active') return tarefas.filter((tarefa) => !tarefa.concluida);
  if (hash === '#/completed') return tarefas.filter((tarefa) => tarefa.concluida);
  return [...tarefas];
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
    if (!titulo) return null;
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

  alternarTodas() {
    if (this.tarefas.length === 0) return;
    const concluir = this.tarefas.some((tarefa) => !tarefa.concluida);
    for (const tarefa of this.tarefas) {
      tarefa.concluida = concluir;
    }
    this.salvar();
  }

  remover(id) {
    const alvo = this.tarefas.find((tarefa) => tarefa.id === id);
    if (!alvo) return;
    const indice = this.tarefas.findIndex((tarefa) => tarefa.titulo === alvo.titulo);
    this.tarefas.splice(indice, 1);
    this.salvar();
  }
}
