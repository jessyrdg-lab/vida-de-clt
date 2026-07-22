import { ArtifactBoxType, GameStats } from './types';

export type ArtifactRarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Divinity';
export type ArtifactEffectKey = 'salaryBonus' | 'jobChanceBonus' | 'studyDoubleProgressChance' | 'billsDiscount' | 'negativeEventCostReduction' | 'productivityBonus' | 'hiringCostDiscount' | 'companyMaintenanceDiscount' | 'employeeRetentionChance' | 'companyRevenueBonus' | 'companyRiskReduction' | 'companyUpgradeDiscount' | 'savingsYieldBonus' | 'companyOperatingCostDiscount' | 'companyIncidentCancelChance' | 'conglomerateRevenuePerCompany' | 'allPricesDiscount';

export interface ArtifactDefinition {
  id: string;
  name: string;
  emoji: string;
  rarity: ArtifactRarity;
  description: string;
  effect: ArtifactEffectKey;
  valuePerLevel: number;
}

export interface ArtifactBoxDefinition {
  id: ArtifactBoxType;
  name: string;
  emoji: string;
  description: string;
  basePrice: number;
  chances: Record<ArtifactRarity, number>;
  artifactIds: string[];
  style: string;
}

export const MAX_EQUIPPED_ARTIFACTS = 4;
export const MAX_ARTIFACT_LEVEL = 5;

export const ARTIFACT_BOX_DEFINITIONS: ArtifactBoxDefinition[] = [
  { id: 'basic', name: 'Caixa Básica', emoji: '📦', description: '', basePrice: 1_000, chances: { Comum: 80, Raro: 20, Épico: 0, Lendário: 0, Divinity: 0 }, artifactIds: ['holerite-rubi', 'agenda-oportunidades', 'planner-acelerado', 'cartao-beneficios', 'seguro-bolso', 'medalha-desempenho'], style: 'from-slate-500 to-slate-700' },
  { id: 'premium', name: 'Caixa Premium', emoji: '🎁', description: '', basePrice: 10_000, chances: { Comum: 0, Raro: 94.99, Épico: 5, Lendário: 0.01, Divinity: 0 }, artifactIds: ['cracha-recrutador', 'kit-manutencao', 'manual-retencao', 'pasta-contratos', 'extintor-corporativo', 'selo-franquia'], style: 'from-blue-500 to-violet-700' },
  { id: 'elite', name: 'Caixa Elite', emoji: '💎', description: '', basePrice: 50_000, chances: { Comum: 0, Raro: 94.9899, Épico: 5, Lendário: 0.01, Divinity: 0.0001 }, artifactIds: ['blindagem-patrimonial', 'cofre-dividendos', 'auditoria-suprema', 'holding-dourada', 'seguro-sistemico', 'chave-conglomerado', 'cartao-black'], style: 'from-amber-400 via-orange-500 to-rose-600' },
];

