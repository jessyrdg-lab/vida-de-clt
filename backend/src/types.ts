// ============================================================
// Tipos compartilhados — espelham os tipos do frontend
// O servidor é a fonte da verdade para todos esses valores
// ============================================================

export type Season = 'Primavera' | 'Verão' | 'Outono' | 'Inverno';
export type HealthStatus = 'Excelente' | 'Saudável' | 'Cansado' | 'Exausto' | 'Doente';
export type HappinessStatus = 'Radiante' | 'Feliz' | 'Normal' | 'Desanimado' | 'Triste';
export type ProductivityStatus = 'Excelente' | 'Alta' | 'Normal' | 'Baixa' | 'Péssima';

export interface DoencaAtiva {
  id: string;
  nome: string;
  emoji: string;
  custo: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  history: number[];
  volatility: number;
}

export interface AssetPosition {
  quantity: number;
  averagePrice: number;
}

export interface Portfolio {
  [symbol: string]: AssetPosition;
}

export interface RoomUpgrades {
  sala: number;
  cozinha: number;
  escritorio: number;
  armazem: number;
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
  stocks: Stock[];
  cryptos: Stock[];
  portfolio: Portfolio;
  unlockedTitles: string[];
  equippedTitle: string;
  totalFoodBought: number;
  hasBoughtStock: boolean;
  hasBoughtCrypto: boolean;
  currentHouse: null;
  ownedHousesIds: string[];
  perHouseUpgrades: Record<string, any>;
  roomUpgrades: RoomUpgrades;
  saudeValue: number;
  doencaAtiva: DoencaAtiva | null;
  humor: HappinessStatus;
  morale: number;
  produtividade: ProductivityStatus;
  workPerformance: number;
  unlockedMechanics: {
    saude: boolean;
    felicidade: boolean;
    produtividade: boolean;
  };
  seenSeasonNotices: Season[];
  cursoAtivo: { id: string; progress: number } | null;
  cursosCompletos: string[];
  cursoBenefits: {
    foodDiscount: number;
    healthDecayReduction: number;
    happinessDecayReduction: number;
    jobChanceBonus: number;
    productivityBonus: number;
  };
}

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

export interface GameEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'positive' | 'negative' | 'neutral' | 'career';
}

// ============================================================
// Action types — cliente só pode enviar estas ações
// O servidor valida e aplica cada uma delas
// ============================================================

export type GameAction =
  | { type: 'INIT_PLAYER'; nick: string }
  | { type: 'PASS_MONTH' }
  | { type: 'BUY_FOOD'; qty: number }
  | { type: 'BUY_WOOD'; qty: number }
  | { type: 'PAY_BILLS'; amount: number }
  | { type: 'STUDY_DEGREE' }
  | { type: 'STUDY_COURSE' }
  | { type: 'SELECT_COURSE'; courseId: string }
  | { type: 'CONFIRM_SWAP_COURSE'; courseId: string }
  | { type: 'HEALTH_ACTION'; actionId: string }
  | { type: 'PAY_DISEASE' }
  | { type: 'LEISURE'; activityId: string }
  | { type: 'ACCEPT_JOB'; offerId: string; perfectInterview?: boolean }
  | { type: 'INVEST_DEPOSIT'; amount: number }
  | { type: 'INVEST_WITHDRAW'; amount: number }
  | { type: 'BUY_ASSET'; symbol: string; qty: number; assetType: 'stock' | 'crypto' }
  | { type: 'SELL_ASSET'; symbol: string; qty: number; assetType: 'stock' | 'crypto' }
  | { type: 'EQUIP_TITLE'; titleId: string }
  | { type: 'READ_EMAIL'; emailId: string }
  | { type: 'DELETE_EMAIL'; emailId: string }
  | { type: 'DEV_SET_STATS'; saldo: number; comida: number; lenha: number }
  | { type: 'RESET_GAME' };

export interface ActionResult {
  ok: boolean;
  error?: string;
  stats?: GameStats;
  events?: GameEvent[];
  // Flags de UI que o servidor precisa sinalizar
  flags?: {
    mechUnlocked?: 'saude' | 'felicidade' | 'produtividade';
    novaDoenca?: boolean;
    seasonNotice?: Season;
    gameOver?: boolean;
    deathReason?: string;
    monthlyEventBalanceChange?: number;
  };
}
