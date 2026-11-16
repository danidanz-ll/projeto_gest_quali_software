const CHAVE_SESSAO = 'todolab:pomodoro';

export class FocusStore {
  constructor(armazenamento = globalThis.localStorage) {
    this.armazenamento = armazenamento;
  }

  carregar() {
    if (!this.armazenamento) return null;

    const bruto = this.armazenamento.getItem(CHAVE_SESSAO);
    if (!bruto) return null;

    try {
      return JSON.parse(bruto);
    } catch (erro) {
      console.error('Não foi possível recuperar a sessão Pomodoro persistida.', erro);
      return null;
    }
  }

  salvar(sessao) {
    if (!this.armazenamento) return;
    this.armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }
}
