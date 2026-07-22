import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialStats, GOD_REQUIRED_TITLE_IDS } from './constants.js';
import {
  COMPANY_DEFINITIONS,
  getCompanyProjectedGrossRevenue,
  getCompanyRiskChance,
} from './companies.js';
import { applyAction, applyPassMonth } from './gameLogic.js';
import { withSessionLock } from './sessionLock.js';
import { ARTIFACT_BOX_DEFINITIONS, ARTIFACT_DEFINITIONS, getArtifactEffects, MAX_EQUIPPED_ARTIFACTS } from './artifacts.js';

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

test('o relatório recebe somente o valor exato do evento mensal', () => {
  const originalRandom = Math.random;
  const rolls = [0.31, 0.20];
  Math.random = () => rolls.shift() ?? 0.5;

  try {
    const stats = createInitialStats('Teste');
    stats.saldo = 0;
    stats.salario = 10_000;
    stats.contas = 0;
    stats.comida = 10;

    const result = applyPassMonth(stats, []);

    assert.equal(result.flags?.monthlyEventBalanceChange, -2_000);
    assert.equal(stats.saldo, 8_000);
  } finally {
    Math.random = originalRandom;
  }
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

test('modo DEV local altera recursos e mês e marca a partida fora do ranking', () => {
  const previousSetting = process.env.ENABLE_DEV_TOOLS;
  process.env.ENABLE_DEV_TOOLS = 'true';

  try {
    const stats = createInitialStats('TesteDev');
    stats.unlockedTitles = ['CLT', 'GlobalPlayer'];
    stats.equippedTitle = 'GlobalPlayer';

    const result = applyAction({
      type: 'DEV_SET_STATS',
      saldo: 10_000_000,
      comida: 777,
      lenha: 333,
      mes: 120,
    }, stats, []);

    assert.equal(result.ok, true);
    assert.equal(result.stats?.saldo, 10_000_000);
    assert.equal(result.stats?.comida, 777);
    assert.equal(result.stats?.lenha, 333);
    assert.equal(result.stats?.mes, 120);
    assert.equal(result.stats?.devModeUsed, true);
    assert.equal(result.stats?.unlockedTitles.includes('GlobalPlayer'), false);
    assert.equal(result.stats?.equippedTitle, '');
  } finally {
    if (previousSetting === undefined) delete process.env.ENABLE_DEV_TOOLS;
    else process.env.ENABLE_DEV_TOOLS = previousSetting;
  }
});

test('modo DEV permanece bloqueado fora do servidor local', () => {
  const previousSetting = process.env.ENABLE_DEV_TOOLS;
  delete process.env.ENABLE_DEV_TOOLS;

  try {
    const stats = createInitialStats('TesteDevBloqueado');
    const result = applyAction({
      type: 'DEV_SET_STATS',
      saldo: 1_000,
      comida: 10,
      lenha: 10,
      mes: 10,
    }, stats, []);

    assert.equal(result.ok, false);
    assert.match(result.error ?? '', /desativadas/);
    assert.equal(stats.devModeUsed, false);
  } finally {
    if (previousSetting === undefined) delete process.env.ENABLE_DEV_TOOLS;
    else process.env.ENABLE_DEV_TOOLS = previousSetting;
  }
});

test('artefatos permanecem bloqueados antes da primeira aposentadoria', () => {
  const stats = createInitialStats('SemRebirth');
  stats.saldo = 1_000_000;
  assert.equal(applyAction({ type: 'BUY_ARTIFACT_BOX', boxType: 'basic' }, stats, []).ok, false);
  assert.equal(applyAction({ type: 'OPEN_ARTIFACT_BOX', boxType: 'basic' }, stats, []).ok, false);
  assert.deepEqual(stats.artifactBoxes, { basic: 0, premium: 0, elite: 0 });
});

test('primeira aposentadoria libera e concede uma caixa de artefato', () => {
  const stats = createInitialStats('Colecionador');
  stats.saldo = 10_000_000;

  const result = applyAction({ type: 'RETIRE' }, stats, []);

  assert.equal(result.ok, true);
  assert.equal(result.stats?.retirementCount, 1);
  assert.deepEqual(result.stats?.artifactBoxes, { basic: 1, premium: 0, elite: 0 });
  assert.deepEqual(result.stats?.artifactLevels, {});
  assert.deepEqual(result.stats?.equippedArtifacts, []);
});

test('abrir caixa entrega artefato e repetido aumenta o nível', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const stats = createInitialStats('Caixas');
    stats.retirementCount = 1;
    stats.artifactBoxes.basic = 2;

    const first = applyAction({ type: 'OPEN_ARTIFACT_BOX', boxType: 'basic' }, stats, []);
    const artifactId = first.flags?.artifactAwardedId;
    assert.equal(first.ok, true);
    assert.ok(artifactId);
    assert.equal(stats.artifactLevels[artifactId!], 1);
    assert.equal(first.flags?.artifactWasUpgrade, false);

    const second = applyAction({ type: 'OPEN_ARTIFACT_BOX', boxType: 'basic' }, stats, []);
    assert.equal(second.ok, true);
    assert.equal(second.flags?.artifactAwardedId, artifactId);
    assert.equal(second.flags?.artifactWasUpgrade, true);
    assert.equal(stats.artifactLevels[artifactId!], 2);
    assert.equal(stats.artifactBoxes.basic, 0);
  } finally {
    Math.random = originalRandom;
  }
});

