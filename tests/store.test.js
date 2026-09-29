import assert from 'node:assert/strict';
import test from 'node:test';
import { formatarPendencias, TodoStore } from '../src/store.js';

export function testarFormatacaoDePendencias() {
  assert.equal(formatarPendencias([]), '0 itens restantes');
  assert.equal(formatarPendencias([{ concluida: true }]), '0 itens restantes');
  assert.equal(formatarPendencias([{ concluida: false }]), '1 item restante');
  assert.equal(
    formatarPendencias([
      { concluida: false },
      { concluida: true },
      { concluida: false },
    ]),
    '2 itens restantes',
  );

  const tarefas = [{ concluida: false }, { concluida: true }];
  formatarPendencias(tarefas);
  assert.deepEqual(tarefas, [{ concluida: false }, { concluida: true }]);
}

test('formata corretamente a quantidade de tarefas pendentes', testarFormatacaoDePendencias);

export function testarAdicaoDeTarefas() {
  let gravacoes = 0;
  const armazenamento = {
    getItem() {
      return null;
    },
    setItem() {
      gravacoes += 1;
    },
  };
  const store = new TodoStore(armazenamento);
  const entradasInvalidas = ['', '   ', '\t\n', null, undefined, 42];

  for (const entrada of entradasInvalidas) {
    assert.equal(store.adicionar(entrada), null);
    assert.deepEqual(store.listar(), []);
    assert.equal(gravacoes, 0);
  }

  const tarefa = store.adicionar('  Comprar leite  ');
  assert.ok(tarefa);
  assert.equal(tarefa.titulo, '  Comprar leite  ');
  assert.equal(tarefa.concluida, false);
  assert.deepEqual(store.listar(), [tarefa]);
  assert.equal(gravacoes, 1);
}

test('impede tarefas vazias ou compostas apenas por espaços', testarAdicaoDeTarefas);