import assert from 'node:assert/strict';
import test from 'node:test';

import { FocusStore } from '../src/focus-store.js';
import { TodoStore } from '../src/store.js';
import {
  DURACAO_PADRAO_MS,
  DURACOES_SESSAO_MS,
  PomodoroTimer,
} from '../src/pomodoro.js';

function criarTimer({
  agora = 0,
  tipo = 'focus',
  duracao = 10_000,
  concluidos = 0,
  validarTarefa = () => true,
} = {}) {
  const timer = new PomodoroTimer({
    clock: () => agora,
    validarTarefa,
    session: {
      status: 'idle',
      type: tipo,
      durationMs: duracao,
      remainingMs: duracao,
      focusSessionsCompleted: concluidos,
    },
  });
  return { timer, agora: () => agora, definirAgora: (valor) => { agora = valor; } };
}

test('inicia em foco com duração padrão e transições básicas', () => {
  let agora = 1000;
  const timer = new PomodoroTimer({
    clock: () => agora,
    validarTarefa: (taskId) => taskId === 'tarefa-1',
  });

  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().type, 'focus');
  assert.equal(timer.obterEstado().durationMs, DURACAO_PADRAO_MS);
  assert.equal(timer.associarTarefa('tarefa-1'), true);
  assert.equal(timer.iniciar(), true);
  assert.equal(timer.iniciar(), false);

  agora += 5000;
  assert.equal(timer.obterEstado().remainingMs, DURACAO_PADRAO_MS - 5000);
  assert.equal(timer.pausar(), true);
  agora += 10000;
  assert.equal(timer.obterEstado().remainingMs, DURACAO_PADRAO_MS - 5000);
  assert.equal(timer.retomar(), true);
  assert.equal(timer.obterEstado().status, 'running');
});

test('conclusão de foco conta uma vez e disponibiliza pausa curta', () => {
  let agora = 100;
  const timer = new PomodoroTimer({
    clock: () => agora,
    validarTarefa: () => true,
    session: { status: 'idle', type: 'focus', durationMs: 2000, remainingMs: 2000 },
  });

  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  agora = 2100;
  assert.equal(timer.obterEstado().status, 'completed');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 1);
  assert.equal(timer.obterEstado().nextType, 'shortBreak');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 1);
});

test('foco concluído segue para pausa curta e depois volta ao foco', () => {
  const { timer, definirAgora } = criarTimer({ duracao: 1000 });
  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  definirAgora(1000);

  assert.equal(timer.obterEstado().status, 'completed');
  assert.equal(timer.iniciarProximaEtapa(), true);
  assert.equal(timer.obterEstado().type, 'shortBreak');
  assert.equal(timer.obterEstado().taskId, null);

  definirAgora(1000 + DURACOES_SESSAO_MS.shortBreak);
  assert.equal(timer.obterEstado().status, 'completed');
  assert.equal(timer.iniciarProximaEtapa(), true);
  assert.equal(timer.obterEstado().type, 'focus');
  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().taskId, null);
  assert.equal(timer.obterEstado().focusSessionsCompleted, 1);
  assert.equal(timer.iniciar(), false);
  assert.equal(timer.associarTarefa('tarefa-2'), true);
  assert.equal(timer.iniciar(), true);
});

test('dispõe pausa longa após o quarto foco e não conta a pausa', () => {
  let agora = 0;
  const timer = new PomodoroTimer({
    clock: () => agora,
    validarTarefa: () => true,
    session: { status: 'idle', type: 'focus', durationMs: 10, remainingMs: 10 },
  });

  for (let foco = 1; foco <= 4; foco += 1) {
    if (foco === 1) {
      assert.equal(timer.associarTarefa(`tarefa-${foco}`), true);
      assert.equal(timer.iniciar(), true);
    }
    agora = timer.obterEstado().endsAt;
    assert.equal(timer.obterEstado().focusSessionsCompleted, foco);
    assert.equal(timer.obterEstado().nextType, foco === 4 ? 'longBreak' : 'shortBreak');
    assert.equal(timer.iniciarProximaEtapa(), true);

    if (foco < 4) {
      assert.equal(timer.obterEstado().type, 'shortBreak');
      agora = timer.obterEstado().endsAt;
      assert.equal(timer.obterEstado().status, 'completed');
      assert.equal(timer.obterEstado().focusSessionsCompleted, foco);
      assert.equal(timer.iniciarProximaEtapa(), true);
      assert.equal(timer.obterEstado().type, 'focus');
      assert.equal(timer.obterEstado().status, 'idle');
      assert.equal(timer.associarTarefa(`tarefa-${foco + 1}`), true);
      assert.equal(timer.iniciar(), true);
    }
  }

  assert.equal(timer.obterEstado().type, 'longBreak');
  assert.equal(timer.obterEstado().durationMs, DURACOES_SESSAO_MS.longBreak);
  assert.equal(timer.obterEstado().focusSessionsCompleted, 4);
});