test('cada tipo de caixa usa seu preço e seu inventário', () => {
  const stats = createInitialStats('LojaCaixas');
  stats.retirementCount = 1;
  stats.saldo = 3_000_000;

  assert.equal(applyAction({ type: 'BUY_ARTIFACT_BOX', boxType: 'basic' }, stats, []).ok, true);
  assert.equal(applyAction({ type: 'BUY_ARTIFACT_BOX', boxType: 'premium' }, stats, []).ok, true);
  assert.equal(applyAction({ type: 'BUY_ARTIFACT_BOX', boxType: 'elite' }, stats, []).ok, true);
  assert.equal(stats.saldo, 2_939_000);
  assert.deepEqual(stats.artifactBoxes, { basic: 1, premium: 1, elite: 1 });
});

test('cada caixa possui um catálogo exclusivo e a Básica não entrega acima de raro', () => {
  const allBoxItems = ARTIFACT_BOX_DEFINITIONS.flatMap(box => box.artifactIds);
  assert.equal(new Set(allBoxItems).size, allBoxItems.length);
  assert.deepEqual(new Set(allBoxItems), new Set(ARTIFACT_DEFINITIONS.map(artifact => artifact.id)));

  const basic = ARTIFACT_BOX_DEFINITIONS.find(box => box.id === 'basic')!;
  const basicRarities = basic.artifactIds.map(id => ARTIFACT_DEFINITIONS.find(artifact => artifact.id === id)?.rarity);
  assert.equal(basicRarities.every(rarity => rarity === 'Comum' || rarity === 'Raro'), true);
  assert.equal(basic.chances.Épico, 0);
  assert.equal(basic.chances.Lendário, 0);
});

test('comprar e abrir uma caixa acontece em uma única ação', () => {
  const stats = createInitialStats('CompraAutomatica');
  stats.retirementCount = 1;
  stats.saldo = 250_000;

  const result = applyAction({ type: 'BUY_AND_OPEN_ARTIFACT_BOX', boxType: 'basic' }, stats, []);
  assert.equal(result.ok, true);
  assert.equal(stats.saldo, 249_000);
  assert.equal(stats.artifactBoxes.basic, 0);
  assert.ok(result.flags?.artifactAwardedId);
});

test('botão único abre primeiro uma caixa que já estava guardada', () => {
  const stats = createInitialStats('CaixaGuardada');
  stats.retirementCount = 1;
  stats.saldo = 123_456;
  stats.artifactBoxes.premium = 1;

  const result = applyAction({ type: 'BUY_AND_OPEN_ARTIFACT_BOX', boxType: 'premium' }, stats, []);
  assert.equal(result.ok, true);
  assert.equal(stats.saldo, 123_456);
  assert.equal(stats.artifactBoxes.premium, 0);
});

test('caixa Elite pode entregar artefato lendário', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99995;
  try {
    const stats = createInitialStats('CaixaElite');
    stats.retirementCount = 1;
    stats.artifactBoxes.elite = 1;
    const result = applyAction({ type: 'OPEN_ARTIFACT_BOX', boxType: 'elite' }, stats, []);
    const artifact = ARTIFACT_DEFINITIONS.find(item => item.id === result.flags?.artifactAwardedId);
    assert.equal(result.ok, true);
    assert.equal(artifact?.rarity, 'Lendário');
  } finally {
    Math.random = originalRandom;
  }
});