export const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [
  { id: 'holerite-rubi', name: 'Holerite Rubi', emoji: '📄', rarity: 'Comum', description: 'Aumenta o salário recebido.', effect: 'salaryBonus', valuePerLevel: 0.03 },
  { id: 'agenda-oportunidades', name: 'Agenda de Oportunidades', emoji: '📆', rarity: 'Comum', description: 'Aumenta a chance de receber propostas de emprego.', effect: 'jobChanceBonus', valuePerLevel: 0.015 },
  { id: 'planner-acelerado', name: 'Planner Acelerado', emoji: '📚', rarity: 'Comum', description: 'Pode conceder progresso extra ao estudar.', effect: 'studyDoubleProgressChance', valuePerLevel: 0.06 },
  { id: 'cartao-beneficios', name: 'Cartão de Benefícios', emoji: '💳', rarity: 'Comum', description: 'Reduz as contas mensais.', effect: 'billsDiscount', valuePerLevel: 0.02 },
  { id: 'seguro-bolso', name: 'Seguro de Bolso', emoji: '🛡️', rarity: 'Raro', description: 'Reduz gastos de eventos pessoais negativos.', effect: 'negativeEventCostReduction', valuePerLevel: 0.05 },
  { id: 'medalha-desempenho', name: 'Medalha de Desempenho', emoji: '🏅', rarity: 'Raro', description: 'Melhora seu desempenho todos os meses.', effect: 'productivityBonus', valuePerLevel: 1 },
  { id: 'cracha-recrutador', name: 'Crachá do Recrutador', emoji: '🪪', rarity: 'Raro', description: 'Reduz o custo de contratação.', effect: 'hiringCostDiscount', valuePerLevel: 0.05 },
  { id: 'kit-manutencao', name: 'Kit de Manutenção', emoji: '🧰', rarity: 'Raro', description: 'Reduz a manutenção das empresas.', effect: 'companyMaintenanceDiscount', valuePerLevel: 0.03 },
  { id: 'manual-retencao', name: 'Manual de Retenção', emoji: '🤝', rarity: 'Raro', description: 'Pode impedir demissões causadas por incidentes.', effect: 'employeeRetentionChance', valuePerLevel: 0.08 },
  { id: 'pasta-contratos', name: 'Pasta de Contratos', emoji: '💼', rarity: 'Épico', description: 'Aumenta a receita bruta das empresas.', effect: 'companyRevenueBonus', valuePerLevel: 0.04 },
  { id: 'extintor-corporativo', name: 'Extintor Corporativo', emoji: '🧯', rarity: 'Épico', description: 'Reduz o risco de incidentes empresariais.', effect: 'companyRiskReduction', valuePerLevel: 0.07 },
  { id: 'selo-franquia', name: 'Selo da Franquia', emoji: '🏷️', rarity: 'Lendário', description: 'Reduz o preço das melhorias empresariais.', effect: 'companyUpgradeDiscount', valuePerLevel: 0.04 },
  { id: 'blindagem-patrimonial', name: 'Blindagem Patrimonial', emoji: '🏰', rarity: 'Raro', description: 'Reduz custos de eventos negativos.', effect: 'negativeEventCostReduction', valuePerLevel: 0.06 },
  { id: 'cofre-dividendos', name: 'Cofre de Dividendos', emoji: '💰', rarity: 'Lendário', description: 'Melhora o rendimento mensal da poupança.', effect: 'savingsYieldBonus', valuePerLevel: 0.0008 },
  { id: 'auditoria-suprema', name: 'Auditoria Suprema', emoji: '📊', rarity: 'Épico', description: 'Reduz folha salarial e manutenção das empresas.', effect: 'companyOperatingCostDiscount', valuePerLevel: 0.03 },
  { id: 'holding-dourada', name: 'Holding Dourada', emoji: '🏢', rarity: 'Épico', description: 'Aumenta a receita das empresas.', effect: 'companyRevenueBonus', valuePerLevel: 0.05 },
  { id: 'seguro-sistemico', name: 'Seguro Sistêmico', emoji: '☂️', rarity: 'Épico', description: 'Pode cancelar completamente um incidente empresarial.', effect: 'companyIncidentCancelChance', valuePerLevel: 0.10 },
  { id: 'chave-conglomerado', name: 'Chave do Conglomerado', emoji: '🔑', rarity: 'Lendário', description: 'Aumenta a receita por empresa operando.', effect: 'conglomerateRevenuePerCompany', valuePerLevel: 0.005 },
  { id: 'cartao-black', name: 'Cartão Black', emoji: '💳', rarity: 'Divinity', description: 'Reduz em 50% o preço de todas as compras e serviços.', effect: 'allPricesDiscount', valuePerLevel: 0.5 },
];

export function getArtifactBoxPrice(boxType: ArtifactBoxType, retirementCount: number): number {
  const box = ARTIFACT_BOX_DEFINITIONS.find(item => item.id === boxType) ?? ARTIFACT_BOX_DEFINITIONS[0];
  return box.basePrice * Math.max(1, Math.floor(retirementCount));
}

