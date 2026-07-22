import { randomUUID } from 'node:crypto';
import {
  GameStats, GameEvent, ActionResult, DoencaAtiva,
  HappinessStatus, ProductivityStatus, HealthStatus, JobOffer, Season,
} from './types.js';
import {
  BASE_FOOD_PRICE, WOOD_PRICE, SAVINGS_YIELD, GRAUS_ACADEMICOS, CURSOS,
  ACOES_SAUDE, LAZER_ATIVIDADES, DOENCAS, CARGOS, EMPRESAS, GOD_REQUIRED_TITLE_IDS, createInitialStats,
} from './constants.js';
import {
  COMPANY_DEFINITIONS, getCompanyMaintenance, getCompanyProjectedGrossRevenue,
  getCompanyRequiredEmployees, getCompanyRiskChance, getCompanyStrategy, getCompanyUpgradeCost,
  getEmployeeHiringCost,
} from './companies.js';
import {
  ARTIFACT_BOX_DEFINITIONS, ARTIFACT_DEFINITIONS, MAX_ARTIFACT_LEVEL, MAX_EQUIPPED_ARTIFACTS,
  getArtifactBoxPrice, getArtifactEffects, pickArtifact,
} from './artifacts.js';

const MAX_SAVINGS = 1_000_000_000;

// ============================================================
// HELPERS
// ============================================================

