import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialStats } from './constants.js';
import { applyAction, applyPassMonth } from './gameLogic.js';
import { withSessionLock } from './sessionLock.js';

test('o rendimento aumenta somente a poupança', () => {
  const stats = createInitialStats('Teste');
  stats.saldo = 0;
  stats.salario = 0;
  stats.contas = 0;
  stats.poupanca = 1_000;
  stats.comida = 10;

  applyPassMonth(stats, []);

  assert.equal(stats.poupanca, 1_007);
  assert.equal(stats.saldo, 0);
});

test('a morte fica gravada no estado da partida', () => {
  const stats = createInitialStats('Teste');
  stats.mes = 10;
  stats.salario = 0;
  stats.contas = 0;
  stats.comida = 10;
  stats.lenha = 0;

  const result = applyPassMonth(stats, []);

  assert.equal(result.gameOver, true);
  assert.equal(stats.gameOver, true);
  assert.match(stats.deathReason, /FRIO/);
});

test('Winter Warrior só é liberado depois de completar o inverno', () => {
  const beforeWinter = createInitialStats('Teste');
  beforeWinter.mes = 9;
  beforeWinter.salario = 0;
  beforeWinter.contas = 0;
  beforeWinter.comida = 10;
  applyPassMonth(beforeWinter, []);
  assert.equal(beforeWinter.unlockedTitles.includes('WinterWarrior'), false);

  const afterWinter = createInitialStats('Teste');
  afterWinter.mes = 12;
  afterWinter.salario = 0;
  afterWinter.contas = 0;
  afterWinter.comida = 10;
  afterWinter.lenha = 10;
  applyPassMonth(afterWinter, []);
  assert.equal(afterWinter.unlockedTitles.includes('WinterWarrior'), true);
});

test('curso bloqueado não pode ser iniciado antes do mês correto', () => {
  const stats = createInitialStats('Teste');
  const result = applyAction({ type: 'SELECT_COURSE', courseId: 'nutricao' }, stats, []);
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /mês 12/);
});

test('não permite pagar boletos quando não há dívida', () => {
  const stats = createInitialStats('Teste');
  stats.contasEmAtraso = 0;
  const result = applyAction({ type: 'PAY_BILLS', amount: 1 }, stats, []);
  assert.equal(result.ok, false);
  assert.equal(stats.saldo, 500);
});

test('comida continua sem limite de estoque', () => {
  const stats = createInitialStats('Teste');
  stats.saldo = 1_000_000;
  const result = applyAction({ type: 'BUY_FOOD', qty: 200 }, stats, []);
  assert.equal(result.ok, true);
  assert.equal(stats.comida, 205);
});

test('operações do mesmo save são executadas em sequência', async () => {
  let value = 0;
  await Promise.all(Array.from({ length: 20 }, () => withSessionLock('same-save', async () => {
    const previous = value;
    await new Promise(resolve => setTimeout(resolve, 1));
    value = previous + 1;
  })));
  assert.equal(value, 20);
});