export function getArtifactEffects(stats: GameStats) {
  const effects = {
    salaryBonus: 0, jobChanceBonus: 0, studyDoubleProgressChance: 0, billsDiscount: 0,
    negativeEventCostReduction: 0, productivityBonus: 0, hiringCostDiscount: 0,
    companyMaintenanceDiscount: 0, employeeRetentionChance: 0, companyRevenueBonus: 0,
    companyRiskReduction: 0, companyUpgradeDiscount: 0, savingsYieldBonus: 0,
    companyOperatingCostDiscount: 0, companyIncidentCancelChance: 0,
    conglomerateRevenuePerCompany: 0, allPricesDiscount: 0,
  };
  for (const artifactId of stats.equippedArtifacts ?? []) {
    const definition = ARTIFACT_DEFINITIONS.find(artifact => artifact.id === artifactId);
    const level = Math.max(0, Math.min(definition?.rarity === 'Divinity' ? 1 : MAX_ARTIFACT_LEVEL, Math.floor(stats.artifactLevels?.[artifactId] ?? 0)));
    if (definition && level > 0) effects[definition.effect] += definition.valuePerLevel * level;
  }
  effects.jobChanceBonus = Math.min(0.075, effects.jobChanceBonus);
  effects.studyDoubleProgressChance = Math.min(0.30, effects.studyDoubleProgressChance);
  effects.billsDiscount = Math.min(0.10, effects.billsDiscount);
  effects.negativeEventCostReduction = Math.min(0.30, effects.negativeEventCostReduction);
  effects.hiringCostDiscount = Math.min(0.25, effects.hiringCostDiscount);
  effects.companyMaintenanceDiscount = Math.min(0.15, effects.companyMaintenanceDiscount);
  effects.employeeRetentionChance = Math.min(0.40, effects.employeeRetentionChance);
  effects.companyRiskReduction = Math.min(0.35, effects.companyRiskReduction);
  effects.companyUpgradeDiscount = Math.min(0.20, effects.companyUpgradeDiscount);
  effects.savingsYieldBonus = Math.min(0.004, effects.savingsYieldBonus);
  effects.companyOperatingCostDiscount = Math.min(0.15, effects.companyOperatingCostDiscount);
  effects.companyIncidentCancelChance = Math.min(0.50, effects.companyIncidentCancelChance);
  effects.conglomerateRevenuePerCompany = Math.min(0.025, effects.conglomerateRevenuePerCompany);
  effects.allPricesDiscount = Math.min(0.50, effects.allPricesDiscount);
  return effects;
}

