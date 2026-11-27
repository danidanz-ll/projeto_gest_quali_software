
const CHAVE_HISTORICO = 'todolab:historico-foco';

export class FocusHistoryStore {
  constructor(armazenamento = globalThis.localStorage) {
    this.armazenamento = armazenamento;
  }

  carregar() {
    if (!this.armazenamento) return [];

    const bruto = this.armazenamento.getItem(CHAVE_HISTORICO);
    if (!bruto) return [];

    try {
      const historico = JSON.parse(bruto);
      return Array.isArray(historico) ? historico : [];
    } catch (erro) {
      console.error(
        'Não foi possível recuperar o histórico de foco persistido.',
        erro,
      );
      return [];
    }
  }

  salvar(historico) {
    if (!this.armazenamento) return;

    this.armazenamento.setItem(
      CHAVE_HISTORICO,
      JSON.stringify(historico),
    );
  }

  registrar(sessao) {
    if (!sessao || !sessao.sessionId) return false;

    const historico = this.carregar();

    const jaRegistrada = historico.some(
      (registro) => registro.sessionId === sessao.sessionId,
    );

    if (jaRegistrada) return false;

    historico.push(sessao);
    this.salvar(historico);

    return true;
  }

  atualizarConclusaoTarefa(sessionId, taskCompletedAt) {
    if (!sessionId || !taskCompletedAt) return false;

    const historico = this.carregar();

    const indice = historico.findIndex(
      (registro) => registro.sessionId === sessionId,
    );

    if (indice === -1) return false;

    historico[indice] = {
      ...historico[indice],
      taskCompleted: true,
      taskCompletedAt,
    };

    this.salvar(historico);

    return true;
  }

  listar() {
    return this.carregar().sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
    );
  }
}
