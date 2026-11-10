const CHAVE = 'todolab:tarefas';

export function filtrarTarefas(tarefas, hash) {
  if (hash === '#/active') {
    return tarefas.filter((tarefa) => !tarefa.concluida);
  }

  if (hash === '#/completed') {
    return tarefas.filter((tarefa) => tarefa.concluida);
  }

  return [...tarefas];
}

export function formatarPendencias(tarefas = []) {
  const quantidade = tarefas.filter((tarefa) => !tarefa.concluida).length;
  const unidade = quantidade === 1 ? 'item restante' : 'itens restantes';
  return `${quantidade} ${unidade}`;
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

    try {
      const dados = JSON.parse(bruto);
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      return [];
    }
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

  alternarTodas() {
    if (this.tarefas.length === 0) return;

    const concluirTodas = this.tarefas.some((tarefa) => !tarefa.concluida);
    for (const tarefa of this.tarefas) {
      tarefa.concluida = concluirTodas;
    }
    this.salvar();
  }

  atualizarTitulo(id, titulo) {
    if (typeof id !== 'string' || id.length === 0) return false;
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return false;

    const tituloAtualizado = typeof titulo === 'string' ? titulo.trim() : '';
    if (tituloAtualizado.length === 0) return false;
    if (tituloAtualizado === tarefa.titulo) return true;

    tarefa.titulo = tituloAtualizado;
    this.salvar();
    return true;
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
