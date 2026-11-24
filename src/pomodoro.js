export const DURACAO_PADRAO_MS = 25 * 60 * 1000;

export const DURACOES_SESSAO_MS = Object.freeze({
  focus: DURACAO_PADRAO_MS,
  shortBreak: 5 * 60 * 1000,
  longBreak: 15 * 60 * 1000,
});

const TIPOS_SESSAO = new Set(Object.keys(DURACOES_SESSAO_MS));
const ESTADOS_VALIDOS = new Set(['idle', 'running', 'paused', 'completed']);
const FOCOS_PARA_PAUSA_LONGA = 4;

function proximaEtapa(tipo, focosConcluidos) {
  if (tipo !== 'focus') return 'focus';
  return focosConcluidos % FOCOS_PARA_PAUSA_LONGA === 0 ? 'longBreak' : 'shortBreak';
}

function criarSessaoParada(
  tipo = 'focus',
  focosConcluidos = 0,
  durationMs = DURACOES_SESSAO_MS[tipo],
  taskId = null,
) {
  return {
    status: 'idle',
    type: tipo,
    taskId: tipo === 'focus' ? taskId : null,
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    completedAt: null,
    focusSessionsCompleted: focosConcluidos,
    nextType: null,
  };
}

function sessaoValida(session) {
  return session
    && ESTADOS_VALIDOS.has(session.status)
    && Number.isFinite(session.durationMs)
    && session.durationMs > 0;
}

function obterTaskId(session, tipo) {
  if (tipo !== 'focus') return null;
  return typeof session.taskId === 'string' && session.taskId.trim().length > 0
    ? session.taskId
    : null;
}

function normalizarSessao(session, clock) {
  if (!sessaoValida(session)) return criarSessaoParada();

  const tipo = TIPOS_SESSAO.has(session.type) ? session.type : 'focus';
  const taskId = obterTaskId(session, tipo);
  const durationMs = session.durationMs;
  const focusSessionsCompleted = Number.isSafeInteger(session.focusSessionsCompleted)
    && session.focusSessionsCompleted >= 0
    ? session.focusSessionsCompleted
    : (session.status === 'completed' && tipo === 'focus' ? 1 : 0);

  if (session.status === 'running' && Number.isFinite(session.endsAt)) {
    return {
      status: 'running',
      type: tipo,
      taskId,
      durationMs,
      remainingMs: durationMs,
      endsAt: session.endsAt,
      completedAt: null,
      focusSessionsCompleted,
      nextType: null,
    };
  }

  if (
    session.status === 'paused'
    && Number.isFinite(session.remainingMs)
    && session.remainingMs > 0
    && session.remainingMs <= durationMs
  ) {
    return {
      status: 'paused',
      type: tipo,
      taskId,
      durationMs,
      remainingMs: session.remainingMs,
      endsAt: null,
      completedAt: null,
      focusSessionsCompleted,
      nextType: null,
    };
  }

  if (session.status === 'completed') {
    const nextType = TIPOS_SESSAO.has(session.nextType)
      ? session.nextType
      : proximaEtapa(tipo, focusSessionsCompleted);
    return {
      status: 'completed',
      type: tipo,
      taskId,
      durationMs,
      remainingMs: 0,
      endsAt: null,
      completedAt: Number.isFinite(session.completedAt) ? session.completedAt : clock(),
      focusSessionsCompleted,
      nextType,
    };
  }

  const remainingMs = session.status === 'idle'
    && Number.isFinite(session.remainingMs)
    && session.remainingMs > 0
    && session.remainingMs <= durationMs
    ? session.remainingMs
    : durationMs;
  return {
    ...criarSessaoParada(tipo, focusSessionsCompleted, durationMs, taskId),
    remainingMs,
  };
}

export class PomodoroTimer {
  constructor({ clock = Date.now, session = null } = {}) {
    if (typeof clock !== 'function') {
      throw new TypeError('A fonte de tempo deve ser uma função.');
    }
    this.clock = clock;
    this.session = normalizarSessao(session, this.clock);
  }

  obterEstado() {
    if (this.session.status === 'running') {
      const remainingMs = Math.max(0, this.session.endsAt - this.clock());
      if (remainingMs === 0) {
        const focusSessionsCompleted = this.session.type === 'focus'
          ? this.session.focusSessionsCompleted + 1
          : this.session.focusSessionsCompleted;
        this.session = {
          ...this.session,
          status: 'completed',
          remainingMs: 0,
          endsAt: null,
          completedAt: this.session.endsAt,
          focusSessionsCompleted,
          nextType: proximaEtapa(this.session.type, focusSessionsCompleted),
        };
      } else {
        return { ...this.session, remainingMs };
      }
    }
    return { ...this.session };
  }

  iniciar() {
    if (this.obterEstado().status !== 'idle') return false;
    this.session = {
      ...this.session,
      status: 'running',
      endsAt: this.clock() + this.session.remainingMs,
      completedAt: null,
      nextType: null,
    };
    return true;
  }

  iniciarProximaEtapa() {
    const current = this.obterEstado();
    if (current.status !== 'completed' || !TIPOS_SESSAO.has(current.nextType)) return false;

    const next = criarSessaoParada(current.nextType, current.focusSessionsCompleted);
    this.session = {
      ...next,
      status: 'running',
      endsAt: this.clock() + next.durationMs,
    };
    return true;
  }

  pausar() {
    const current = this.obterEstado();
    if (current.status !== 'running') return false;
    this.session = {
      ...current,
      status: 'paused',
      endsAt: null,
      completedAt: null,
      nextType: null,
    };
    return true;
  }

  retomar() {
    if (this.obterEstado().status !== 'paused') return false;
    this.session = {
      ...this.session,
      status: 'running',
      endsAt: this.clock() + this.session.remainingMs,
      completedAt: null,
      nextType: null,
    };
    return true;
  }

  reiniciar() {
    this.session = criarSessaoParada(
      this.session.type,
      this.session.focusSessionsCompleted,
      this.session.durationMs,
      this.session.type === 'focus' ? this.session.taskId : null,
    );
    return true;
  }

  associarTarefa(taskId) {
    if (
      this.session.type !== 'focus'
      || this.obterEstado().status !== 'idle'
      || typeof taskId !== 'string'
      || taskId.trim().length === 0
    ) {
      return false;
    }
    this.session = { ...this.session, taskId };
    return true;
  }

  desassociarTarefa() {
    if (this.session.type !== 'focus' || this.obterEstado().status !== 'idle') {
      return false;
    }
    this.session = { ...this.session, taskId: null };
    return true;
  }
}