test('jogador só pode equipar quatro artefatos', () => {
  const stats = createInitialStats('Equipamentos');
  stats.retirementCount = 1;
  const ownedIds = ARTIFACT_DEFINITIONS.slice(0, MAX_EQUIPPED_ARTIFACTS + 1).map(artifact => artifact.id);
  for (const artifactId of ownedIds) stats.artifactLevels[artifactId] = 1;

  for (const artifactId of ownedIds.slice(0, MAX_EQUIPPED_ARTIFACTS)) {
    assert.equal(applyAction({ type: 'TOGGLE_ARTIFACT', artifactId }, stats, []).ok, true);
  }
  assert.equal(stats.equippedArtifacts.length, MAX_EQUIPPED_ARTIFACTS);
  assert.equal(applyAction({ type: 'TOGGLE_ARTIFACT', artifactId: ownedIds[MAX_EQUIPPED_ARTIFACTS] }, stats, []).ok, false);

  assert.equal(applyAction({ type: 'TOGGLE_ARTIFACT', artifactId: ownedIds[0] }, stats, []).ok, true);
  assert.equal(applyAction({ type: 'TOGGLE_ARTIFACT', artifactId: ownedIds[MAX_EQUIPPED_ARTIFACTS] }, stats, []).ok, true);
  assert.equal(stats.equippedArtifacts.length, MAX_EQUIPPED_ARTIFACTS);
});

test('artefato equipado aplica bônus real ao salário mensal', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;

  try {
    const stats = createInitialStats('BonusSalario');
    stats.retirementCount = 1;
    stats.saldo = 0;
    stats.salario = 10_000;
    stats.contas = 0;
    stats.comida = 10;
    stats.artifactLevels['holerite-rubi'] = 1;
    stats.equippedArtifacts = ['holerite-rubi'];

    applyPassMonth(stats, []);
    assert.equal(stats.saldo, 11_330);
  } finally {
    Math.random = originalRandom;
  }
});

test('artefatos e caixas são preservados em novas aposentadorias', () => {
  const stats = createInitialStats('MetaColecao');
  stats.retirementCount = 1;
  stats.saldo = 20_000_000;
  stats.artifactBoxes.basic = 3;
  stats.artifactLevels['holerite-rubi'] = 2;
  stats.equippedArtifacts = ['holerite-rubi'];
  stats.unlockedTitles = ['GlobalPlayer'];
  stats.equippedTitle = 'GlobalPlayer';

  const result = applyAction({ type: 'RETIRE' }, stats, []);
  assert.equal(result.ok, true);
  assert.equal(result.stats?.artifactLevels['holerite-rubi'], 2);
  assert.deepEqual(result.stats?.equippedArtifacts, ['holerite-rubi']);
  assert.deepEqual(result.stats?.artifactBoxes, { basic: 4, premium: 0, elite: 0 });
  assert.equal(result.stats?.unlockedTitles.includes('GlobalPlayer'), false);
  assert.equal(result.stats?.equippedTitle, '');
});

test('GOD é removido quando um novo título obrigatório ainda não foi conquistado', () => {
  const stats = createInitialStats('GODAntigo');
  stats.unlockedTitles = [...GOD_REQUIRED_TITLE_IDS.filter(title => title !== 'Magnata'), 'GOD'];
  stats.equippedTitle = 'GOD';

  applyPassMonth(stats, []);

  assert.equal(stats.unlockedTitles.includes('GOD'), false);
  assert.equal(stats.equippedTitle, '');
});

test('primeira aposentadoria exige 10 milhões e preserva somente títulos permanentes', () => {
  const stats = createInitialStats('Teste');
  stats.saldo = 10_000_000;
  stats.mes = 240;
  stats.comida = 500;
  stats.lenha = 100;
  stats.poupanca = 2_000_000;
  stats.companies = [{ id: 'lanchonete', level: 3, employees: 8, strategy: 'balanced' }];
  stats.unlockedTitles = ['CLT', 'Magnata'];
  stats.equippedTitle = 'Magnata';

  const result = applyAction({ type: 'RETIRE' }, stats, []);

  assert.equal(result.ok, true);
  assert.equal(result.stats?.retirementCount, 1);
  assert.equal(result.stats?.saldo, 500);
  assert.equal(result.stats?.mes, 1);
  assert.equal(result.stats?.poupanca, 0);
  assert.deepEqual(result.stats?.companies, []);
  assert.ok(result.stats?.unlockedTitles.includes('CLT'));
  assert.ok(result.stats?.unlockedTitles.includes('Magnata'));
  assert.ok(result.stats?.unlockedTitles.includes('Aposentado'));
  assert.equal(result.stats?.equippedTitle, 'Magnata');
  assert.equal(result.events?.length, 1);
});

