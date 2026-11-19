export const DURACAO_PADRAO_MS = 25 * 60 * 1000;

const ESTADOS_VALIDOS = new Set(['idle', 'running', 'paused', 'completed']);
const TIPOS_SESSAO_VALIDOS = new Set(['focus', 'shortBreak', 'longBreak']);

function criarSessaoParada(durationMs = DURACAO_PADRAO_MS, type = 'focus', taskId = null) {
  return {
    type,
    taskId: type === 'focus' ? taskId : null,
    status: 'idle',
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
    completedAt: null,
  };
}

function sessaoValida(session) {
  return session
    && ESTADOS_VALIDOS.has(session.status)
    && Number.isFinite(session.durationMs)
    && session.durationMs > 0
    && (session.type === undefined || TIPOS_SESSAO_VALIDOS.has(session.type));
}

function obterMetadadosSessao(session) {
  const type = session.type ?? 'focus';
  const taskId = typeof session.taskId === 'string' && session.taskId.trim().length > 0
    ? session.taskId
    : null;

  return {
    type,
    taskId: type === 'focus' ? taskId : null,
  };
}

export class PomodoroTimer {
  constructor({ clock = Date.now, session = null } = {}) {
    if (typeof clock !== 'function') {
      throw new TypeError('A fonte de tempo deve ser uma função.');
    }

    this.clock = clock;

    if (!sessaoValida(session)) {
      this.session = criarSessaoParada();
    } else {
      const { type, taskId } = obterMetadadosSessao(session);
      if (session.status === 'running' && Number.isFinite(session.endsAt)) {
        this.session = {
          type,
          taskId,
          status: 'running',
          durationMs: session.durationMs,
          remainingMs: session.durationMs,
          endsAt: session.endsAt,
          completedAt: null,
        };
      } else if (
        session.status === 'paused'
        && Number.isFinite(session.remainingMs)
        && session.remainingMs > 0
        && session.remainingMs <= session.durationMs
      ) {
        this.session = {
          type,
          taskId,
          status: 'paused',
          durationMs: session.durationMs,
          remainingMs: session.remainingMs,
          endsAt: null,
          completedAt: null,
        };
      } else if (session.status === 'completed') {
        this.session = {
          type,
          taskId,
          status: 'completed',
          durationMs: session.durationMs,
          remainingMs: 0,
          endsAt: null,
          completedAt: Number.isFinite(session.completedAt) ? session.completedAt : this.clock(),
        };
      } else {
        const remainingMs = session.status === 'idle'
          && Number.isFinite(session.remainingMs)
          && session.remainingMs > 0
          && session.remainingMs <= session.durationMs
          ? session.remainingMs
          : session.durationMs;
        this.session = {
          ...criarSessaoParada(session.durationMs, type, taskId),
          remainingMs,
        };
      }
    }

    this.obterEstado();
  }

  obterEstado() {
    if (this.session.status === 'running') {
      const remainingMs = Math.max(0, this.session.endsAt - this.clock());
      if (remainingMs === 0) {
        this.session = {
          ...this.session,
          status: 'completed',
          remainingMs: 0,
          endsAt: null,
          completedAt: this.session.endsAt,
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
    };
    return true;
  }

  reiniciar() {
    this.session = criarSessaoParada(
      this.session.durationMs,
      this.session.type,
      this.session.taskId,
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
