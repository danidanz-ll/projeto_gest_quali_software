import assert from 'node:assert/strict';
import test from 'node:test';

import { FocusStore } from '../src/focus-store.js';
import {
  DURACAO_PADRAO_MS,
  DURACOES_SESSAO_MS,
  PomodoroTimer,
} from '../src/pomodoro.js';

function criarTimer({ agora = 0, tipo = 'focus', duracao = 10_000, concluidos = 0 } = {}) {
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      type: tipo,
      durationMs: duracao,
      remainingMs: duracao,
      focusSessionsCompleted: concluidos,
    },
  });
  return { timer, definirAgora: (valor) => { agora = valor; } };
}

test('inicia em foco com duração padrão e respeita as transições de estado', () => {
  let agora = 1000;
  const timer = new PomodoroTimer({ clock: () => agora });

  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().type, 'focus');
  assert.equal(timer.obterEstado().durationMs, DURACAO_PADRAO_MS);
  assert.equal(timer.pausar(), false);
  assert.equal(timer.retomar(), false);
  assert.equal(timer.iniciarProximaEtapa(), false);
  assert.equal(timer.iniciar(), true);
  assert.equal(timer.iniciar(), false);

  agora += 5000;
  assert.equal(timer.obterEstado().remainingMs, DURACAO_PADRAO_MS - 5000);
  assert.equal(timer.pausar(), true);
  assert.equal(timer.obterEstado().status, 'paused');
  assert.equal(timer.retomar(), true);
  assert.equal(timer.obterEstado().status, 'running');
});

test('pausa e retomada preservam o tempo restante sem contar o período pausado', () => {
  let agora = 0;
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      durationMs: 10_000,
      remainingMs: 10_000,
    },
  });

  timer.iniciar();
  agora = 3000;
  timer.pausar();
  agora = 8000;
  assert.equal(timer.obterEstado().remainingMs, 7000);

  timer.retomar();
  agora = 9000;
  assert.equal(timer.obterEstado().remainingMs, 6000);
});

test('reinicia sessão em execução ou pausada para o tempo configurado', () => {
  const { timer, definirAgora } = criarTimer();

  timer.iniciar();
  definirAgora(2500);
  timer.reiniciar();
  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().remainingMs, 10_000);
  assert.equal(timer.obterEstado().focusSessionsCompleted, 0);

  timer.iniciar();
  definirAgora(4000);
  timer.pausar();
  timer.reiniciar();
  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().remainingMs, 10_000);
});

test('finaliza o foco e incrementa a contagem uma única vez', () => {
  let agora = 100;
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      durationMs: 2000,
      remainingMs: 2000,
    },
  });

  timer.iniciar();
  agora = 2099;
  assert.equal(timer.obterEstado().remainingMs, 1);
  agora = 2100;
  assert.equal(timer.obterEstado().status, 'completed');
  assert.equal(timer.obterEstado().completedAt, 2100);
  assert.equal(timer.obterEstado().focusSessionsCompleted, 1);
  assert.equal(timer.obterEstado().nextType, 'shortBreak');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 1);
  assert.equal(timer.pausar(), false);
  assert.equal(timer.iniciarProximaEtapa(), true);
  assert.equal(timer.obterEstado().type, 'shortBreak');
  assert.equal(timer.obterEstado().durationMs, DURACOES_SESSAO_MS.shortBreak);
  assert.equal(timer.obterEstado().status, 'running');
  assert.equal(timer.pausar(), true);
});

test('pausa curta concluída disponibiliza foco sem incrementar a contagem', () => {
  const { timer, definirAgora } = criarTimer({ tipo: 'shortBreak', duracao: 5000, concluidos: 2 });
  timer.iniciar();
  definirAgora(5000);
  assert.equal(timer.obterEstado().status, 'completed');
  assert.equal(timer.obterEstado().nextType, 'focus');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 2);

  assert.equal(timer.iniciarProximaEtapa(), true);
  assert.equal(timer.obterEstado().type, 'focus');
  assert.equal(timer.obterEstado().durationMs, DURACAO_PADRAO_MS);
});

test('disponibiliza pausa longa após o quarto foco e retoma a sequência após a pausa', () => {
  let agora = 0;
  const timer = new PomodoroTimer({
    clock: () => agora,
    session: {
      status: 'idle',
      type: 'focus',
      durationMs: 10,
      remainingMs: 10,
    },
  });

  for (let foco = 1; foco <= 4; foco += 1) {
    if (foco === 1) assert.equal(timer.iniciar(), true);
    agora = timer.obterEstado().endsAt;
    assert.equal(timer.obterEstado().focusSessionsCompleted, foco);
    assert.equal(timer.obterEstado().nextType, foco === 4 ? 'longBreak' : 'shortBreak');
    assert.equal(timer.obterEstado().status, 'completed');
    assert.equal(timer.iniciarProximaEtapa(), true);

    if (foco < 4) {
      assert.equal(timer.obterEstado().type, 'shortBreak');
      agora = timer.obterEstado().endsAt;
      assert.equal(timer.obterEstado().status, 'completed');
      assert.equal(timer.obterEstado().focusSessionsCompleted, foco);
      assert.equal(timer.iniciarProximaEtapa(), true);
    }
  }

  assert.equal(timer.obterEstado().type, 'longBreak');
  assert.equal(timer.obterEstado().durationMs, DURACOES_SESSAO_MS.longBreak);
  agora += DURACOES_SESSAO_MS.longBreak;
  assert.equal(timer.obterEstado().nextType, 'focus');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 4);
});