test('reiniciar preserva o tipo, contagem e tarefa da sessão de foco', () => {
  const { timer, definirAgora } = criarTimer();
  assert.equal(timer.associarTarefa('tarefa-1'), true);
  timer.iniciar();
  definirAgora(2500);
  timer.reiniciar();

  assert.equal(timer.obterEstado().status, 'idle');
  assert.equal(timer.obterEstado().type, 'focus');
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
  assert.equal(timer.obterEstado().focusSessionsCompleted, 0);
});

test('pausa e retomada preservam tipo, contagem e associação', () => {
  const { timer, definirAgora } = criarTimer({ tipo: 'focus', duracao: 10_000 });
  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  definirAgora(3000);
  timer.pausar();
  definirAgora(8000);

  assert.equal(timer.obterEstado().status, 'paused');
  assert.equal(timer.obterEstado().type, 'focus');
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
  assert.equal(timer.obterEstado().remainingMs, 7000);
  assert.equal(timer.retomar(), true);
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
});

test('associa e desassocia somente em foco idle', () => {
  const timer = new PomodoroTimer({
    validarTarefa: (taskId) => ['tarefa-1', 'tarefa-2'].includes(taskId),
  });
  assert.equal(timer.associarTarefa('tarefa-1'), true);
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
  assert.equal(timer.desassociarTarefa(), true);
  assert.equal(timer.obterEstado().taskId, null);

  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  assert.equal(timer.associarTarefa('tarefa-2'), false);
  assert.equal(timer.desassociarTarefa(), false);
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
});

test('bloqueia início de foco sem taskId válido ou tarefa pendente', () => {
  const pendentes = new Set(['tarefa-pendente']);
  const timer = new PomodoroTimer({
    validarTarefa: (taskId) => pendentes.has(taskId),
  });

  assert.equal(timer.iniciar(), false);
  assert.equal(timer.associarTarefa('tarefa-concluida'), false);
  assert.equal(timer.iniciar(), false);

  assert.equal(timer.associarTarefa('tarefa-pendente'), true);
  assert.equal(timer.iniciar(), true);
});

test('rejeita associação de tarefa concluída ou inexistente', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const store = new TodoStore(armazenamento);
  const pendente = store.adicionar('Pendente');
  const concluida = store.adicionar('Concluída');
  store.alternar(concluida.id);

  const timer = new PomodoroTimer({
    validarTarefa: (taskId) => store.estaDisponivel(taskId),
  });

  assert.equal(timer.associarTarefa(pendente.id), true);
  assert.equal(timer.associarTarefa(concluida.id), false);
  assert.equal(timer.associarTarefa('id-inexistente'), false);
  assert.equal(timer.obterEstado().taskId, pendente.id);
});

test('bloqueia início após concluir ou remover tarefa associada', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const store = new TodoStore(armazenamento);
  const tarefaConcluidaDepois = store.adicionar('Concluir depois');

  const timerConcluida = new PomodoroTimer({
    validarTarefa: (taskId) => store.estaDisponivel(taskId),
  });
  assert.equal(timerConcluida.associarTarefa(tarefaConcluidaDepois.id), true);
  store.alternar(tarefaConcluidaDepois.id);
  assert.equal(timerConcluida.iniciar(), false);

  const tarefaRemovidaDepois = store.adicionar('Remover depois');
  const timerRemovida = new PomodoroTimer({
    validarTarefa: (taskId) => store.estaDisponivel(taskId),
  });
  assert.equal(timerRemovida.associarTarefa(tarefaRemovidaDepois.id), true);
  store.remover(tarefaRemovidaDepois.id);
  assert.equal(timerRemovida.iniciar(), false);
});

test('integra o validador injetado ao TodoStore', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const store = new TodoStore(armazenamento);
  const pendente = store.adicionar('Pendente');
  const concluida = store.adicionar('Concluída');
  store.alternar(concluida.id);

  const validarTarefa = (taskId) => store.estaDisponivel(taskId);
  const timer = new PomodoroTimer({ validarTarefa });

  assert.equal(validarTarefa(pendente.id), true);
  assert.equal(validarTarefa(concluida.id), false);
  assert.equal(validarTarefa('id-inexistente'), false);
  assert.equal(timer.associarTarefa(pendente.id), true);
  assert.equal(timer.iniciar(), true);
});