test('valor da aposentadoria dobra a cada novo rebirth', () => {
  const stats = createInitialStats('Teste');
  stats.retirementCount = 1;
  stats.saldo = 19_999_999;

  const blocked = applyAction({ type: 'RETIRE' }, stats, []);
  assert.equal(blocked.ok, false);
  assert.match(blocked.error ?? '', /20000000/);

  stats.saldo = 20_000_000;
  const allowed = applyAction({ type: 'RETIRE' }, stats, []);
  assert.equal(allowed.ok, true);
  assert.equal(allowed.stats?.retirementCount, 2);
});

test('aposentadorias aumentam permanentemente o salário mensal', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;

  try {
    const stats = createInitialStats('Teste');
    stats.retirementCount = 2;
    stats.saldo = 0;
    stats.salario = 10_000;
    stats.contas = 0;
    stats.comida = 10;

    applyPassMonth(stats, []);
    assert.equal(stats.saldo, 12_000);
  } finally {
    Math.random = originalRandom;
  }
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

test('empresa sem equipe gera manutenção, mas não gera receita', () => {
  const stats = createInitialStats('Teste');
  stats.retirementCount = 1;
  stats.saldo = 2_000_000;
  stats.salario = 0;
  stats.contas = 0;
  stats.comida = 10;

  const purchase = applyAction({ type: 'BUY_COMPANY', companyId: 'lanchonete' }, stats, []);
  assert.equal(purchase.ok, true);
  assert.equal(stats.saldo, 1_000_000);

  const month = applyPassMonth(stats, []);
  assert.equal(stats.saldo, 985_000);
  assert.equal(month.flags?.companyGrossRevenue, 0);
  assert.equal(month.flags?.companyOperatingCosts, 15_000);
  assert.equal(month.flags?.companyNetIncome, -15_000);
});

test('empresa completa paga funcionários, manutenção e renda passiva', () => {
  const stats = createInitialStats('Teste');
  stats.retirementCount = 1;
  stats.saldo = 2_000_000;
  stats.salario = 0;
  stats.contas = 0;
  stats.comida = 10;

  assert.equal(applyAction({ type: 'BUY_COMPANY', companyId: 'lanchonete' }, stats, []).ok, true);
  assert.equal(applyAction({ type: 'HIRE_EMPLOYEES', companyId: 'lanchonete', qty: 4 }, stats, []).ok, true);
  assert.equal(stats.saldo, 968_000);

  const month = applyPassMonth(stats, []);
  assert.equal(stats.saldo, 1_031_500);
  assert.equal(month.flags?.companyGrossRevenue, 94_500);
  assert.equal(month.flags?.companyOperatingCosts, 31_000);
  assert.equal(month.flags?.companyNetIncome, 63_500);
  assert.equal(month.flags?.operatingCompanies, 1);
});

test('aposentadorias aumentam permanentemente a receita das empresas', () => {
  const stats = createInitialStats('Teste');
  stats.retirementCount = 2;
  stats.saldo = 2_000_000;
  stats.salario = 0;
  stats.contas = 0;
  stats.comida = 10;

  assert.equal(applyAction({ type: 'BUY_COMPANY', companyId: 'lanchonete' }, stats, []).ok, true);
  assert.equal(applyAction({ type: 'HIRE_EMPLOYEES', companyId: 'lanchonete', qty: 4 }, stats, []).ok, true);

  const month = applyPassMonth(stats, []);
  assert.equal(month.flags?.companyGrossRevenue, 99_000);
  assert.equal(month.flags?.companyOperatingCosts, 31_000);
  assert.equal(month.flags?.companyNetIncome, 68_000);
});

test('melhoria aumenta o nível e a equipe necessária', () => {
  const stats = createInitialStats('Teste');
  stats.retirementCount = 1;
  stats.saldo = 3_000_000;

  assert.equal(applyAction({ type: 'BUY_COMPANY', companyId: 'lanchonete' }, stats, []).ok, true);
  assert.equal(applyAction({ type: 'UPGRADE_COMPANY', companyId: 'lanchonete' }, stats, []).ok, true);
  assert.equal(stats.companies[0].level, 2);
  assert.equal(stats.saldo, 1_400_000);

  assert.equal(applyAction({ type: 'HIRE_EMPLOYEES', companyId: 'lanchonete', qty: 6 }, stats, []).ok, true);
  assert.equal(stats.companies[0].employees, 6);
});

test('jogador pode escolher o modo de gestão da empresa', () => {
  const stats = createInitialStats('Teste');
  stats.retirementCount = 1;
  stats.saldo = 2_000_000;

  assert.equal(applyAction({ type: 'BUY_COMPANY', companyId: 'lanchonete' }, stats, []).ok, true);
  assert.equal(stats.companies[0].strategy, 'balanced');

  const result = applyAction({ type: 'SET_COMPANY_STRATEGY', companyId: 'lanchonete', strategy: 'aggressive' }, stats, []);
  assert.equal(result.ok, true);
  assert.equal(stats.companies[0].strategy, 'aggressive');
});

test('Seguro reduz lucro e risco; Pesado aumenta os dois', () => {
  const definition = COMPANY_DEFINITIONS.find(company => company.id === 'lanchonete');
  assert.ok(definition);

  const safeRevenue = getCompanyProjectedGrossRevenue(definition, 1, 'safe', 'Normal', true);
  const balancedRevenue = getCompanyProjectedGrossRevenue(definition, 1, 'balanced', 'Normal', true);
  const aggressiveRevenue = getCompanyProjectedGrossRevenue(definition, 1, 'aggressive', 'Normal', true);

  assert.ok(safeRevenue < balancedRevenue);
  assert.ok(balancedRevenue < aggressiveRevenue);
  assert.ok(getCompanyRiskChance('safe', 'Normal', true) < getCompanyRiskChance('balanced', 'Normal', true));
  assert.ok(getCompanyRiskChance('balanced', 'Normal', true) < getCompanyRiskChance('aggressive', 'Normal', true));
});

test('produtividade não altera mais lucro ou risco das empresas', () => {
  const definition = COMPANY_DEFINITIONS.find(company => company.id === 'lanchonete');
  assert.ok(definition);

  const normalRevenue = getCompanyProjectedGrossRevenue(definition, 1, 'balanced', 'Normal', true);
  const excellentRevenue = getCompanyProjectedGrossRevenue(definition, 1, 'balanced', 'Excelente', true);
  const normalRisk = getCompanyRiskChance('balanced', 'Normal', true);
  const excellentRisk = getCompanyRiskChance('balanced', 'Excelente', true);

  assert.equal(excellentRevenue, normalRevenue);
  assert.equal(excellentRisk, normalRisk);
});

test('aposentadoria possui limite de 10 rebirths', () => {
  const stats = createInitialStats('Veterano');
  stats.retirementCount = 10;
  stats.saldo = Number.MAX_SAFE_INTEGER;
  const result = applyAction({ type: 'RETIRE' }, stats, []);
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /limite de 10/i);
});