test('reinicia uma etapa de descanso sem alterar seu tipo nem a contagem', () => {
  const { timer, definirAgora } = criarTimer({
    tipo: 'longBreak',
    duracao: DURACOES_SESSAO_MS.longBreak,
    concluidos: 4,
  });
  timer.iniciar();
  definirAgora(1000);
  timer.reiniciar();

  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().type, 'longBreak');
  assert.equal(timer.obterEstado().remainingMs, DURACOES_SESSAO_MS.longBreak);
  assert.equal(timer.obterEstado().focusSessionsCompleted, 4);
});

test('pausa e retomada preservam o tipo e o tempo restante nas três etapas', () => {
  for (const [tipo, duracao] of Object.entries(DURACOES_SESSAO_MS)) {
    const { timer, definirAgora } = criarTimer({ tipo, duracao });
    timer.iniciar();
    definirAgora(3000);
    timer.pausar();
    definirAgora(8000);
    assert.equal(timer.obterEstado().remainingMs, duracao - 3000);
    assert.equal(timer.obterEstado().type, tipo);

    timer.retomar();
    definirAgora(9000);
    assert.equal(timer.obterEstado().remainingMs, duracao - 4000);
    assert.equal(timer.obterEstado().type, tipo);
  }
});

test('recupera sessões em execução considerando o tempo transcorrido', () => {
  const timer = new PomodoroTimer({
    clock: () => 6000,
    session: {
      status: 'running',
      durationMs: 10_000,
      remainingMs: 10_000,
      endsAt: 9000,
      type: 'focus',
      focusSessionsCompleted: 2,
    },
  });

  assert.equal(timer.obterEstado().remainingMs, 3000);
  assert.equal(timer.obterEstado().focusSessionsCompleted, 2);
});

test('recupera sessão pausada sem descontar tempo durante a atualização', () => {
  const timer = new PomodoroTimer({
    clock: () => 50_000,
    session: {
      status: 'paused',
      type: 'shortBreak',
      durationMs: 10_000,
      remainingMs: 4000,
      focusSessionsCompleted: 3,
    },
  });

  assert.equal(timer.obterEstado().status, 'paused');
  assert.equal(timer.obterEstado().remainingMs, 4000);
  assert.equal(timer.obterEstado().type, 'shortBreak');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 3);
});

test('recupera foco expirado e não contabiliza novamente uma sessão já concluída', () => {
  const sessaoExpirada = {
    status: 'running',
    type: 'focus',
    durationMs: 1000,
    remainingMs: 1000,
    endsAt: 1000,
    focusSessionsCompleted: 3,
  };
  const primeiroTimer = new PomodoroTimer({ clock: () => 1000, session: sessaoExpirada });
  const sessaoConcluida = primeiroTimer.obterEstado();

  assert.equal(sessaoConcluida.focusSessionsCompleted, 4);
  assert.equal(sessaoConcluida.nextType, 'longBreak');

  const timerRecuperado = new PomodoroTimer({ clock: () => 2000, session: sessaoConcluida });
  assert.equal(timerRecuperado.obterEstado().status, 'completed');
  assert.equal(timerRecuperado.obterEstado().focusSessionsCompleted, 4);
  assert.equal(timerRecuperado.obterEstado().nextType, 'longBreak');
});

test('persiste e recupera o estado completo do ciclo e sua próxima etapa', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const focusStore = new FocusStore(armazenamento);
  const sessao = {
    status: 'completed',
    type: 'focus',
    durationMs: DURACAO_PADRAO_MS,
    remainingMs: 0,
    endsAt: null,
    completedAt: 100,
    focusSessionsCompleted: 4,
    nextType: 'longBreak',
  };

  focusStore.salvar(sessao);
  const timer = new PomodoroTimer({ clock: () => 200, session: focusStore.carregar() });

  assert.deepEqual(timer.obterEstado(), sessao);
  assert.equal(timer.iniciarProximaEtapa(), true);
  assert.equal(timer.obterEstado().type, 'longBreak');
  assert.equal(timer.obterEstado().status, 'running');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 4);
});

test('migra sessão concluída da FOCUS-01 sem recontá-la após nova recuperação', () => {
  const legado = {
    status: 'completed',
    durationMs: DURACAO_PADRAO_MS,
    remainingMs: 0,
    endsAt: null,
    completedAt: 100,
  };
  const timer = new PomodoroTimer({ clock: () => 200, session: legado });

  assert.equal(timer.obterEstado().focusSessionsCompleted, 1);
  assert.equal(timer.obterEstado().nextType, 'shortBreak');
  const recuperado = new PomodoroTimer({ clock: () => 300, session: timer.obterEstado() });
  assert.equal(recuperado.obterEstado().focusSessionsCompleted, 1);
});

test('persiste a sessão em uma chave independente das tarefas', () => {
  const dados = new Map([['todolab:tarefas', '[{"id":"tarefa-1"}]']]);
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const focusStore = new FocusStore(armazenamento);
  const sessao = {
    status: 'paused',
    durationMs: 10_000,
    remainingMs: 4000,
    endsAt: null,
    completedAt: null,
  };

  focusStore.salvar(sessao);

  assert.deepEqual(focusStore.carregar(), sessao);
  assert.equal(dados.get('todolab:tarefas'), '[{"id":"tarefa-1"}]');
});