function rand() { return Math.random(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

export const RETIREMENT_BASE_REQUIREMENT = 10_000_000;

export function getRetirementRequirement(retirementCount: number): number {
  const safeCount = Math.max(0, Math.floor(retirementCount));
  return RETIREMENT_BASE_REQUIREMENT * (2 ** safeCount);
}

function getRetirementSalaryMultiplier(stats: GameStats): number {
  return 1 + stats.retirementCount * 0.10;
}

function getRetirementCompanyMultiplier(stats: GameStats): number {
  return 1 + stats.retirementCount * 0.05;
}

function addEvent(events: GameEvent[], message: string, type: GameEvent['type']): void {
  events.push({ id: randomUUID(), timestamp: Date.now(), message, type });
}

function getSeason(mes: number): Season {
  const cycle = ((mes - 1) % 12) + 1;
  if (cycle <= 3) return 'Primavera';
  if (cycle <= 6) return 'Verão';
  if (cycle <= 9) return 'Outono';
  return 'Inverno';
}

function getCurrentFoodPrice(stats: GameStats): number {
  const season = getSeason(stats.mes);
  let price = season === 'Outono' ? BASE_FOOD_PRICE / 1.5 : BASE_FOOD_PRICE;
  const interestRate = getInterestRate(stats);
  if (interestRate >= 24) price *= 2.0;
  else if (interestRate >= 17) price *= 1.4;
  return price * (1 - Math.min(0.75, stats.cursoBenefits.foodDiscount));
}

function getDiscountedPurchasePrice(stats: GameStats, basePrice: number): number {
  return Math.max(0, Math.floor(basePrice * (1 - getArtifactEffects(stats).allPricesDiscount)));
}

function getLifestylePrice(stats: GameStats, basePrice: number): number {
  const wealthSurcharge = Math.min(1_000_000, Math.floor(Math.max(0, stats.saldo - 100_000) * 0.0025));
  return getDiscountedPurchasePrice(stats, basePrice + wealthSurcharge);
}

function getInterestRate(stats: GameStats): number {
  if (stats.mesesEmAtraso < 5) return 0;
  return 10 + (stats.mesesEmAtraso - 5) * 7;
}

function addDebtNotifications(stats: GameStats): void {
  const rate = getInterestRate(stats);
  const notifications = [
    { threshold: 10, subject: 'Comunicado: Início de Incidência de Juros', body: 'Seu débito saiu do período de carência e agora recebe juros mensais. Regularize os boletos o quanto antes.' },
    { threshold: 17, subject: 'Alerta de Risco de Crédito: Nível Amarelo', body: 'Seu risco de crédito elevou em 40% o preço dos alimentos.' },
    { threshold: 24, subject: 'Restrição Severa de Crédito e Consumo', body: 'Sua inadimplência dobrou o preço dos itens de subsistência.' },
    { threshold: 31, subject: 'Notificação Judicial: Mandado de Penhora', body: 'Uma penhora de 20% passou a incidir sobre seu salário.' },
    { threshold: 45, subject: 'Ordem de Bloqueio de Ativos', body: 'A penhora subiu para 40% e novas aplicações financeiras foram bloqueadas.' },
    { threshold: 59, subject: 'Suspensão de Crédito Educativo', body: 'Seus estudos foram bloqueados e os custos fixos aumentaram 20%.' },
  ];

  for (const notification of notifications) {
    const id = `punishment-${notification.threshold}`;
    if (rate >= notification.threshold && !stats.emails.some(email => email.id === id)) {
      stats.emails.unshift({
        id,
        sender: 'Notificações Banco Central',
        subject: notification.subject,
        body: notification.body,
        timestamp: Date.now(),
        read: false,
      });
    }
  }
}

// ============================================================
// TITLE CHECKS
// ============================================================

function checkTitles(stats: GameStats, events: GameEvent[]): void {
  const unlock = (id: string, msg: string) => {
    if (!stats.unlockedTitles.includes(id)) {
      stats.unlockedTitles.push(id);
      addEvent(events, `🏆 Título desbloqueado: ${id}! ${msg}`, 'career');
    }
  };

  if (stats.mes > 1)                          unlock('CLT',          'Passe o 1° mês!');
  if (stats.totalFoodBought >= 100)            unlock('Gorducho',     '100 comidas compradas!');
  if (stats.hasBoughtStock)                    unlock('Investidor',   'Primeira ação comprada!');
  if (stats.hasBoughtCrypto)                   unlock('CryptoMaster', 'Primeira cripto comprada!');
  if (stats.companies.length >= 1)             unlock('Empresario',   'Primeira empresa comprada!');
  if (stats.nivelCurriculo >= 1)               unlock('Diplomado',    'Graduação concluída!');
  if (stats.nivelCurriculo >= 5)               unlock('Doctor',       'Toda a faculdade concluída!');
  if (stats.saldo >= 1_000_000_000)            unlock('Magnata',      'R$ 1 bilhão de saldo!');
  if (stats.saldo >= 1000000)                  unlock('OneMillion',   'R$ 1.000.000!');
  if (stats.mes >= 100)                        unlock('CLThanos',     '100 meses de trabalho!');
  if (CURSOS.every(curso => stats.cursosCompletos.includes(curso.id))) {
    unlock('Sabido', 'Todos os cursos concluídos!');
  }

  // WinterWarrior: completou os três meses do primeiro inverno.
  if ((stats.artifactBoxesOpened ?? 0) >= 1_000) unlock('Unboxer', '1.000 caixas abertas!');
  if ((stats.artifactBoxesOpened ?? 0) >= 10_000) unlock('NoLife', '10.000 caixas abertas!');
  if ((stats.retirementCount ?? 0) >= 10) unlock('ImmortalOne', 'Todos os 10 rebirths concluídos!');
  const regularArtifacts = ARTIFACT_DEFINITIONS.filter(artifact => artifact.rarity !== 'Divinity');
  if (regularArtifacts.every(artifact => (stats.artifactLevels[artifact.id] ?? 0) > 0)) {
    unlock('Colecionador', 'Index de artefatos completo!');
  }

  if (stats.mes >= 13) unlock('WinterWarrior', 'Sobreviveu ao inverno!');

  // O GOD é dinâmico: títulos novos passam a ser requisitos e exclusivos ficam de fora.
  if (GOD_REQUIRED_TITLE_IDS.every(id => stats.unlockedTitles.includes(id))) {
    unlock('GOD', 'Todos os títulos conquistados!');
  } else if (stats.unlockedTitles.includes('GOD')) {
    stats.unlockedTitles = stats.unlockedTitles.filter(title => title !== 'GOD');
    if (stats.equippedTitle === 'GOD') stats.equippedTitle = '';
    addEvent(events, 'O título GOD foi removido porque ainda faltam títulos obrigatórios.', 'neutral');
  }
}

// ============================================================
// HEALTH SYSTEM
// ============================================================

function getHealthCategory(value: number): HealthStatus {
  if (value >= 85) return 'Excelente';
  if (value >= 60) return 'Saudável';
  if (value >= 40) return 'Cansado';
  if (value >= 20) return 'Exausto';
  return 'Doente';
}

function getDiseaseChance(value: number): number {
  if (value >= 80) return 0;
  if (value >= 60) return 0.02;
  if (value >= 40) return 0.05;
  if (value >= 20) return 0.10;
  return 0.20;
}

function pickDisease(saudeValue: number, salario: number): DoencaAtiva {
  const severityBias = Math.max(0, (60 - saudeValue) / 60);
  const weights = DOENCAS.map((_, i) => 1 + severityBias * i * 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  let chosen = DOENCAS[0];
  for (let i = 0; i < DOENCAS.length; i++) {
    r -= weights[i];
    if (r <= 0) { chosen = DOENCAS[i]; break; }
  }
  const custoRaw = salario * chosen.multiplicador;
  const custo = clamp(custoRaw, chosen.min, chosen.max);
  return { id: chosen.id, nome: chosen.nome, emoji: chosen.emoji, custo };
}

// ============================================================
// HAPPINESS SYSTEM
// ============================================================

function getHumorFromMorale(m: number): HappinessStatus {
  if (m <= 15) return 'Triste';
  if (m <= 35) return 'Desanimado';
  if (m <= 60) return 'Normal';
  if (m <= 80) return 'Feliz';
  return 'Radiante';
}

function getHappinessGainScaled(baseGain: number, salario: number): number {
  const factor = Math.max(0.15, 1 - (salario / 50000) * 0.85);
  return Math.round(baseGain * factor);
}

// ============================================================
// PRODUCTIVITY SYSTEM
// ============================================================

function getProdutividadeFromPerformance(p: number): ProductivityStatus {
  if (p <= 15) return 'Péssima';
  if (p <= 35) return 'Baixa';
  if (p <= 60) return 'Normal';
  if (p <= 80) return 'Alta';
  return 'Excelente';
}

const PRODUTIVIDADE_SALARY_MOD: Record<ProductivityStatus, number> = {
  'Excelente': 1.05, 'Alta': 1.02, 'Normal': 1.00, 'Baixa': 0.97, 'Péssima': 0.94,
};

// ============================================================
// STOCK MARKET
// ============================================================

function updateAssetPrices(assets: GameStats['stocks']): void {
  for (const asset of assets) {
    const change = 1 + (rand() * 2 - 1) * asset.volatility;
    asset.price = Math.max(0.01, parseFloat((asset.price * change).toFixed(2)));
    asset.history.push(asset.price);
    if (asset.history.length > 12) asset.history.shift();
  }
}

function getDeterministicCompanyRoll(stats: GameStats, companyId: string, salt: string): number {
  const input = `${stats.playerNick}|${stats.mes}|${companyId}|${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function processCompanies(stats: GameStats, events: GameEvent[]): {
  grossRevenue: number;
  operatingCosts: number;
  netIncome: number;
  operatingCompanies: number;
  incidents: string[];
} {
  let grossRevenue = 0;
  let operatingCosts = 0;
  let operatingCompanies = 0;
  const incidents: string[] = [];
  const artifactEffects = getArtifactEffects(stats);
  const operatingCompanyCount = stats.companies.filter(company => {
    const definition = COMPANY_DEFINITIONS.find(item => item.id === company.id);
    return !!definition && company.employees >= getCompanyRequiredEmployees(definition, company.level);
  }).length;
  const conglomerateBonus = Math.min(0.20, artifactEffects.conglomerateRevenuePerCompany * operatingCompanyCount);

  for (const company of stats.companies) {
    const definition = COMPANY_DEFINITIONS.find(item => item.id === company.id);
    if (!definition) continue;

    const requiredEmployees = getCompanyRequiredEmployees(definition, company.level);
    const maintenance = Math.floor(getCompanyMaintenance(definition, company.level) * (1 - artifactEffects.companyMaintenanceDiscount) * (1 - artifactEffects.companyOperatingCostDiscount) * (1 - artifactEffects.allPricesDiscount));
    const payroll = Math.floor(company.employees * definition.salaryPerEmployee * (1 - artifactEffects.companyOperatingCostDiscount));
    let incidentCost = 0;
    let revenueMultiplier = 1;
    let employeesLeaving = 0;

    if (company.employees >= requiredEmployees) {
      let companyGrossRevenue = getCompanyProjectedGrossRevenue(
        definition,
        company.level,
        company.strategy,
        stats.produtividade,
        stats.unlockedMechanics.produtividade,
      );
      companyGrossRevenue = Math.floor(companyGrossRevenue * getRetirementCompanyMultiplier(stats));
      companyGrossRevenue = Math.floor(companyGrossRevenue * (1 + artifactEffects.companyRevenueBonus + conglomerateBonus));
      const incidentSeverity = getCompanyStrategy(company.strategy).incidentSeverityMultiplier;
      const riskChance = getCompanyRiskChance(
        company.strategy,
        stats.produtividade,
        stats.unlockedMechanics.produtividade,
      ) * (1 - artifactEffects.companyRiskReduction);

      if (getDeterministicCompanyRoll(stats, company.id, 'risk') < riskChance) {
        if (getDeterministicCompanyRoll(stats, company.id, 'incident-cancel') < artifactEffects.companyIncidentCancelChance) {
          incidents.push(`${definition.name}: Seguro Sist\u00eamico evitou um incidente.`);
        } else {
        const incidentType = Math.floor(getDeterministicCompanyRoll(stats, company.id, 'incident') * 8);
        if (incidentType === 0) {
          employeesLeaving = getDeterministicCompanyRoll(stats, company.id, 'retention') < artifactEffects.employeeRetentionChance
            ? 0
            : Math.max(1, Math.ceil(requiredEmployees * 0.15 * incidentSeverity));
          if (employeesLeaving === 0) incidents.push(`${definition.name}: Manual de Reten\u00e7\u00e3o evitou demiss\u00f5es.`);
          else {
          incidents.push(`${definition.name}: ${employeesLeaving} funcionário(s) pediram demissão.`);
          }
        } else if (incidentType === 1) {
          incidentCost = Math.floor(maintenance * 2 * incidentSeverity * (1 - artifactEffects.negativeEventCostReduction));
          incidents.push(`${definition.name}: equipamentos quebraram e o reparo custou R$ ${incidentCost}.`);
        } else if (incidentType === 2) {
          incidentCost = Math.floor(companyGrossRevenue * 0.18 * incidentSeverity * (1 - artifactEffects.negativeEventCostReduction));
          incidents.push(`${definition.name}: uma fiscalização aplicou multa de R$ ${incidentCost}.`);
        } else if (incidentType === 3) {
          const revenueLoss = Math.min(0.90, 0.30 * incidentSeverity);
          revenueMultiplier = 1 - revenueLoss;
          incidents.push(`${definition.name}: problemas operacionais reduziram a receita em ${Math.round(revenueLoss * 100)}%.`);
        } else if (incidentType === 4) {
          const revenueLoss = Math.min(0.95, 0.45 * incidentSeverity);
          revenueMultiplier = 1 - revenueLoss;
          incidents.push(`${definition.name}: uma greve paralisou parte da operação e reduziu a receita em ${Math.round(revenueLoss * 100)}%.`);
        } else if (incidentType === 5) {
          incidentCost = Math.floor(maintenance * 1.5 * incidentSeverity * (1 - artifactEffects.negativeEventCostReduction));
          incidents.push(`${definition.name}: fornecedores reajustaram os preços e geraram R$ ${incidentCost} em custos extras.`);
        } else if (incidentType === 6) {
          incidentCost = Math.floor(Math.min(companyGrossRevenue * 0.25, maintenance * 6) * incidentSeverity * (1 - artifactEffects.negativeEventCostReduction));
          incidents.push(`${definition.name}: uma fraude interna causou prejuízo de R$ ${incidentCost}.`);
        } else {
          const revenueLoss = Math.min(0.95, 0.50 * incidentSeverity);
          revenueMultiplier = 1 - revenueLoss;
          incidents.push(`${definition.name}: uma crise de reputação afastou clientes e reduziu a receita em ${Math.round(revenueLoss * 100)}%.`);
        }
        }
      }

      companyGrossRevenue = Math.floor(companyGrossRevenue * revenueMultiplier);
      grossRevenue += companyGrossRevenue;
      operatingCompanies += 1;
    }

    operatingCosts += maintenance + payroll + incidentCost;
    if (employeesLeaving > 0) company.employees = Math.max(0, company.employees - employeesLeaving);
  }

  const netIncome = grossRevenue - operatingCosts;
  stats.saldo += netIncome;

  if (stats.companies.length > 0) {
    const inactive = stats.companies.length - operatingCompanies;
    const inactiveText = inactive > 0 ? ` ${inactive} empresa(s) ficaram sem receita por falta de funcionários.` : '';
    addEvent(
      events,
      `🏢 Empresas: receita R$ ${grossRevenue}, custos R$ ${operatingCosts}, resultado ${netIncome >= 0 ? '+' : '-'}R$ ${Math.abs(netIncome)}.${inactiveText}`,
      netIncome >= 0 ? 'positive' : 'negative',
    );
  }

  for (const incident of incidents) addEvent(events, `⚠️ ${incident}`, 'negative');

  return { grossRevenue, operatingCosts, netIncome, operatingCompanies, incidents };
}

// ============================================================
// JOB OFFER GENERATION
// ============================================================

function generateJobOffer(stats: GameStats): JobOffer {
  const level = clamp(stats.nivelCurriculo, 0, CARGOS.length - 1);
  const baseSal = GRAUS_ACADEMICOS[level]?.salBase ?? 1600;
  const salario = Math.floor(baseSal * (0.9 + rand() * 0.25));
  return {
    id: randomUUID(),
    cargo: CARGOS[level],
    empresa: pick(EMPRESAS),
    salario,
    contas: Math.floor(salario * 0.60),
    nivelExigido: level,
  };
}

// ============================================================
// MONTHLY EVENTS
// ============================================================

interface MonthlyEvent {
  nome: string;
  desc: string;
  type: 'positive' | 'negative' | 'neutral';
  saldoMult?: number;    // multiplier on salario
  billsMult?: number;    // multiplier on monthly bills
}

function buildMonthlyEvents(stats: GameStats): { good: MonthlyEvent[]; bad: MonthlyEvent[]; neutral: MonthlyEvent[] } {
  const sal = stats.salario;
  const good: MonthlyEvent[] = [
    { nome: 'Funcionário do Mês',         desc: 'Seu esforço foi reconhecido!',                      type: 'positive', saldoMult: 0.15 },
    { nome: 'Projeto Entregue no Prazo',  desc: 'Seu chefe ficou satisfeito e deu um bônus.',        type: 'positive', saldoMult: 0.10 },
    { nome: 'Depósito Extra',             desc: 'Seu salário veio um pouco maior esse mês.',          type: 'positive', saldoMult: 0.05 },
    { nome: 'Conta de Luz Mais Barata',   desc: 'As chuvas reduziram a tarifa de energia.',           type: 'positive', billsMult: 0.92 },
    { nome: 'Achado Inesperado',          desc: 'Você encontrou dinheiro perdido.',                   type: 'positive', saldoMult: 0.08 },
    { nome: 'Dia de Sorte',               desc: 'Tudo correu bem e você se sente animado.',           type: 'positive', saldoMult: 0.03 },
    { nome: 'Prêmio na Loteria Pequena',  desc: 'Uma raspadinha te deu um prêmio simples.',           type: 'positive', saldoMult: 0.20 },
    { nome: 'Freelance Extra',            desc: 'Um bico rápido trouxe uma renda a mais.',            type: 'positive', saldoMult: 0.12 },
  ];
  const bad: MonthlyEvent[] = [
    { nome: 'Multa de Trânsito',          desc: 'Você foi multado no trânsito.',                      type: 'negative', saldoMult: -0.08 },
    { nome: 'Eletrodoméstico Quebrou',    desc: 'A geladeira pifou e custou caro para consertar.',    type: 'negative', saldoMult: -0.20 },
    { nome: 'Farmácia Cara',              desc: 'Você teve que comprar remédios inesperados.',         type: 'negative', saldoMult: -0.05 },
    { nome: 'Conta Extra',               desc: 'Uma conta que você não esperava chegou.',             type: 'negative', billsMult: 1.20  },
    { nome: 'Mês Mais Caro',             desc: 'As despesas mensais subiram inesperadamente.',        type: 'negative', billsMult: 1.10  },
    { nome: 'Roubaram seu Celular',      desc: 'Você perdeu o celular e teve que comprar outro.',     type: 'negative', saldoMult: -0.15 },
    { nome: 'Doente Demais pra Trabalhar', desc: 'Você ficou de atestado e perdeu dias de trabalho.',type: 'negative', saldoMult: -0.05 },
  ];
  const neutral: MonthlyEvent[] = [
    { nome: 'Mês Normal',               desc: 'Mais um mês de rotina CLT.',                         type: 'neutral' },
    { nome: 'Reunião Improdutiva',       desc: 'Horas de reunião que poderiam ser um e-mail.',       type: 'neutral' },
    { nome: 'Coffee Break Filosófico',   desc: 'Você e o estagiário refletiram sobre a vida.',       type: 'neutral' },
    { nome: 'Meme Viral na Firma',       desc: 'Um meme sobre trabalho dominou o grupo da empresa.', type: 'neutral' },
  ];
  return { good, bad, neutral };
}

// ============================================================
// PASS MONTH — lógica principal do tick mensal
// ============================================================

export function applyPassMonth(stats: GameStats, events: GameEvent[]): {
  flags: ActionResult['flags'];
  gameOver: boolean;
  deathReason: string;
} {
  const flags: ActionResult['flags'] = {};
  if (stats.gameOver) {
    return { flags, gameOver: true, deathReason: stats.deathReason || 'Sua jornada terminou.' };
  }
  const season = getSeason(stats.mes);
  const interestRate = getInterestRate(stats);
  const isDoente = !!stats.doencaAtiva;
  const artifactEffects = getArtifactEffects(stats);

  // ── Event selection ──────────────────────────────────────
  const { good, bad, neutral } = buildMonthlyEvents(stats);
  const goodProb  = interestRate >= 24 ? 0.35 : 0.30;
  const badProb   = (interestRate >= 24 ? 0.25 : 0.30) + (isDoente ? 0.15 : 0);
  const roll = rand();
  let selectedEvent: MonthlyEvent;
  if (roll < goodProb)                  selectedEvent = pick(good);
  else if (roll < goodProb + badProb)   selectedEvent = pick(bad);
  else                                  selectedEvent = pick(neutral);

  let eventBillsMult = selectedEvent.billsMult ?? 1.0;
  if (selectedEvent.type === 'negative' && eventBillsMult > 1) {
    eventBillsMult = 1 + (eventBillsMult - 1) * (1 - artifactEffects.negativeEventCostReduction);
  }
  let bonusSaldo = 0;
  if (selectedEvent.saldoMult) {
    bonusSaldo = Math.floor(stats.salario * selectedEvent.saldoMult);
    if (bonusSaldo < 0) bonusSaldo = Math.ceil(bonusSaldo * (1 - artifactEffects.negativeEventCostReduction));
  }
  flags.monthlyEventBalanceChange = bonusSaldo;

  // ── Salary calculation ───────────────────────────────────
  let salaryPenalty = 1;
  if (interestRate >= 45) salaryPenalty = 0.60;
  else if (interestRate >= 31) salaryPenalty = 0.80;
  let actualSalary = Math.floor(stats.salario * salaryPenalty);
  if (season === 'Verão') actualSalary = Math.floor(actualSalary * 0.7);
  actualSalary = Math.floor(actualSalary * (1 + stats.roomUpgrades.escritorio * 0.05));
  if (stats.unlockedMechanics.produtividade) {
    actualSalary = Math.floor(actualSalary * PRODUTIVIDADE_SALARY_MOD[stats.produtividade]);
  }
  actualSalary = Math.floor(actualSalary * getRetirementSalaryMultiplier(stats));
  actualSalary = Math.floor(actualSalary * (1 + artifactEffects.salaryBonus));

  // ── Monthly bills ────────────────────────────────────────
  const costOfLivingMultiplier = interestRate >= 59 ? 1.20 : 1;
  const monthlyBillsAdded = Math.floor(stats.contas * costOfLivingMultiplier * eventBillsMult * (1 - artifactEffects.billsDiscount) * (1 - artifactEffects.allPricesDiscount));
  const rendimento = stats.poupanca * (SAVINGS_YIELD + stats.roomUpgrades.sala * 0.001 + artifactEffects.savingsYieldBonus);
  stats.poupanca = Math.min(MAX_SAVINGS, stats.poupanca + rendimento);

  // ── Unlock mechanics ─────────────────────────────────────
  stats.mes += 1;
  stats.saldo += actualSalary + bonusSaldo;
  const companyResult = processCompanies(stats, events);
  flags.companyGrossRevenue = companyResult.grossRevenue;
  flags.companyOperatingCosts = companyResult.operatingCosts;
  flags.companyNetIncome = companyResult.netIncome;
  flags.operatingCompanies = companyResult.operatingCompanies;
  flags.companyIncidents = companyResult.incidents;
  stats.contasEmAtraso += monthlyBillsAdded;
  if (stats.contasEmAtraso > 0) stats.mesesEmAtraso += 1;
  else stats.mesesEmAtraso = 0;

  if (interestRate > 0) {
    const juros = Math.floor(stats.contas * (interestRate / 100));
    stats.contasEmAtraso += juros;
  }
  addDebtNotifications(stats);

  let mechUnlocked: typeof flags.mechUnlocked = undefined;
  const cycle = ((stats.mes - 1) % 12) + 1;
  if (stats.mes === 12 && !stats.unlockedMechanics.saude) {
    stats.unlockedMechanics.saude = true; mechUnlocked = 'saude';
  }
  if (stats.mes === 24 && !stats.unlockedMechanics.felicidade) {
    stats.unlockedMechanics.felicidade = true; mechUnlocked = 'felicidade';
  }
  if (stats.mes === 36 && !stats.unlockedMechanics.produtividade) {
    stats.unlockedMechanics.produtividade = true; mechUnlocked = 'produtividade';
  }
  if (mechUnlocked) flags.mechUnlocked = mechUnlocked;
  if (!Array.isArray(stats.seenSeasonNotices)) stats.seenSeasonNotices = [];
  if ([1, 4, 7, 10].includes(cycle)) {
    const newSeason = getSeason(stats.mes);
    if (!stats.seenSeasonNotices.includes(newSeason)) {
      stats.seenSeasonNotices.push(newSeason);
      flags.seasonNotice = newSeason;
    }
  }

  // ── Food & wood consumption ───────────────────────────────
  stats.comida = Math.max(0, stats.comida - 1);
  if (season === 'Inverno') {
    if (stats.lenha <= 0) {
      stats.gameOver = true;
      stats.deathReason = 'FRIO: Falta de lenha no inverno rigoroso. Sua casa congelou.';
      return { flags, gameOver: true, deathReason: stats.deathReason };
    }
    stats.lenha -= 1;
  }

  // ── Health ───────────────────────────────────────────────
  let novaDoenca = false;
  if (stats.unlockedMechanics.saude) {
    let delta = -1;
    if (season === 'Inverno') delta -= 2;
    if (isDoente) delta -= 5;
    const reduction = Math.min(0.85, stats.cursoBenefits.healthDecayReduction);
    if (reduction > 0) delta = Math.round(delta * (1 - reduction));
    stats.saudeValue = clamp(stats.saudeValue + delta, 0, 100);

    if (stats.saudeValue <= 0) {
      stats.gameOver = true;
      stats.deathReason = 'COLAPSO DE SAÚDE: Seu corpo não resistiu.';
      return { flags, gameOver: true, deathReason: stats.deathReason };
    }
    if (!stats.doencaAtiva) {
      const chance = getDiseaseChance(stats.saudeValue);
      if (rand() < chance) {
        stats.doencaAtiva = pickDisease(stats.saudeValue, stats.salario);
        novaDoenca = true;
        flags.novaDoenca = true;
      }
    }
  }
  if (novaDoenca) addEvent(events, `🤒 Você ficou doente: ${stats.doencaAtiva!.nome}. Tratamento: R$ ${stats.doencaAtiva!.custo}`, 'negative');

  const novaSaudeCategoria = getHealthCategory(stats.saudeValue);

  // ── Happiness ────────────────────────────────────────────
  if (stats.unlockedMechanics.felicidade) {
    let deltaMorale = 0;
    if (stats.saldo < 0)                              deltaMorale -= 10;
    else if (stats.saldo < 500)                       deltaMorale -= 5;
    else if (stats.saldo > stats.salario * 3)         deltaMorale += 3;
    if (novaSaudeCategoria === 'Doente')              deltaMorale -= 8;
    else if (novaSaudeCategoria === 'Exausto')        deltaMorale -= 4;
    else if (novaSaudeCategoria === 'Excelente')      deltaMorale += 3;
    if (stats.doencaAtiva)                            deltaMorale -= 5;
    if (selectedEvent.type === 'positive')            deltaMorale += 6;
    if (selectedEvent.type === 'negative')            deltaMorale -= 6;
    deltaMorale -= Math.max(0, 2 - stats.cursoBenefits.happinessDecayReduction);
    stats.morale = clamp(stats.morale + deltaMorale, 0, 100);
    stats.humor  = getHumorFromMorale(stats.morale);
  }

  // ── Productivity ─────────────────────────────────────────
  if (stats.unlockedMechanics.produtividade) {
    let deltaPerf = 0;
    if (novaSaudeCategoria === 'Excelente')      deltaPerf += 6;
    else if (novaSaudeCategoria === 'Saudável')  deltaPerf += 3;
    else if (novaSaudeCategoria === 'Cansado')   deltaPerf -= 4;
    else if (novaSaudeCategoria === 'Exausto')   deltaPerf -= 8;
    else if (novaSaudeCategoria === 'Doente')    deltaPerf -= 12;
    if (stats.doencaAtiva)                       deltaPerf -= 6;
    if (stats.humor === 'Radiante')              deltaPerf += 5;
    else if (stats.humor === 'Feliz')            deltaPerf += 2;
    else if (stats.humor === 'Desanimado')       deltaPerf -= 4;
    else if (stats.humor === 'Triste')           deltaPerf -= 8;
    if (selectedEvent.type === 'positive')       deltaPerf += 4;
    if (selectedEvent.type === 'negative')       deltaPerf -= 4;
    if (stats.saldo > stats.salario * 2)         deltaPerf += 2;
    if (stats.saldo < 0)                         deltaPerf -= 5;
    const p = stats.workPerformance;
    if (p > 50) deltaPerf -= 1; else if (p < 50) deltaPerf += 1;
    deltaPerf += artifactEffects.productivityBonus;
    stats.workPerformance = clamp(stats.workPerformance + deltaPerf, 0, 100);
    stats.produtividade = getProdutividadeFromPerformance(stats.workPerformance);
  }

  // ── Stock prices ─────────────────────────────────────────
  updateAssetPrices(stats.stocks);
  updateAssetPrices(stats.cryptos);

  // ── Job offers ───────────────────────────────────────────
  const chanceVaga = 0.04 + stats.nivelCurriculo * 0.02 + stats.cursoBenefits.jobChanceBonus + artifactEffects.jobChanceBonus;
  if (rand() < chanceVaga) {
    const offer = generateJobOffer(stats);
    const email = {
      id: randomUUID(),
      sender: offer.empresa,
      subject: `Proposta de Emprego — ${offer.cargo}`,
      body: `Olá! Você foi selecionado para a vaga de ${offer.cargo} com salário de R$ ${Math.floor(offer.salario)}/mês.`,
      timestamp: Date.now(),
      read: false,
      jobOffer: offer,
    };
    stats.emails.push(email);
    addEvent(events, `📧 Nova proposta: ${offer.cargo} na ${offer.empresa} — R$ ${Math.floor(offer.salario)}`, 'career');
  }

  // ── Event log ────────────────────────────────────────────
  addEvent(events, `${selectedEvent.nome}: ${selectedEvent.desc}`, selectedEvent.type);

  // ── Game-over check (food, interest) ─────────────────────
  if (stats.comida <= 0) {
    stats.gameOver = true;
    stats.deathReason = 'FOME: Seu estoque de comida acabou.';
    return { flags, gameOver: true, deathReason: stats.deathReason };
  }
  const finalInterestRate = getInterestRate(stats);
  if (finalInterestRate >= 80) {
    stats.gameOver = true;
    stats.deathReason = 'COLAPSO FINANCEIRO: Seus juros atingiram 80%.';
    return { flags, gameOver: true, deathReason: stats.deathReason };
  }

  // ── Titles ───────────────────────────────────────────────
  checkTitles(stats, events);

  return { flags, gameOver: false, deathReason: '' };
}

// ============================================================
// ALL OTHER ACTIONS
// ============================================================

export function applyAction(
  action: Exclude<import('./types.js').GameAction, { type: 'INIT_PLAYER' | 'PASS_MONTH' | 'RESET_GAME' }>,
  stats: GameStats,
  events: GameEvent[],
): ActionResult {

  switch (action.type) {

    // ── BUY_FOOD ─────────────────────────────────────────
    case 'BUY_FOOD': {
      const { qty } = action;
      if (!Number.isInteger(qty) || qty < 1 || qty > 200) return fail('Quantidade inválida.');
      const total = getDiscountedPurchasePrice(stats, getCurrentFoodPrice(stats) * qty);
      if (stats.saldo < total) return fail(`Saldo insuficiente. Necessário R$ ${Math.floor(total)}.`);
      stats.saldo -= total;
      stats.comida += qty;
      stats.totalFoodBought += qty;
      addEvent(events, `🍞 Comprou ${qty} unidade(s) de comida por R$ ${Math.floor(total)}.`, 'positive');
      checkTitles(stats, events);
      return ok(stats, events);
    }

    // ── BUY_WOOD ─────────────────────────────────────────
    case 'BUY_WOOD': {
      const { qty } = action;
      if (!Number.isInteger(qty) || qty < 1 || qty > 200) return fail('Quantidade inválida.');
      const total = getDiscountedPurchasePrice(stats, WOOD_PRICE * qty);
      if (stats.saldo < total) return fail(`Saldo insuficiente. Necessário R$ ${Math.floor(total)}.`);
      stats.saldo -= total;
      stats.lenha += qty;
      addEvent(events, `🪵 Comprou ${qty} lenha(s) por R$ ${Math.floor(total)}.`, 'positive');
      return ok(stats, events);
    }

    // ── PAY_BILLS ────────────────────────────────────────
    case 'PAY_BILLS': {
      const amount = Math.floor(action.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > stats.contasEmAtraso) return fail('Valor inválido.');
      if (stats.saldo < amount) return fail('Saldo insuficiente para pagar esse valor.');
      stats.saldo -= amount;
      stats.contasEmAtraso = Math.max(0, stats.contasEmAtraso - amount);
      if (stats.contasEmAtraso === 0) stats.mesesEmAtraso = 0;
      addEvent(events, `🧾 Pagou R$ ${Math.floor(amount)} em boletos.`, 'positive');
      return ok(stats, events);
    }

    // ── STUDY_DEGREE ─────────────────────────────────────
    case 'STUDY_DEGREE': {
      const nextDegree = GRAUS_ACADEMICOS[stats.nivelCurriculo + 1];
      if (!nextDegree) return fail('Formação acadêmica já completa.');
      const interestRate = getInterestRate(stats);
      if (interestRate >= 59) return fail('Estudos bloqueados por dívidas.');
      const season = getSeason(stats.mes);
      const custo = getDiscountedPurchasePrice(stats, season === 'Primavera' ? Math.floor(nextDegree.custoMensal * 0.7) : nextDegree.custoMensal);
      if (stats.saldo < custo) return fail(`Saldo insuficiente. Necessário R$ ${custo}.`);
      stats.saldo -= custo;
      const degreeProgress = rand() < getArtifactEffects(stats).studyDoubleProgressChance ? 2 : 1;
      stats.experienciaCurriculo += degreeProgress;
      if (stats.experienciaCurriculo >= nextDegree.mesesNecessarios) {
        stats.nivelCurriculo += 1;
        stats.experienciaCurriculo = 0;
        addEvent(events, `🎓 Você concluiu: ${nextDegree.nome}!`, 'career');
        checkTitles(stats, events);
      } else {
        const restantes = nextDegree.mesesNecessarios - stats.experienciaCurriculo;
        addEvent(events, `📖 Estudando ${nextDegree.nome}... (${stats.experienciaCurriculo}/${nextDegree.mesesNecessarios} — faltam ${restantes} ${restantes === 1 ? 'mês' : 'meses'})`, 'neutral');
      }
      return ok(stats, events);
    }

    // ── STUDY_COURSE ─────────────────────────────────────
    case 'STUDY_COURSE': {
      if (!stats.cursoAtivo) return fail('Nenhum curso ativo.');
      const curso = CURSOS.find(c => c.id === stats.cursoAtivo!.id);
      if (!curso) return fail('Curso inválido.');
      const interestRate = getInterestRate(stats);
      if (interestRate >= 59) return fail('Estudos bloqueados por dívidas.');
      const courseCost = getDiscountedPurchasePrice(stats, curso.mensalidade);
      if (stats.saldo < courseCost) return fail(`Saldo insuficiente. Necessário R$ ${courseCost}.`);
      stats.saldo -= courseCost;
      const courseProgress = rand() < getArtifactEffects(stats).studyDoubleProgressChance ? 2 : 1;
      stats.cursoAtivo.progress += courseProgress;
      if (stats.cursoAtivo.progress >= curso.duracaoEstudos) {
        // Aplicar benefícios
        if (curso.id === 'nutricao')      { stats.cursoBenefits.foodDiscount = 0.1; stats.cursoBenefits.healthDecayReduction = 0.3; }
        if (curso.id === 'psicologia')    { stats.cursoBenefits.happinessDecayReduction = 2; }
        if (curso.id === 'administracao') { stats.cursoBenefits.jobChanceBonus += 0.04; stats.cursoBenefits.productivityBonus += 10; stats.workPerformance = Math.min(100, stats.workPerformance + 10); }
        if (curso.id === 'ti')            { stats.cursoBenefits.jobChanceBonus += 0.07; }
        if (curso.id === 'financas')      { /* desbloqueia investimentos via cursosCompletos */ }
        stats.cursosCompletos.push(curso.id);
        stats.cursoAtivo = null;
        addEvent(events, `🎓 Curso de ${curso.nome} concluído!`, 'career');
        if (curso.id === 'financas') addEvent(events, '💰 Investimentos desbloqueados!', 'positive');
        checkTitles(stats, events);
      } else {
        addEvent(events, `📚 ${curso.nome}: ${stats.cursoAtivo.progress}/${curso.duracaoEstudos} estudos.`, 'neutral');
      }
      return ok(stats, events);
    }

    // ── SELECT_COURSE ─────────────────────────────────────
    case 'SELECT_COURSE': {
      const { courseId } = action;
      const curso = CURSOS.find(c => c.id === courseId);
      if (!curso) return fail('Curso não encontrado.');
      if (stats.mes < curso.unlockMes) return fail(`Curso disponível a partir do mês ${curso.unlockMes}.`);
      if (stats.cursosCompletos.includes(courseId)) return fail('Curso já concluído.');
      if (stats.cursoAtivo && stats.cursoAtivo.id === courseId) return fail('Este curso já está ativo.');
      if (stats.cursoAtivo) return fail('Confirme a troca antes de selecionar outro curso. Use CONFIRM_SWAP_COURSE.');
      stats.cursoAtivo = { id: courseId, progress: 0 };
      addEvent(events, `📚 Matriculado no curso de ${curso.nome}.`, 'career');
      return ok(stats, events);
    }

    // ── CONFIRM_SWAP_COURSE ───────────────────────────────
    case 'CONFIRM_SWAP_COURSE': {
      const { courseId } = action;
      const curso = CURSOS.find(c => c.id === courseId);
      if (!curso) return fail('Curso não encontrado.');
      if (stats.mes < curso.unlockMes) return fail(`Curso disponível a partir do mês ${curso.unlockMes}.`);
      if (stats.cursosCompletos.includes(courseId)) return fail('Curso já concluído.');
      stats.cursoAtivo = { id: courseId, progress: 0 };
      addEvent(events, `📚 Trocou para o curso de ${curso.nome}. Progresso anterior perdido.`, 'neutral');
      return ok(stats, events);
    }

    // ── HEALTH_ACTION ─────────────────────────────────────
    case 'HEALTH_ACTION': {
      const acao = ACOES_SAUDE.find(a => a.id === action.actionId);
      if (!acao) return fail('Ação de saúde inválida.');
      if (!stats.unlockedMechanics.saude) return fail('Sistema de saúde ainda não desbloqueado.');
      const healthCost = getLifestylePrice(stats, acao.custo);
      if (stats.saldo < healthCost) return fail(`Saldo insuficiente. Necessário R$ ${healthCost}.`);
      stats.saldo -= healthCost;
      stats.saudeValue = clamp(stats.saudeValue + acao.ganho, 0, 100);
      addEvent(events, `${acao.emoji} ${acao.nome}: +${acao.ganho} saúde.`, 'positive');
      return ok(stats, events);
    }

    // ── PAY_DISEASE ───────────────────────────────────────
    case 'PAY_DISEASE': {
      if (!stats.doencaAtiva) return fail('Nenhuma doença ativa.');
      const custo = getLifestylePrice(stats, stats.doencaAtiva.custo);
      if (stats.saldo < custo) return fail(`Saldo insuficiente. Tratamento custa R$ ${Math.floor(custo)}.`);
      stats.saldo -= custo;
      addEvent(events, `💊 Tratamento pago: R$ ${Math.floor(custo)}. Você está curado de ${stats.doencaAtiva.nome}!`, 'positive');
      stats.doencaAtiva = null;
      return ok(stats, events);
    }

    // ── LEISURE ───────────────────────────────────────────
    case 'LEISURE': {
      const ativ = LAZER_ATIVIDADES.find(a => a.id === action.activityId);
      if (!ativ) return fail('Atividade de lazer inválida.');
      if (!stats.unlockedMechanics.felicidade) return fail('Sistema de felicidade ainda não desbloqueado.');
      const leisureCost = getLifestylePrice(stats, ativ.custoBase);
      if (stats.saldo < leisureCost) return fail(`Saldo insuficiente. Necessário R$ ${leisureCost}.`);
      stats.saldo -= leisureCost;
      const ganho = getHappinessGainScaled(ativ.happinessGain, stats.salario);
      stats.morale = clamp(stats.morale + ganho, 0, 100);
      stats.humor  = getHumorFromMorale(stats.morale);
      const isRich = stats.salario > 15000;
      addEvent(events, `${ativ.emoji} ${ativ.nome}: ${isRich ? "você foi, mas o dinheiro já não traz a mesma sensação." : "uma pausa merecida na rotina."}`, 'positive');
      return ok(stats, events);
    }

    // ── ACCEPT_JOB ────────────────────────────────────────
    case 'ACCEPT_JOB': {
      const { offerId, perfectInterview } = action;
      const email = stats.emails.find(e => e.jobOffer?.id === offerId);
      if (!email || !email.jobOffer) return fail('Proposta não encontrada.');
      const offer = email.jobOffer;
      stats.salario = offer.salario;
      stats.contas  = offer.contas;
      stats.nivel   = Math.min(6, stats.nivel + 1);
      stats.emails  = stats.emails.filter(e => e.jobOffer?.id !== offerId);
      if (perfectInterview && !stats.unlockedTitles.includes('BomPapo')) {
        stats.unlockedTitles.push('BomPapo');
        addEvent(events, '🏆 Título desbloqueado: Bom de papo! Entrevista concluída sem erros!', 'career');
      }
      addEvent(events, `🤝 Você aceitou a vaga de ${offer.cargo} na ${offer.empresa}! Novo salário: R$ ${Math.floor(offer.salario)}.`, 'career');
      checkTitles(stats, events);
      return ok(stats, events);
    }

    // ── INVEST_DEPOSIT ────────────────────────────────────
    case 'INVEST_DEPOSIT': {
      const amount = Math.floor(action.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return fail('Valor inválido.');
      if (!stats.cursosCompletos.includes('financas')) return fail('Conclua o curso de Finanças para investir.');
      if (getInterestRate(stats) >= 45) return fail('Operações de investimento bloqueadas por dívidas.');
      if (stats.saldo < amount) return fail('Saldo insuficiente.');
      if (stats.poupanca + amount > MAX_SAVINGS) return fail('A poupança aceita no máximo R$ 1.000.000.000.');
      stats.saldo    -= amount;
      stats.poupanca += amount;
      addEvent(events, `🏦 Depositou R$ ${amount} na poupança.`, 'positive');
      return ok(stats, events);
    }

    // ── INVEST_WITHDRAW ───────────────────────────────────
    case 'INVEST_WITHDRAW': {
      const amount = Math.floor(action.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) return fail('Valor inválido.');
      if (!stats.cursosCompletos.includes('financas')) return fail('Conclua o curso de Finanças para investir.');
      if (stats.poupanca < amount) return fail('Saldo em investimentos insuficiente.');
      stats.poupanca -= amount;
      stats.saldo    += amount;
      addEvent(events, `🏦 Retirou R$ ${amount} da poupança.`, 'neutral');
      checkTitles(stats, events);
      return ok(stats, events);
    }

    // ── BUY_ASSET ─────────────────────────────────────────
    case 'BUY_ASSET': {
      const { symbol, qty, assetType } = action;
      if (!Number.isFinite(qty) || qty <= 0 || qty > 1_000_000) return fail('Quantidade inválida.');
      if (!stats.cursosCompletos.includes('financas')) return fail('Conclua o curso de Finanças para investir.');
      if (getInterestRate(stats) >= 45) return fail('Operações de investimento bloqueadas por dívidas.');
      const list = assetType === 'stock' ? stats.stocks : stats.cryptos;
      const asset = list.find(a => a.symbol === symbol);
      if (!asset) return fail('Ativo não encontrado.');
      const total = asset.price * qty;
      if (stats.saldo < total) return fail(`Saldo insuficiente. Necessário R$ ${Math.floor(total)}.`);
      stats.saldo -= total;
      const pos = stats.portfolio[symbol];
      if (pos) {
        const newQty = pos.quantity + qty;
        stats.portfolio[symbol] = { quantity: newQty, averagePrice: (pos.averagePrice * pos.quantity + total) / newQty };
      } else {
        stats.portfolio[symbol] = { quantity: qty, averagePrice: asset.price };
      }
      if (assetType === 'stock')  stats.hasBoughtStock  = true;
      if (assetType === 'crypto') stats.hasBoughtCrypto = true;
      addEvent(events, `📈 Comprou ${qty}x ${symbol} por R$ ${Math.floor(total)}.`, 'positive');
      checkTitles(stats, events);
      return ok(stats, events);
    }

    // ── SELL_ASSET ────────────────────────────────────────
    case 'SELL_ASSET': {
      const { symbol, qty } = action;
      if (!Number.isFinite(qty) || qty <= 0 || qty > 1_000_000) return fail('Quantidade inválida.');
      if (!stats.cursosCompletos.includes('financas')) return fail('Conclua o curso de Finanças para investir.');
      const pos = stats.portfolio[symbol];
      if (!pos || pos.quantity < qty) return fail('Quantidade insuficiente para vender.');
      const list = [...stats.stocks, ...stats.cryptos];
      const asset = list.find(a => a.symbol === symbol);
      if (!asset) return fail('Ativo não encontrado.');
      const total = asset.price * qty;
      stats.saldo += total;
      pos.quantity -= qty;
      if (pos.quantity <= 0.00000001) delete stats.portfolio[symbol];
      addEvent(events, `📉 Vendeu ${qty}x ${symbol} por R$ ${Math.floor(total)}.`, 'neutral');
      checkTitles(stats, events);
      return ok(stats, events);
    }

    // ── EQUIP_TITLE ───────────────────────────────────────
    case 'BUY_COMPANY': {
      if (stats.retirementCount < 1) return fail('Empresas são desbloqueadas após a primeira aposentadoria.');
      const definition = COMPANY_DEFINITIONS.find(company => company.id === action.companyId);
      if (!definition) return fail('Empresa não encontrada.');
      if (stats.companies.some(company => company.id === definition.id)) return fail('Você já possui essa empresa.');
      const purchaseCost = getDiscountedPurchasePrice(stats, definition.purchaseCost);
      if (stats.saldo < purchaseCost) {
        return fail(`Saldo insuficiente. Necessário R$ ${purchaseCost}.`);
      }

      stats.saldo -= purchaseCost;
      stats.companies.push({ id: definition.id, level: 1, employees: 0, strategy: 'balanced' });
      addEvent(events, `🏢 Comprou ${definition.name} por R$ ${purchaseCost}. Contrate a equipe para iniciar a operação.`, 'career');
      checkTitles(stats, events);
      return ok(stats, events);
    }

    case 'UPGRADE_COMPANY': {
      const definition = COMPANY_DEFINITIONS.find(company => company.id === action.companyId);
      const owned = stats.companies.find(company => company.id === action.companyId);
      if (!definition || !owned) return fail('Empresa não encontrada.');
      let upgradeCost = getCompanyUpgradeCost(definition, owned.level);
      if (upgradeCost !== null) upgradeCost = getDiscountedPurchasePrice(stats, upgradeCost * (1 - getArtifactEffects(stats).companyUpgradeDiscount));
      if (upgradeCost === null) return fail('Esta empresa já está no nível máximo.');
      if (stats.saldo < upgradeCost) return fail(`Saldo insuficiente. Necessário R$ ${upgradeCost}.`);

      stats.saldo -= upgradeCost;
      owned.level += 1;
      const requiredEmployees = getCompanyRequiredEmployees(definition, owned.level);
      addEvent(events, `🏗️ ${definition.name} melhorada para o nível ${owned.level}. Nova equipe mínima: ${requiredEmployees}.`, 'career');
      return ok(stats, events);
    }

    case 'SET_COMPANY_STRATEGY': {
      const owned = stats.companies.find(company => company.id === action.companyId);
      const definition = COMPANY_DEFINITIONS.find(company => company.id === action.companyId);
      if (!definition || !owned) return fail('Empresa não encontrada.');
      if (!['safe', 'balanced', 'aggressive'].includes(action.strategy)) return fail('Modo de gestão inválido.');
      owned.strategy = action.strategy;
      const strategy = getCompanyStrategy(action.strategy);
      addEvent(events, `${strategy.emoji} ${definition.name} mudou para o modo ${strategy.name}.`, 'neutral');
      return ok(stats, events);
    }

    case 'HIRE_EMPLOYEES': {
      const definition = COMPANY_DEFINITIONS.find(company => company.id === action.companyId);
      const owned = stats.companies.find(company => company.id === action.companyId);
      if (!definition || !owned) return fail('Empresa não encontrada.');
      const qty = Math.floor(action.qty);
      const requiredEmployees = getCompanyRequiredEmployees(definition, owned.level);
      const missingEmployees = Math.max(0, requiredEmployees - owned.employees);
      if (!Number.isInteger(qty) || qty < 1 || qty > missingEmployees) return fail('Quantidade de funcionários inválida.');
      const totalCost = getDiscountedPurchasePrice(stats, getEmployeeHiringCost(definition) * qty * (1 - getArtifactEffects(stats).hiringCostDiscount));
      if (stats.saldo < totalCost) return fail(`Saldo insuficiente. Necessário R$ ${totalCost}.`);

      stats.saldo -= totalCost;
      owned.employees += qty;
      addEvent(events, `👥 ${definition.name} contratou ${qty} funcionário(s) por R$ ${totalCost}.`, 'positive');
      return ok(stats, events);
    }

    case 'FIRE_EMPLOYEES': {
      const definition = COMPANY_DEFINITIONS.find(company => company.id === action.companyId);
      const owned = stats.companies.find(company => company.id === action.companyId);
      if (!definition || !owned) return fail('Empresa não encontrada.');
      const qty = Math.floor(action.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > owned.employees) return fail('Quantidade de funcionários inválida.');

      owned.employees -= qty;
      addEvent(events, `👋 ${definition.name} demitiu ${qty} funcionário(s).`, 'neutral');
      return ok(stats, events);
    }

    case 'RETIRE': {
      if (stats.retirementCount >= 10) return fail('Você já atingiu o limite de 10 aposentadorias.');
      const requirement = getRetirementRequirement(stats.retirementCount);
      if (stats.saldo < requirement) {
        return fail(`Saldo insuficiente para se aposentar. Necessário R$ ${requirement}.`);
      }

      const retiredStats = createInitialStats(stats.playerNick);
      retiredStats.retirementCount = stats.retirementCount + 1;
      retiredStats.devModeUsed = stats.devModeUsed;
      retiredStats.unlockedTitles = Array.from(new Set([...stats.unlockedTitles, 'Aposentado']))
        .filter(title => title !== 'GlobalPlayer');
      retiredStats.equippedTitle = retiredStats.unlockedTitles.includes(stats.equippedTitle) ? stats.equippedTitle : '';
      retiredStats.artifactLevels = { ...(stats.artifactLevels ?? {}) };
      retiredStats.equippedArtifacts = [...(stats.equippedArtifacts ?? [])];
      retiredStats.artifactBoxes = {
        basic: (stats.artifactBoxes?.basic ?? 0) + 1,
        premium: stats.artifactBoxes?.premium ?? 0,
        elite: stats.artifactBoxes?.elite ?? 0,
      };
      retiredStats.artifactBoxesOpened = stats.artifactBoxesOpened ?? 0;

      const retiredEvents: GameEvent[] = [];
      addEvent(
        retiredEvents,
        `🏖️ Aposentadoria ${retiredStats.retirementCount} concluída! Bônus permanentes: +${retiredStats.retirementCount * 10}% no salário, +${retiredStats.retirementCount * 5}% nas empresas e 1 Caixa de Artefato.`,
        'career',
      );
      checkTitles(retiredStats, retiredEvents);
      return ok(retiredStats, retiredEvents);
    }

    case 'BUY_ARTIFACT_BOX': {
      if (stats.retirementCount < 1) return fail('Artefatos são desbloqueados após a primeira aposentadoria.');
      const box = ARTIFACT_BOX_DEFINITIONS.find(item => item.id === action.boxType);
      if (!box) return fail('Caixa de artefato inválida.');
      const price = getDiscountedPurchasePrice(stats, getArtifactBoxPrice(box.id, stats.retirementCount));
      if (stats.saldo < price) return fail(`Saldo insuficiente. A caixa custa R$ ${price}.`);
      stats.saldo -= price;
      stats.artifactBoxes[box.id] += 1;
      addEvent(events, `${box.emoji} Comprou uma ${box.name} por R$ ${price}.`, 'career');
      return ok(stats, events);
    }

    case 'BUY_AND_OPEN_ARTIFACT_BOX': {
      if (stats.retirementCount < 1) return fail('Artefatos são desbloqueados após a primeira aposentadoria.');
      const box = ARTIFACT_BOX_DEFINITIONS.find(item => item.id === action.boxType);
      if (!box) return fail('Caixa de artefato inválida.');
      const candidates = ARTIFACT_DEFINITIONS.filter(artifact => box.artifactIds.includes(artifact.id) && (stats.artifactLevels[artifact.id] ?? 0) < (artifact.rarity === 'Divinity' ? 1 : MAX_ARTIFACT_LEVEL));
      if (candidates.length === 0) return fail(`Todos os artefatos da ${box.name} já estão no nível máximo.`);

      const usedStoredBox = stats.artifactBoxes[box.id] > 0;
      const price = getDiscountedPurchasePrice(stats, getArtifactBoxPrice(box.id, stats.retirementCount));
      if (!usedStoredBox && stats.saldo < price) return fail(`Saldo insuficiente. A caixa custa R$ ${price}.`);
      if (usedStoredBox) stats.artifactBoxes[box.id] -= 1;
      else stats.saldo -= price;

      const artifact = pickArtifact(box.id, rand(), candidates);
      const previousLevel = stats.artifactLevels[artifact.id] ?? 0;
      stats.artifactLevels[artifact.id] = Math.min(artifact.rarity === 'Divinity' ? 1 : MAX_ARTIFACT_LEVEL, previousLevel + 1);
      stats.artifactBoxesOpened = (stats.artifactBoxesOpened ?? 0) + 1;
      const acquisition = usedStoredBox ? `${box.name} guardada` : `${box.name} comprada por R$ ${price}`;
      addEvent(
        events,
        previousLevel === 0
          ? `${box.emoji} ${acquisition} e aberta: você encontrou ${artifact.emoji} ${artifact.name} (${artifact.rarity})!`
          : `${box.emoji} ${acquisition} e aberta: ${artifact.emoji} ${artifact.name} evoluiu para o nível ${previousLevel + 1}!`,
        'career',
      );
      checkTitles(stats, events);
      return { ok: true, stats, events, flags: { artifactAwardedId: artifact.id, artifactWasUpgrade: artifact.rarity !== 'Divinity' && previousLevel > 0 } };
    }

    case 'OPEN_ARTIFACT_BOX': {
      if (stats.retirementCount < 1) return fail('Artefatos são desbloqueados após a primeira aposentadoria.');
      const box = ARTIFACT_BOX_DEFINITIONS.find(item => item.id === action.boxType);
      if (!box) return fail('Caixa de artefato inválida.');
      if (stats.artifactBoxes[box.id] < 1) return fail(`Você não possui nenhuma ${box.name}.`);
      const candidates = ARTIFACT_DEFINITIONS.filter(artifact => box.artifactIds.includes(artifact.id) && (stats.artifactLevels[artifact.id] ?? 0) < (artifact.rarity === 'Divinity' ? 1 : MAX_ARTIFACT_LEVEL));
      if (candidates.length === 0) return fail(`Todos os artefatos da ${box.name} já estão no nível máximo.`);

      const artifact = pickArtifact(box.id, rand(), candidates);
      const previousLevel = stats.artifactLevels[artifact.id] ?? 0;
      stats.artifactBoxes[box.id] -= 1;
      stats.artifactLevels[artifact.id] = Math.min(artifact.rarity === 'Divinity' ? 1 : MAX_ARTIFACT_LEVEL, previousLevel + 1);
      stats.artifactBoxesOpened = (stats.artifactBoxesOpened ?? 0) + 1;
      addEvent(
        events,
        previousLevel === 0
          ? `✨ Caixa aberta: você encontrou ${artifact.emoji} ${artifact.name} (${artifact.rarity})!`
          : `⬆️ ${artifact.emoji} ${artifact.name} evoluiu para o nível ${previousLevel + 1}!`,
        'career',
      );
      checkTitles(stats, events);
      return { ok: true, stats, events, flags: { artifactAwardedId: artifact.id, artifactWasUpgrade: artifact.rarity !== 'Divinity' && previousLevel > 0 } };
    }

    case 'TOGGLE_ARTIFACT': {
      if (stats.retirementCount < 1) return fail('Artefatos são desbloqueados após a primeira aposentadoria.');
      const artifact = ARTIFACT_DEFINITIONS.find(item => item.id === action.artifactId);
      if (!artifact || (stats.artifactLevels[artifact.id] ?? 0) < 1) return fail('Artefato não encontrado na coleção.');
      if (stats.equippedArtifacts.includes(artifact.id)) {
        stats.equippedArtifacts = stats.equippedArtifacts.filter(artifactId => artifactId !== artifact.id);
        addEvent(events, `${artifact.emoji} ${artifact.name} foi desequipado.`, 'neutral');
        return ok(stats, events);
      }
      if (stats.equippedArtifacts.length >= MAX_EQUIPPED_ARTIFACTS) return fail(`Você só pode equipar ${MAX_EQUIPPED_ARTIFACTS} artefatos.`);
      stats.equippedArtifacts.push(artifact.id);
      addEvent(events, `${artifact.emoji} ${artifact.name} foi equipado.`, 'positive');
      return ok(stats, events);
    }

    case 'EQUIP_TITLE': {
      const { titleId } = action;
      if (titleId === '') {
        stats.equippedTitle = '';
        return ok(stats, events);
      }
      if (!stats.unlockedTitles.includes(titleId)) return fail('Título não desbloqueado.');
      stats.equippedTitle = titleId;
      return ok(stats, events);
    }

    // ── READ_EMAIL ────────────────────────────────────────
    case 'READ_EMAIL': {
      const email = stats.emails.find(e => e.id === action.emailId);
      if (!email) return fail('Email não encontrado.');
      email.read = true;
      return ok(stats, events);
    }

    // ── DELETE_EMAIL ──────────────────────────────────────
    case 'DELETE_EMAIL': {
      stats.emails = stats.emails.filter(e => e.id !== action.emailId);
      return ok(stats, events);
    }

    // ── DEV_SET_STATS (somente desenvolvimento) ───────────
    case 'DEV_SET_STATS': {
      const devToolsEnabled = process.env.npm_lifecycle_event === 'dev' || process.env.ENABLE_DEV_TOOLS === 'true';
      if (!devToolsEnabled) return fail('Ferramentas de desenvolvimento desativadas.');

      const { saldo, comida, lenha, mes } = action;
      if (!Number.isFinite(saldo) || saldo < -1_000_000_000 || saldo > 1_000_000_000) {
        return fail('Saldo de desenvolvimento inválido.');
      }
      if (!Number.isInteger(comida) || comida < 0 || comida > 1_000_000) {
        return fail('Quantidade de comida inválida.');
      }
      if (!Number.isInteger(lenha) || lenha < 0 || lenha > 1_000_000) {
        return fail('Quantidade de lenha inválida.');
      }
      if (!Number.isInteger(mes) || mes < 1 || mes > 1_000_000) {
        return fail('Mês de desenvolvimento inválido.');
      }

      stats.saldo = saldo;
      stats.comida = comida;
      stats.lenha = lenha;
      stats.mes = mes;
      stats.devModeUsed = true;
      stats.unlockedTitles = stats.unlockedTitles.filter(title => title !== 'GlobalPlayer');
      if (stats.equippedTitle === 'GlobalPlayer') stats.equippedTitle = '';
      addEvent(events, '🛠️ Dados ajustados pelas ferramentas de desenvolvimento.', 'neutral');
      return ok(stats, events);
    }

    default:
      return fail('Ação desconhecida.');
  }
}

// ── Helpers de resultado ──────────────────────────────────
function ok(stats: GameStats, events: GameEvent[]): ActionResult {
  return { ok: true, stats, events };
}
function fail(error: string): ActionResult {
  return { ok: false, error };
}
