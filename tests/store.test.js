import assert from 'node:assert/strict';
import test from 'node:test';
import { formatarPendencias } from '../src/store.js';

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