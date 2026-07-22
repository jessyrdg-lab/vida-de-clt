// Sistema de Saúde
export type HealthStatus = 'Excelente' | 'Saudável' | 'Cansado' | 'Exausto' | 'Doente';

export interface DoencaAtiva {
  id: string;
  nome: string;
  emoji: string;
  custo: number;
}

// Sistema de Felicidade
export type HappinessStatus = 'Radiante' | 'Feliz' | 'Normal' | 'Desanimado' | 'Triste';

// Sistema de Produtividade
export type ProductivityStatus = 'Excelente' | 'Alta' | 'Normal' | 'Baixa' | 'Péssima';

export interface JobOffer {
  id: string;
  cargo: string;
  empresa: string;
  salario: number;
  contas: number;
  nivelExigido: number;
}

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: number;
  read: boolean;
  jobOffer?: JobOffer;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  history: number[];
  volatility: number; // 0.1 = 10% de variação max
}

export interface AssetPosition {
  quantity: number;
  averagePrice: number;
}

export interface Portfolio {
  [symbol: string]: AssetPosition;
}

export type CompanyStrategy = 'safe' | 'balanced' | 'aggressive';
export type ArtifactBoxType = 'basic' | 'premium' | 'elite';
export type ArtifactBoxInventory = Record<ArtifactBoxType, number>;

export interface OwnedCompany {
  id: string;
  level: number;
  employees: number;
  strategy: CompanyStrategy;
}

export interface InterviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface RoomUpgrades {
  sala: number;
  cozinha: number;
  escritorio: number;
  armazem: number;
}

export interface House {
  id: string;
  nome: string;
  tipo: 'Simples' | 'Média' | 'Moderna' | 'Luxuosa';
  preco: number;
}

export interface GameStats {
  playerNick: string;
  devModeUsed: boolean;
  gameOver: boolean;
  deathReason: string;
  saldo: number;
  salario: number;
  comida: number;
  contas: number;
  contasEmAtraso: number;
  mesesEmAtraso: number;
  nivel: number;
  mes: number;
  felicidade: number;
  experiencia: number; 
  experienciaCurriculo: number; 
  nivelCurriculo: number; 
  lenha: number;
  poupanca: number;
  vagas: JobOffer[];
  emails: EmailMessage[];
  stocks: Stock[]; // Lista de ações disponíveis
  cryptos: Stock[]; // Lista de criptos disponíveis
  portfolio: Portfolio; // Ativos (ações e criptos) que o jogador possui
  companies: OwnedCompany[];
  retirementCount: number;
  artifactLevels: Record<string, number>;
  equippedArtifacts: string[];
  artifactBoxes: ArtifactBoxInventory;
  artifactBoxesOpened: number;
  // Títulos e Conquistas
  unlockedTitles: string[];
  equippedTitle: string;
  totalFoodBought: number;
  hasBoughtStock: boolean;
  hasBoughtCrypto: boolean;
  // Sistema de Moradia
  currentHouse: House | null;
  ownedHousesIds: string[];
  perHouseUpgrades: Record<string, { cozinha: number, armazem: number }>;
  roomUpgrades: RoomUpgrades;
  // Sistema de Saúde
  saudeValue: number; // 0-100, 100 = saúde plena
  doencaAtiva: DoencaAtiva | null;
  // Sistema de Felicidade
  humor: HappinessStatus;
  morale: number; // Variável interna (0-100). Não exibir ao jogador.
  // Sistema de Produtividade
  produtividade: ProductivityStatus;
  workPerformance: number; // Variável interna (0-100). Não exibir ao jogador.
  // Progressão de mecânicas (controla visibilidade)
  unlockedMechanics: {
    saude: boolean;        // mes 12
    felicidade: boolean;   // mes 24
    produtividade: boolean; // mes 36
  };
  seenSeasonNotices: Array<'Primavera' | 'Verão' | 'Outono' | 'Inverno'>;
  // Sistema de Cursos
  cursoAtivo: { id: string; progress: number } | null;
  cursosCompletos: string[];
  cursoBenefits: {
    foodDiscount: number;            // Nutrição: 0.10 (10% desconto)
    healthDecayReduction: number;    // Nutrição: 0.30 (30% menos desgaste)
    happinessDecayReduction: number; // Psicologia: 2 (reduz drift negativo)
    jobChanceBonus: number;          // Finanças+Admin+TI acumulativo
    productivityBonus: number;       // Administração: bônus em workPerformance
  };
}

export interface GameEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'positive' | 'negative' | 'neutral' | 'career';
}

export interface AIResponse {
  eventDescription: string;
  statChanges: Partial<GameStats>;
}
