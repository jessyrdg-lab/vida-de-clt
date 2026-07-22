import { CompanyStrategy, ProductivityStatus } from './types.js';

export interface CompanyDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  purchaseCost: number;
  baseGrossRevenue: number;
  baseMaintenance: number;
  salaryPerEmployee: number;
  baseEmployees: number;
  employeesPerLevel: number;
  baseUpgradeCost: number;
  maxLevel: number;
}

export const COMPANY_DEFINITIONS: CompanyDefinition[] = [
  { id: 'lanchonete', name: 'Lanchonete', emoji: '🍔', description: 'Lanches rápidos e movimento constante.', purchaseCost: 1_000_000, baseGrossRevenue: 90_000, baseMaintenance: 15_000, salaryPerEmployee: 4_000, baseEmployees: 4, employeesPerLevel: 2, baseUpgradeCost: 600_000, maxLevel: 5 },
  { id: 'mercado', name: 'Mercado', emoji: '🛒', description: 'Vendas essenciais todos os dias.', purchaseCost: 3_000_000, baseGrossRevenue: 230_000, baseMaintenance: 35_000, salaryPerEmployee: 4_500, baseEmployees: 8, employeesPerLevel: 4, baseUpgradeCost: 1_800_000, maxLevel: 5 },
  { id: 'oficina', name: 'Oficina', emoji: '🔧', description: 'Manutenção e reparos de veículos.', purchaseCost: 7_000_000, baseGrossRevenue: 520_000, baseMaintenance: 75_000, salaryPerEmployee: 6_000, baseEmployees: 12, employeesPerLevel: 5, baseUpgradeCost: 4_200_000, maxLevel: 5 },
  { id: 'restaurante', name: 'Restaurante', emoji: '🍽️', description: 'Gastronomia com uma operação exigente.', purchaseCost: 15_000_000, baseGrossRevenue: 1_100_000, baseMaintenance: 170_000, salaryPerEmployee: 5_500, baseEmployees: 25, employeesPerLevel: 10, baseUpgradeCost: 9_000_000, maxLevel: 5 },
  { id: 'informatica', name: 'Loja de informática', emoji: '💻', description: 'Tecnologia, equipamentos e serviços.', purchaseCost: 30_000_000, baseGrossRevenue: 2_100_000, baseMaintenance: 280_000, salaryPerEmployee: 8_500, baseEmployees: 35, employeesPerLevel: 14, baseUpgradeCost: 18_000_000, maxLevel: 5 },
  { id: 'fabrica', name: 'Fábrica', emoji: '🏭', description: 'Produção em larga escala e alto custo operacional.', purchaseCost: 75_000_000, baseGrossRevenue: 5_200_000, baseMaintenance: 900_000, salaryPerEmployee: 6_000, baseEmployees: 90, employeesPerLevel: 35, baseUpgradeCost: 45_000_000, maxLevel: 5 },
  { id: 'banco', name: 'Banco', emoji: '🏦', description: 'Uma instituição financeira de alto rendimento.', purchaseCost: 200_000_000, baseGrossRevenue: 13_500_000, baseMaintenance: 2_400_000, salaryPerEmployee: 12_000, baseEmployees: 140, employeesPerLevel: 55, baseUpgradeCost: 120_000_000, maxLevel: 5 },
  { id: 'companhia-aerea', name: 'Companhia aérea', emoji: '✈️', description: 'A empresa mais cara e complexa do jogo.', purchaseCost: 500_000_000, baseGrossRevenue: 32_000_000, baseMaintenance: 7_500_000, salaryPerEmployee: 15_000, baseEmployees: 260, employeesPerLevel: 100, baseUpgradeCost: 300_000_000, maxLevel: 5 },
];

export function getCompanyRequiredEmployees(definition: CompanyDefinition, level: number): number {
  return definition.baseEmployees + Math.max(0, level - 1) * definition.employeesPerLevel;
}

export function getCompanyGrossRevenue(definition: CompanyDefinition, level: number): number {
  return Math.floor(definition.baseGrossRevenue * (1 + Math.max(0, level - 1) * 0.6));
}

export function getCompanyMaintenance(definition: CompanyDefinition, level: number): number {
  return Math.floor(definition.baseMaintenance * (1 + Math.max(0, level - 1) * 0.45));
}

export function getCompanyUpgradeCost(definition: CompanyDefinition, currentLevel: number): number | null {
  if (currentLevel >= definition.maxLevel) return null;
  return Math.floor(definition.baseUpgradeCost * Math.pow(1.9, Math.max(0, currentLevel - 1)));
}

export function getEmployeeHiringCost(definition: CompanyDefinition): number {
  return definition.salaryPerEmployee * 2;
}

export function getCompanyProjectedGrossRevenue(
  definition: CompanyDefinition,
  level: number,
  strategy: CompanyStrategy,
  productivity: ProductivityStatus,
  productivityEnabled = true,
): number {
  const strategyDefinition = getCompanyStrategy(strategy);
  return Math.floor(getCompanyGrossRevenue(definition, level) * strategyDefinition.profitMultiplier);
}

export function getCompanyRiskChance(
  strategy: CompanyStrategy,
  productivity: ProductivityStatus,
  productivityEnabled = true,
): number {
  const strategyDefinition = getCompanyStrategy(strategy);
  return Math.min(0.35, strategyDefinition.baseRisk);
}
export interface CompanyStrategyDefinition {
  id: CompanyStrategy;
  name: string;
  emoji: string;
  description: string;
  profitMultiplier: number;
  baseRisk: number;
  incidentSeverityMultiplier: number;
}

export const COMPANY_STRATEGIES: CompanyStrategyDefinition[] = [
  { id: 'safe', name: 'Seguro', emoji: '🛡️', description: 'Lucro menor, pouco risco e prejuízos reduzidos.', profitMultiplier: 0.90, baseRisk: 0.03, incidentSeverityMultiplier: 0.65 },
  { id: 'balanced', name: 'Equilibrado', emoji: '⚖️', description: 'Lucro, risco e prejuízos moderados.', profitMultiplier: 1, baseRisk: 0.07, incidentSeverityMultiplier: 1 },
  { id: 'aggressive', name: 'Pesado', emoji: '🔥', description: 'Lucro muito alto, mas incidentes muito caros.', profitMultiplier: 1.35, baseRisk: 0.18, incidentSeverityMultiplier: 3 },
];

export function getCompanyStrategy(strategy: CompanyStrategy): CompanyStrategyDefinition {
  return COMPANY_STRATEGIES.find(item => item.id === strategy) ?? COMPANY_STRATEGIES[1];
}

export function getBusinessProductivityModifiers(productivity: ProductivityStatus, enabled = true): { profit: number; risk: number } {
  if (!enabled) return { profit: 1, risk: 1 };
  if (productivity === 'Excelente') return { profit: 1.15, risk: 0.5 };
  if (productivity === 'Alta') return { profit: 1.08, risk: 0.7 };
  if (productivity === 'Baixa') return { profit: 0.9, risk: 1.25 };
  if (productivity === 'Péssima') return { profit: 0.75, risk: 1.6 };
  return { profit: 1, risk: 1 };
}