export function describeArtifactEffect(definition: ArtifactDefinition, level: number): string {
  const value = definition.valuePerLevel * level;
  const effectText: Record<ArtifactEffectKey, string> = {
    salaryBonus: `+${(value * 100).toFixed(0)}% de salario`,
    jobChanceBonus: `+${(value * 100).toFixed(1)} pontos percentuais de chance de proposta`,
    studyDoubleProgressChance: `${(value * 100).toFixed(0)}% de chance de ganhar progresso extra ao estudar`,
    billsDiscount: `-${(value * 100).toFixed(0)}% nas contas mensais`,
    negativeEventCostReduction: `-${(value * 100).toFixed(0)}% em custos de eventos negativos`,
    productivityBonus: `+${value.toFixed(0)} de desempenho por mes`,
    hiringCostDiscount: `-${(value * 100).toFixed(0)}% ao contratar funcionarios`,
    companyMaintenanceDiscount: `-${(value * 100).toFixed(0)}% na manutencao das empresas`,
    employeeRetentionChance: `${(value * 100).toFixed(0)}% de chance de impedir demissoes`,
    companyRevenueBonus: `+${(value * 100).toFixed(0)}% na receita das empresas`,
    companyRiskReduction: `-${(value * 100).toFixed(0)}% de risco de incidentes empresariais`,
    companyUpgradeDiscount: `-${(value * 100).toFixed(0)}% nas melhorias empresariais`,
    savingsYieldBonus: `+${(value * 100).toFixed(2)} ponto percentual de rendimento mensal`,
    companyOperatingCostDiscount: `-${(value * 100).toFixed(0)}% em folha salarial e manutencao`,
    companyIncidentCancelChance: `${(value * 100).toFixed(0)}% de chance de cancelar um incidente empresarial`,
    conglomerateRevenuePerCompany: `+${(value * 100).toFixed(1)}% de receita por empresa operando (max. 20%)`,
    allPricesDiscount: `-${(value * 100).toFixed(0)}% no preco de compras e servicos`,
  };
  return effectText[definition.effect];
  // Implementacao abaixo foi mantida apenas como referencia durante esta transicao.
  switch (definition.effect) {
    case 'salaryBonus': return `+${(value * 100).toFixed(0)}% de salÃ¡rio`;
    case 'jobChanceBonus': return `+${(value * 100).toFixed(1)} pontos percentuais de chance de proposta`;
    case 'studyDoubleProgressChance': return `${(value * 100).toFixed(0)}% de chance de ganhar progresso extra ao estudar`;
    case 'billsDiscount': return `-${(value * 100).toFixed(0)}% nas contas mensais`;
    case 'negativeEventCostReduction': return `-${(value * 100).toFixed(0)}% em custos de eventos negativos`;
    case 'productivityBonus': return `+${value.toFixed(0)} de desempenho por mÃªs`;
    case 'hiringCostDiscount': return `-${(value * 100).toFixed(0)}% ao contratar funcionÃ¡rios`;
    case 'companyMaintenanceDiscount': return `-${(value * 100).toFixed(0)}% na manutenÃ§Ã£o das empresas`;
    case 'employeeRetentionChance': return `${(value * 100).toFixed(0)}% de chance de impedir demissÃµes`;
    case 'companyRevenueBonus': return `+${(value * 100).toFixed(0)}% na receita das empresas`;
    case 'companyRiskReduction': return `-${(value * 100).toFixed(0)}% de risco de incidentes empresariais`;
    case 'companyUpgradeDiscount': return `-${(value * 100).toFixed(0)}% nas melhorias empresariais`;
    case 'savingsYieldBonus': return `+${(value * 100).toFixed(2)} ponto percentual de rendimento mensal`;
    case 'companyOperatingCostDiscount': return `-${(value * 100).toFixed(0)}% em folha salarial e manutenÃ§Ã£o`;
    case 'companyIncidentCancelChance': return `${(value * 100).toFixed(0)}% de chance de cancelar um incidente empresarial`;
    case 'conglomerateRevenuePerCompany': return `+${(value * 100).toFixed(1)}% de receita por empresa operando (mÃ¡x. 20%)`;
  }
  /* legado:
  if (definition.effect === 'savingsYieldBonus') return `+${(value * 100).toFixed(2)}% de rendimento mensal`;
  if (definition.effect === 'happinessProtection') return `-${value.toFixed(0)} de desgaste mensal do humor`;
  if (definition.effect === 'productivityBonus') return `+${value.toFixed(0)} de desempenho por mês`;
  if (definition.effect === 'jobChanceBonus') return `+${(value * 100).toFixed(0)}% de chance de proposta`;
  const labels: Record<ArtifactEffectKey, string> = {
    salaryBonus: 'de salário', foodDiscount: 'no preço da comida', woodDiscount: 'no preço da lenha',
    savingsYieldBonus: '', companyRevenueBonus: 'na receita das empresas', companyRiskReduction: 'menos risco empresarial',
    healthDecayReduction: 'menos desgaste de saúde', jobChanceBonus: '', happinessProtection: '', productivityBonus: '',
  };
  return `${definition.effect === 'foodDiscount' || definition.effect === 'woodDiscount' || definition.effect === 'companyRiskReduction' || definition.effect === 'healthDecayReduction' ? '-' : '+'}${(value * 100).toFixed(0)}% ${labels[definition.effect]}`;
  */
}

export const ARTIFACT_RARITY_STYLE: Record<ArtifactRarity, string> = {
  Comum: 'from-slate-400 to-slate-600 border-slate-300 dark:border-slate-600',
  Raro: 'from-blue-400 to-indigo-600 border-blue-300 dark:border-blue-700',
  Épico: 'from-violet-500 to-fuchsia-700 border-violet-300 dark:border-violet-700',
  Lendário: 'from-slate-700 to-slate-950 border-fuchsia-300 dark:border-cyan-500',
  Divinity: 'from-cyan-100 via-sky-200 to-blue-300 border-cyan-200 dark:border-cyan-300',
};