test('permite iniciar intervalos sem tarefa', () => {
  for (const type of ['shortBreak', 'longBreak']) {
    const timer = new PomodoroTimer({
      validarTarefa: () => false,
      session: {
        status: 'idle',
        type,
        durationMs: 5000,
        remainingMs: 5000,
      },
    });

    assert.equal(timer.iniciar(), true);
  }
});

test('preserva taskId removida em sessões running e paused recuperadas', () => {
  const running = new PomodoroTimer({
    clock: () => 1000,
    validarTarefa: () => false,
    session: {
      status: 'running',
      type: 'focus',
      taskId: 'tarefa-removida',
      durationMs: 10000,
      endsAt: 9000,
    },
  });
  assert.equal(running.obterEstado().taskId, 'tarefa-removida');

  const paused = new PomodoroTimer({
    clock: () => 1000,
    validarTarefa: () => false,
    session: {
      status: 'paused',
      type: 'focus',
      taskId: 'tarefa-removida',
      durationMs: 10000,
      remainingMs: 4000,
    },
  });
  assert.equal(paused.obterEstado().taskId, 'tarefa-removida');
  assert.equal(paused.associarTarefa('tarefa-outra'), false);
  assert.equal(paused.desassociarTarefa(), false);
  assert.equal(paused.obterEstado().taskId, 'tarefa-removida');
});

test('descanso nunca possui associação e próximo foco não herda tarefa', () => {
  for (const type of ['shortBreak', 'longBreak']) {
    const timer = new PomodoroTimer({
      validarTarefa: () => true,
      session: { status: 'idle', type, taskId: 'tarefa-1', durationMs: 5000, remainingMs: 5000 },
    });
    assert.equal(timer.obterEstado().taskId, null);
    assert.equal(timer.associarTarefa('tarefa-2'), false);
  }

  const timer = new PomodoroTimer({ validarTarefa: () => true });
  timer.associarTarefa('tarefa-1');
  timer.iniciar();
  timer.reiniciar();
  assert.equal(timer.obterEstado().taskId, 'tarefa-1');
});

test('recupera sessões em execução, pausadas e concluídas com o ciclo', () => {
  const running = new PomodoroTimer({
    clock: () => 6000,
    session: {
      status: 'running', type: 'focus', taskId: 'tarefa-1',
      durationMs: 10000, endsAt: 9000, focusSessionsCompleted: 2,
    },
  });
  assert.equal(running.obterEstado().remainingMs, 3000);
  assert.equal(running.obterEstado().taskId, 'tarefa-1');

  const paused = new PomodoroTimer({
    clock: () => 50000,
    session: {
      status: 'paused', type: 'shortBreak', durationMs: 10000,
      remainingMs: 4000, focusSessionsCompleted: 3,
    },
  });
  assert.equal(paused.obterEstado().type, 'shortBreak');
  assert.equal(paused.obterEstado().taskId, null);
  assert.equal(paused.obterEstado().focusSessionsCompleted, 3);

  const completed = new PomodoroTimer({
    clock: () => 200,
    session: {
      status: 'completed', type: 'focus', taskId: 'tarefa-1',
      durationMs: 1000, remainingMs: 0, completedAt: 100,
      focusSessionsCompleted: 4, nextType: 'longBreak',
    },
  });
  assert.equal(completed.obterEstado().focusSessionsCompleted, 4);
  assert.equal(completed.obterEstado().nextType, 'longBreak');
});

test('taskId inválida é limpa na recuperação e a sessão válida é persistida', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const focusStore = new FocusStore(armazenamento);
  focusStore.salvar({
    status: 'idle', type: 'focus', taskId: 'tarefa-removida',
    durationMs: 10000, remainingMs: 10000,
  });

  const limparTarefaInexistente = (sessao, tarefas) =>
    sessao.taskId && !tarefas.some((tarefa) => tarefa.id === sessao.taskId)
      ? { ...sessao, taskId: null }
      : sessao;
  const recuperada = limparTarefaInexistente(focusStore.carregar(), []);
  const timer = new PomodoroTimer({ session: recuperada });
  assert.equal(timer.obterEstado().taskId, null);
});

test('persiste e recupera estado completo com associação', () => {
  const dados = new Map();
  const armazenamento = {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => dados.set(chave, valor),
  };
  const focusStore = new FocusStore(armazenamento);
  const timer = new PomodoroTimer({ validarTarefa: () => true });
  timer.associarTarefa('tarefa-1');
  focusStore.salvar(timer.obterEstado());

  const recuperado = new PomodoroTimer({ session: focusStore.carregar() });
  assert.equal(recuperado.obterEstado().taskId, 'tarefa-1');
  assert.equal(recuperado.obterEstado().focusSessionsCompleted, 0);
});