test('décimo rebirth desbloqueia o título Immortal One', () => {
  const stats = createInitialStats('Imortal');
  stats.retirementCount = 9;
  stats.saldo = 5_120_000_000;

  const result = applyAction({ type: 'RETIRE' }, stats, []);

  assert.equal(result.ok, true);
  assert.equal(result.stats?.retirementCount, 10);
  assert.equal(result.stats?.unlockedTitles.includes('ImmortalOne'), true);
});

test('incidente empresarial aparece no relatório e cobra seu efeito', () => {
  const stats = createInitialStats('RiscoTeste');
  stats.mes = 116;
  stats.saldo = 10_000_000;
  stats.salario = 0;
  stats.contas = 0;
  stats.comida = 1_000;
  stats.lenha = 1_000;
  stats.produtividade = 'Normal';
  stats.unlockedMechanics.produtividade = true;
  stats.companies = [{ id: 'lanchonete', level: 1, employees: 4, strategy: 'aggressive' }];

  const result = applyPassMonth(stats, []);

  assert.equal(result.flags?.companyIncidents?.length, 1);
  assert.match(result.flags?.companyIncidents?.[0] ?? '', /Lanchonete/);
  assert.ok((result.flags?.companyOperatingCosts ?? 0) > 31_000);
});

test('os novos artefatos aplicam seus limites e valores de nivel', () => {
  const stats = createInitialStats('Colecao');
  stats.retirementCount = 1;
  stats.artifactLevels = {
    'planner-acelerado': 5,
    'cartao-beneficios': 5,
    'cofre-dividendos': 5,
    'chave-conglomerado': 5,
  };
  stats.equippedArtifacts = Object.keys(stats.artifactLevels);
  const effects = getArtifactEffects(stats);
  assert.equal(effects.studyDoubleProgressChance, 0.30);
  assert.equal(effects.billsDiscount, 0.10);
  assert.equal(effects.savingsYieldBonus, 0.004);
  assert.equal(effects.conglomerateRevenuePerCompany, 0.025);
});
