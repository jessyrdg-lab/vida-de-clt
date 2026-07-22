import { ArtifactBoxType, GameStats } from './types.js';

export type ArtifactRarity = 'Comum' | 'Raro' | '\u00c9pico' | 'Lend\u00e1rio' | 'Divinity';
export type ArtifactEffectKey =
  | 'salaryBonus' | 'jobChanceBonus' | 'studyDoubleProgressChance' | 'billsDiscount'
  | 'negativeEventCostReduction' | 'productivityBonus' | 'hiringCostDiscount'
  | 'companyMaintenanceDiscount' | 'employeeRetentionChance' | 'companyRevenueBonus'
  | 'companyRiskReduction' | 'companyUpgradeDiscount' | 'savingsYieldBonus'
  | 'companyOperatingCostDiscount' | 'companyIncidentCancelChance'
  | 'conglomerateRevenuePerCompany' | 'allPricesDiscount';

export interface ArtifactDefinition {
  id: string; name: string; emoji: string; rarity: ArtifactRarity;
  description: string; effect: ArtifactEffectKey; valuePerLevel: number;
}

export interface ArtifactBoxDefinition {
  id: ArtifactBoxType; name: string; emoji: string; basePrice: number;
  chances: Record<ArtifactRarity, number>; artifactIds: string[];
}

export interface ArtifactEffects {
  salaryBonus: number; jobChanceBonus: number; studyDoubleProgressChance: number; billsDiscount: number;
  negativeEventCostReduction: number; productivityBonus: number; hiringCostDiscount: number;
  companyMaintenanceDiscount: number; employeeRetentionChance: number; companyRevenueBonus: number;
  companyRiskReduction: number; companyUpgradeDiscount: number; savingsYieldBonus: number;
  companyOperatingCostDiscount: number; companyIncidentCancelChance: number;
  conglomerateRevenuePerCompany: number; allPricesDiscount: number;
}

export const MAX_EQUIPPED_ARTIFACTS = 4;
export const MAX_ARTIFACT_LEVEL = 5;

export const ARTIFACT_BOX_DEFINITIONS: ArtifactBoxDefinition[] = [
  { id: 'basic', name: 'Caixa B\u00e1sica', emoji: '\u{1F4E6}', basePrice: 1_000, chances: { Comum: 80, Raro: 20, '\u00c9pico': 0, 'Lend\u00e1rio': 0, Divinity: 0 }, artifactIds: ['holerite-rubi', 'agenda-oportunidades', 'planner-acelerado', 'cartao-beneficios', 'seguro-bolso', 'medalha-desempenho'] },
  { id: 'premium', name: 'Caixa Premium', emoji: '\u{1F381}', basePrice: 10_000, chances: { Comum: 0, Raro: 94.99, '\u00c9pico': 5, 'Lend\u00e1rio': 0.01, Divinity: 0 }, artifactIds: ['cracha-recrutador', 'kit-manutencao', 'manual-retencao', 'pasta-contratos', 'extintor-corporativo', 'selo-franquia'] },
  { id: 'elite', name: 'Caixa Elite', emoji: '\u{1F48E}', basePrice: 50_000, chances: { Comum: 0, Raro: 94.9899, '\u00c9pico': 5, 'Lend\u00e1rio': 0.01, Divinity: 0.0001 }, artifactIds: ['blindagem-patrimonial', 'cofre-dividendos', 'auditoria-suprema', 'holding-dourada', 'seguro-sistemico', 'chave-conglomerado', 'cartao-black'] },
];

export const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [
  { id: 'holerite-rubi', name: 'Holerite Rubi', emoji: '\u{1F4C4}', rarity: 'Comum', description: 'Aumenta o sal\u00e1rio recebido.', effect: 'salaryBonus', valuePerLevel: 0.03 },
  { id: 'agenda-oportunidades', name: 'Agenda de Oportunidades', emoji: '\u{1F4C6}', rarity: 'Comum', description: 'Aumenta a chance de receber propostas de emprego.', effect: 'jobChanceBonus', valuePerLevel: 0.015 },
  { id: 'planner-acelerado', name: 'Planner Acelerado', emoji: '\u{1F4DA}', rarity: 'Comum', description: 'Pode conceder progresso extra ao estudar.', effect: 'studyDoubleProgressChance', valuePerLevel: 0.06 },
  { id: 'cartao-beneficios', name: 'Cart\u00e3o de Benef\u00edcios', emoji: '\u{1F4B3}', rarity: 'Comum', description: 'Reduz as contas mensais.', effect: 'billsDiscount', valuePerLevel: 0.02 },
  { id: 'seguro-bolso', name: 'Seguro de Bolso', emoji: '\u{1F6E1}\uFE0F', rarity: 'Raro', description: 'Reduz gastos de eventos pessoais negativos.', effect: 'negativeEventCostReduction', valuePerLevel: 0.05 },
  { id: 'medalha-desempenho', name: 'Medalha de Desempenho', emoji: '\u{1F3C5}', rarity: 'Raro', description: 'Melhora seu desempenho todos os meses.', effect: 'productivityBonus', valuePerLevel: 1 },
  { id: 'cracha-recrutador', name: 'Crach\u00e1 do Recrutador', emoji: '\u{1FAAA}', rarity: 'Raro', description: 'Reduz o custo de contrata\u00e7\u00e3o.', effect: 'hiringCostDiscount', valuePerLevel: 0.05 },
  { id: 'kit-manutencao', name: 'Kit de Manuten\u00e7\u00e3o', emoji: '\u{1F9F0}', rarity: 'Raro', description: 'Reduz a manuten\u00e7\u00e3o das empresas.', effect: 'companyMaintenanceDiscount', valuePerLevel: 0.03 },
  { id: 'manual-retencao', name: 'Manual de Reten\u00e7\u00e3o', emoji: '\u{1F91D}', rarity: 'Raro', description: 'Pode impedir demiss\u00f5es causadas por incidentes.', effect: 'employeeRetentionChance', valuePerLevel: 0.08 },
  { id: 'pasta-contratos', name: 'Pasta de Contratos', emoji: '\u{1F4BC}', rarity: '\u00c9pico', description: 'Aumenta a receita bruta das empresas.', effect: 'companyRevenueBonus', valuePerLevel: 0.04 },
  { id: 'extintor-corporativo', name: 'Extintor Corporativo', emoji: '\u{1F9EF}', rarity: '\u00c9pico', description: 'Reduz o risco de incidentes empresariais.', effect: 'companyRiskReduction', valuePerLevel: 0.07 },
  { id: 'selo-franquia', name: 'Selo da Franquia', emoji: '\u{1F3F7}\uFE0F', rarity: 'Lend\u00e1rio', description: 'Reduz o pre\u00e7o das melhorias empresariais.', effect: 'companyUpgradeDiscount', valuePerLevel: 0.04 },
  { id: 'blindagem-patrimonial', name: 'Blindagem Patrimonial', emoji: '\u{1F3F0}', rarity: 'Raro', description: 'Reduz custos de eventos negativos.', effect: 'negativeEventCostReduction', valuePerLevel: 0.06 },
  { id: 'cofre-dividendos', name: 'Cofre de Dividendos', emoji: '\u{1F4B0}', rarity: 'Lend\u00e1rio', description: 'Melhora o rendimento mensal da poupan\u00e7a.', effect: 'savingsYieldBonus', valuePerLevel: 0.0008 },
  { id: 'auditoria-suprema', name: 'Auditoria Suprema', emoji: '\u{1F4CA}', rarity: '\u00c9pico', description: 'Reduz folha salarial e manuten\u00e7\u00e3o das empresas.', effect: 'companyOperatingCostDiscount', valuePerLevel: 0.03 },
  { id: 'holding-dourada', name: 'Holding Dourada', emoji: '\u{1F3E2}', rarity: '\u00c9pico', description: 'Aumenta a receita das empresas.', effect: 'companyRevenueBonus', valuePerLevel: 0.05 },
  { id: 'seguro-sistemico', name: 'Seguro Sist\u00eamico', emoji: '\u2602\uFE0F', rarity: '\u00c9pico', description: 'Pode cancelar completamente um incidente empresarial.', effect: 'companyIncidentCancelChance', valuePerLevel: 0.10 },
  { id: 'chave-conglomerado', name: 'Chave do Conglomerado', emoji: '\u{1F511}', rarity: 'Lend\u00e1rio', description: 'Aumenta a receita por empresa operando.', effect: 'conglomerateRevenuePerCompany', valuePerLevel: 0.005 },
  { id: 'cartao-black', name: 'Cart\u00e3o Black', emoji: '\u{1F4B3}', rarity: 'Divinity', description: 'Reduz em 50% o pre\u00e7o de todas as compras e servi\u00e7os.', effect: 'allPricesDiscount', valuePerLevel: 0.5 },
];

export function getArtifactBoxPrice(boxType: ArtifactBoxType, retirementCount: number): number {
  const box = ARTIFACT_BOX_DEFINITIONS.find(item => item.id === boxType) ?? ARTIFACT_BOX_DEFINITIONS[0];
  return box.basePrice * Math.max(1, Math.floor(retirementCount));
}

export function getArtifactEffects(stats: GameStats): ArtifactEffects {
  const effects: ArtifactEffects = { salaryBonus: 0, jobChanceBonus: 0, studyDoubleProgressChance: 0, billsDiscount: 0, negativeEventCostReduction: 0, productivityBonus: 0, hiringCostDiscount: 0, companyMaintenanceDiscount: 0, employeeRetentionChance: 0, companyRevenueBonus: 0, companyRiskReduction: 0, companyUpgradeDiscount: 0, savingsYieldBonus: 0, companyOperatingCostDiscount: 0, companyIncidentCancelChance: 0, conglomerateRevenuePerCompany: 0, allPricesDiscount: 0 };
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

export function pickArtifact(boxType: ArtifactBoxType, randomValue = Math.random(), candidates = ARTIFACT_DEFINITIONS): ArtifactDefinition {
  const box = ARTIFACT_BOX_DEFINITIONS.find(item => item.id === boxType) ?? ARTIFACT_BOX_DEFINITIONS[0];
  const fullCatalog = ARTIFACT_DEFINITIONS.filter(artifact => box.artifactIds.includes(artifact.id));
  const rarities: ArtifactRarity[] = ['Comum', 'Raro', '\u00c9pico', 'Lend\u00e1rio', 'Divinity'];
  const totalWeight = rarities.reduce((total, rarity) => total + box.chances[rarity], 0);
  let roll = Math.max(0, Math.min(0.999999999, randomValue)) * totalWeight;

  for (const rarity of rarities) {
    const weight = box.chances[rarity];
    if (weight <= 0) continue;
    if (roll < weight) {
      const eligible = candidates.filter(artifact => artifact.rarity === rarity);
      const pool = eligible.length > 0 ? eligible : candidates.filter(artifact => box.artifactIds.includes(artifact.id));
      const position = Math.min(pool.length - 1, Math.floor((roll / weight) * pool.length));
      return pool[Math.max(0, position)];
    }
    roll -= weight;
  }

  return fullCatalog[fullCatalog.length - 1];
}
