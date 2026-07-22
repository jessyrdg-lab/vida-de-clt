import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameStats, GameEvent, JobOffer, Stock, AssetPosition, EmailMessage, InterviewQuestion, House, RoomUpgrades, HealthStatus, HappinessStatus, ProductivityStatus, DoencaAtiva, CompanyStrategy, ArtifactBoxType } from './types';
import {
  COMPANY_DEFINITIONS, COMPANY_STRATEGIES, COMPANY_UNLOCK_WEALTH,
  getCompanyMaintenance, getCompanyProjectedGrossRevenue,
  getCompanyRequiredEmployees, getCompanyRiskChance, getCompanyStrategy, getCompanyUpgradeCost, getEmployeeHiringCost,
} from './companies';
import {
  ARTIFACT_BOX_DEFINITIONS, ARTIFACT_DEFINITIONS, ARTIFACT_RARITY_STYLE, MAX_ARTIFACT_LEVEL, MAX_EQUIPPED_ARTIFACTS, ArtifactDefinition,
  describeArtifactEffect, getArtifactBoxPrice, getArtifactEffects,
} from './artifacts';
import { StatCard } from './components/StatCard';
import { ActionLog } from './components/ActionLog';
import { getInterviewQuestion, resetInterviewSession } from './questionBank';
import {
  deleteSave as deleteServerSave,
  dispatch as dispatchGameAction,
  initGame as initServerGame,
  loadGame as loadServerGame,
  loadLeaderboard,
  saveGame as saveServerGame,
  waitForServer,
  hasToken,
  DispatchResult,
  GameAction,
  LeaderboardEntry,
} from './apiClient';

const getArtifactIconStyle = (rarity: keyof typeof ARTIFACT_RARITY_STYLE) =>
  rarity === 'Lendário'
    ? 'artifact-legendary-rgb text-white'
    : `bg-gradient-to-br ${ARTIFACT_RARITY_STYLE[rarity]} ${rarity === 'Divinity' ? 'text-slate-900' : 'text-white'}`;

const getArtifactCardStyle = (artifact: ArtifactDefinition) =>
  `${ARTIFACT_RARITY_STYLE[artifact.rarity]} ${artifact.rarity === 'Lendário' ? 'artifact-legendary-border-rgb' : ''}`;

const ArtifactIcon = ({ artifact }: { artifact: ArtifactDefinition }) => artifact.id === 'cartao-black'
  ? <img src={`${import.meta.env.BASE_URL}artifacts/cartao-black.svg`} alt="Cartão Black" className="h-[78%] w-[88%] object-contain" />
  : <>{artifact.emoji}</>;

// Definição dos Títulos
const TITLES_LIST = [
  // FÁCIL
  { id: 'CLT', name: 'CLT', desc: 'Passe o seu 1° mês!', difficulty: 'Fácil' },
  { id: 'Investidor', name: 'Investidor', desc: 'Compre sua 1° ação', difficulty: 'Fácil' },
  { id: 'BomPapo', name: 'Bom de papo', desc: 'Passar em entrevista com 0 erros', difficulty: 'Fácil' },

  // MÉDIO
  { id: 'Gorducho', name: 'Gorducho', desc: 'Compre 100 Comidas', difficulty: 'Médio' },
  { id: 'Diplomado', name: 'Diplomado', desc: 'Complete a graduação da faculdade', difficulty: 'Médio' },
  { id: 'WinterWarrior', name: 'Winter warrior', desc: 'Sobreviva ao inverno', difficulty: 'Médio' },
  { id: 'CryptoMaster', name: 'Cripto Master', desc: 'Compre sua 1° criptomoeda', difficulty: 'Médio' },

  // DIFÍCIL
  { id: 'Empresario', name: 'Empresário', desc: 'Compre sua 1ª empresa', difficulty: 'Difícil' },
  { id: 'CLThanos', name: 'CLThanos', desc: 'Atinja 100 meses de trabalho', difficulty: 'Difícil' },
  { id: 'Doctor', name: 'Doctor', desc: 'Complete toda a faculdade', difficulty: 'Difícil' },
  { id: 'Sabido', name: 'Sabido', desc: 'Complete todos os cursos', difficulty: 'Difícil' },
  { id: 'OneMillion', name: 'One in a million', desc: 'Atinja R$ 1.000.000', difficulty: 'Difícil' },

  // INSANO
  { id: 'Aposentado', name: 'Aposentado', desc: 'Complete sua primeira aposentadoria', difficulty: 'Insano' },
  { id: 'Magnata', name: 'Magnata', desc: 'Atinja R$ 1.000.000.000 de saldo', difficulty: 'Insano' },
  { id: 'Unboxer', name: 'Unboxer', desc: 'Abra 1.000 caixas de artefatos', difficulty: 'Insano' },
  { id: 'Colecionador', name: 'Colecionador', desc: 'Complete o Index de artefatos', difficulty: 'Insano' },
  { id: 'NoLife', name: 'No Life', desc: 'Abra 10.000 caixas de artefatos', difficulty: 'Insano+++' },

  // INSANO +++
  { id: 'ImmortalOne', name: 'Immortal One', desc: 'Complete todos os 10 rebirths', difficulty: 'Insano+++' },
  { id: 'GOD', name: 'GøD', desc: 'Tenha todos os títulos (Exceto exclusivos)', difficulty: 'Insano+++' },

  // EXCLUSIVO (não é necessário para desbloquear o GøD)
  { id: 'GlobalPlayer', name: 'Global Player', desc: 'Esteja entre os 10 jogadores mais ricos do Ranking Global', difficulty: 'Exclusivo' }
];

const SEASON_IMAGES = [
  `${import.meta.env.BASE_URL}seasons/primavera1.jpg`,  // Mês 1 - Primavera
  `${import.meta.env.BASE_URL}seasons/primavera2.webp`, // Mês 2 - Primavera
  `${import.meta.env.BASE_URL}seasons/primavera3.webp`, // Mês 3 - Primavera
  `${import.meta.env.BASE_URL}seasons/verao1.jpg`,      // Mês 4 - Verão
  `${import.meta.env.BASE_URL}seasons/verao2.jpg`,      // Mês 5 - Verão
  `${import.meta.env.BASE_URL}seasons/verao3.jpg`,      // Mês 6 - Verão
  `${import.meta.env.BASE_URL}seasons/outono1.webp`,    // Mês 7 - Outono
  `${import.meta.env.BASE_URL}seasons/outono2.jpg`,     // Mês 8 - Outono
  `${import.meta.env.BASE_URL}seasons/outono3.jpg`,     // Mês 9 - Outono
  `${import.meta.env.BASE_URL}seasons/inverno1.jpg`,    // Mês 10 - Inverno
  `${import.meta.env.BASE_URL}seasons/inverno2.jpg`,    // Mês 11 - Inverno
  `${import.meta.env.BASE_URL}seasons/inverno3.jpg`,    // Mês 12 - Inverno
];

const BANNED_NAMES = ['admin', 'moderador', 'suporte', 'root', 'puta', 'viado', 'caralho', 'merda', 'porra', 'buceta', 'cu', 'piroca', 'pica', 'vagina', 'gay', 'corno'];

// Helper para cores dos títulos (Desbloqueados no Inventário)
const getTitleStyle = (titleName: string) => {
  const baseClasses = "font-bold uppercase tracking-tight"; 
  
  switch (titleName) {
    case 'CLT':
      return `${baseClasses} bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent`;
    case 'Gorducho':
      return `${baseClasses} bg-gradient-to-r from-amber-200 via-amber-400 to-orange-600 bg-clip-text text-transparent`;
    case 'Diplomado':
      return `${baseClasses} bg-gradient-to-r from-slate-300 to-slate-500 bg-clip-text text-transparent`;
    case 'Investidor':
      return `${baseClasses} bg-gradient-to-r from-emerald-300 via-green-500 to-emerald-600 bg-clip-text text-transparent`;
    case 'Magnata':
      return `${baseClasses} bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-600 bg-clip-text text-transparent`;
    case 'One in a million':
      return `${baseClasses} bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent`;
    case 'CLThanos':
      return `${baseClasses} bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-700 bg-clip-text text-transparent`;
    case 'Winter warrior':
      return `${baseClasses} bg-gradient-to-r from-blue-300 via-blue-500 to-blue-700 bg-clip-text text-transparent`;
    case 'Cripto Master':
      return `${baseClasses} bg-gradient-to-r from-yellow-100 to-yellow-400 bg-clip-text text-transparent`;
    case 'Doctor':
      return `${baseClasses} bg-gradient-to-r from-rose-300 via-red-500 to-red-700 bg-clip-text text-transparent`;
    case 'Sabido':
      return `${baseClasses} bg-gradient-to-r from-orange-200 via-orange-400 to-amber-600 bg-clip-text text-transparent`;
    case 'Aposentado':
      return `${baseClasses} bg-gradient-to-r from-cyan-300 via-emerald-400 to-teal-600 bg-clip-text text-transparent`;
    case 'Empresário':
      return `${baseClasses} bg-gradient-to-r from-amber-300 via-orange-500 to-rose-500 bg-clip-text text-transparent`;
    case 'Unboxer':
      return `${baseClasses} bg-gradient-to-r from-violet-300 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent`;
    case 'Colecionador':
      return `${baseClasses} bg-gradient-to-r from-sky-300 via-cyan-400 to-emerald-400 bg-clip-text text-transparent`;
    case 'No Life':
      return `${baseClasses} bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-transparent`;
    case 'Immortal One':
      return `${baseClasses} bg-gradient-to-r from-purple-300 via-violet-500 to-fuchsia-700 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(139,92,246,0.45)]`;
    case 'Bom de papo':
      return `${baseClasses} bg-gradient-to-r from-green-200 to-green-400 bg-clip-text text-transparent`;
    case 'Global Player':
      return `${baseClasses} bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-700 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]`;
    case 'GøD':
      return `${baseClasses} bg-black text-white px-3 py-1 rounded-xl inline-block`;
    default:
      return `${baseClasses} text-primary`;
  }
};

// Componente Sparkline
const Sparkline: React.FC<{ data: number[]; id: string }> = ({ data, id }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length < 2) return null;

  const width = 140;
  const height = 50;
  
  const rawMin = Math.min(...data);
  const rawMax = Math.max(...data);
  const rawRange = rawMax - rawMin || 1;
  const buffer = rawRange * 0.25;
  
  const min = rawMin - buffer;
  const max = rawMax + buffer;
  const range = max - min;
  
  const pointsArr = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return { x, y };
  });

  const pointsStr = pointsArr.map(p => `${p.x},${p.y}`).join(' ');
  const polygonPoints = `0,${height} ${pointsStr} ${width},${height}`;
  
  const isUp = data[data.length - 1] >= data[0];
  const neonColor = isUp ? '#00FFDD' : '#FF0066';
  const glowId = `glow-${id}`;
  const gradId = `grad-${id}`;

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percent * (data.length - 1));
    setHoverIndex(index);
  };

  return (
    <div className="relative w-32 h-12 flex items-center justify-center group/chart cursor-crosshair">
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="overflow-visible"
        preserveAspectRatio="none"
        onMouseMove={handleInteraction}
        onClick={handleInteraction}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchMove={handleInteraction}
        onTouchStart={handleInteraction}
      >
        <defs>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient 
            id={gradId} 
            gradientUnits="userSpaceOnUse"
            x1="0" y1="0" x2="0" y2={height}
          >
            <stop offset="0%" stopColor={neonColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={neonColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={polygonPoints}
          fill={`url(#${gradId})`}
          className="transition-all duration-500 ease-in-out"
        />
        <polyline
          points={pointsStr}
          fill="none"
          stroke={neonColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          className="transition-all duration-500 ease-in-out"
        />
        {hoverIndex !== null && (
          <>
            <line 
              x1={pointsArr[hoverIndex].x} 
              y1="0" 
              x2={pointsArr[hoverIndex].x} 
              y2={height} 
              stroke={neonColor} 
              strokeWidth="1" 
              strokeDasharray="2,2" 
            />
            <circle 
              cx={pointsArr[hoverIndex].x} 
              cy={pointsArr[hoverIndex].y} 
              r="3" 
              fill={neonColor} 
              filter={`url(#${glowId})`}
            />
          </>
        )}
      </svg>
      {hoverIndex !== null && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[9px] font-bold px-2 py-1 rounded shadow-xl z-20 whitespace-nowrap pointer-events-none">
          R$ {data[hoverIndex].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

const INITIAL_STOCKS: Stock[] = [
  { symbol: 'PETR4', name: 'Petrobras', price: 35.50, history: [34, 34.5, 35, 34.8, 35.2, 35, 34.5, 35.1, 35.3, 35.50], volatility: 0.15 },
  { symbol: 'VALE3', name: 'Vale S.A.', price: 68.20, history: [70, 69.5, 69, 68.5, 68.2, 67.8, 68, 68.5, 68, 68.20], volatility: 0.12 },
  { symbol: 'AAPL34', name: 'Apple Inc.', price: 75.20, history: [70, 71.5, 72.8, 73.2, 74.5, 74, 73.5, 74.8, 75, 75.20], volatility: 0.08 },
  { symbol: 'MSFT34', name: 'Microsoft', price: 82.50, history: [78, 79.2, 80, 80.5, 81.8, 81, 80.5, 81.5, 82, 82.50], volatility: 0.07 },
  { symbol: 'MCDC34', name: 'McDonald\'s', price: 72.10, history: [68, 69, 70.5, 70.2, 71.5, 71.8, 71, 71.5, 71.8, 72.10], volatility: 0.06 },
  { symbol: 'AMZO34', name: 'Amazon', price: 58.40, history: [52, 53.5, 55, 54.8, 56.2, 57, 56.5, 57.8, 58, 58.40], volatility: 0.12 },
  { symbol: 'TSLA34', name: 'Tesla, Inc.', price: 42.15, history: [35, 38, 36.5, 40, 39, 41, 40.5, 43, 41.5, 42.15], volatility: 0.25 },
  { symbol: 'GOGL34', name: 'Google (Alphabet)', price: 78.90, history: [74, 75.2, 76, 76.5, 77.8, 77, 77.5, 78.2, 78.5, 78.90], volatility: 0.09 },
  { symbol: 'COCA34', name: 'Coca-Cola', price: 62.30, history: [60, 60.5, 61, 61.2, 61.8, 61.5, 61.2, 61.8, 62, 62.30], volatility: 0.05 },
  { symbol: 'NFLX34', name: 'Netflix', price: 125.60, history: [110, 115, 118, 120, 122.5, 121, 120.5, 123, 124, 125.60], volatility: 0.18 },
  { symbol: 'NFLX34', name: 'Netflix', price: 125.60, history: [110, 115, 118, 120, 122.5, 121, 120.5, 123, 124, 125.60], volatility: 0.18 },
  { symbol: 'NVDC34', name: 'NVIDIA Corp.', price: 145.20, history: [120, 125, 132, 130, 138, 142, 140, 143, 144, 145.20], volatility: 0.30 },
  { symbol: 'DISB34', name: 'Disney', price: 55.40, history: [58, 57.5, 56, 55.5, 56.2, 55.8, 55, 55.2, 55.3, 55.40], volatility: 0.11 },
];

const INITIAL_CRYPTOS: Stock[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 500000, history: [480000, 500000, 490000, 510000, 530000, 550000, 520000, 510000, 530000, 500000], volatility: 0.15 },
  { symbol: 'ETH', name: 'Ethereum', price: 16000, history: [14000, 14500, 13800, 14200, 15000, 16000, 14800, 14500, 15000, 16000], volatility: 0.18 },
  { symbol: 'SOL', name: 'Solana', price: 820, history: [700, 750, 850, 820, 750, 780, 800, 810, 815, 820], volatility: 0.20 },
];

const INITIAL_STATS: GameStats = {
  playerNick: '',
  devModeUsed: false,
  gameOver: false,
  deathReason: '',
  saldo: 500,
  salario: 1618,
  comida: 5,
  contas: 1200,
  contasEmAtraso: 0,
  mesesEmAtraso: 0,
  nivel: 1,
  mes: 1,
  felicidade: 80,
  experiencia: 0,
  experienciaCurriculo: 0,
  nivelCurriculo: 0, 
  lenha: 0,
  poupanca: 0,
  vagas: [],
  emails: [
    {
      id: 'welcome-email',
      sender: 'RH - Vida de CLT',
      subject: 'Bem-vindo ao mercado de trabalho!',
      body: 'Olá, trabalhador! Estamos felizes em ter você conosco. Fique atento à sua caixa de entrada para novas oportunidades de emprego e comunicados importantes.',
      timestamp: Date.now(),
      read: false
    }
  ],
  stocks: INITIAL_STOCKS,
  cryptos: INITIAL_CRYPTOS,
  portfolio: {},
  companies: [],
  retirementCount: 0,
  artifactLevels: {},
  equippedArtifacts: [],
  artifactBoxes: { basic: 0, premium: 0, elite: 0 },
  artifactBoxesOpened: 0,
  unlockedTitles: [],
  equippedTitle: '',
  totalFoodBought: 0,
  hasBoughtStock: false,
  hasBoughtCrypto: false,
  currentHouse: null,
  ownedHousesIds: [],
  perHouseUpgrades: {},
  roomUpgrades: { sala: 0, cozinha: 0, escritorio: 0, armazem: 0 },
  saudeValue: 100,
  doencaAtiva: null,
  humor: 'Normal',
  morale: 50,
  produtividade: 'Normal',
  workPerformance: 50,
  unlockedMechanics: {
    saude: false,
    felicidade: false,
    produtividade: false,
  },
  seenSeasonNotices: [],
  cursoAtivo: null,
  cursosCompletos: [],
  cursoBenefits: {
    foodDiscount: 0,
    healthDecayReduction: 0,
    happinessDecayReduction: 0,
    jobChanceBonus: 0,
    productivityBonus: 0,
  },
};

const BASE_FOOD_PRICE = 60;
const WOOD_PRICE = 500;
const SAVINGS_YIELD = 0.007;
const MAX_SAVINGS = 1_000_000_000;
const RETIREMENT_BASE_REQUIREMENT = 10_000_000;

const getRetirementRequirement = (retirementCount: number) =>
  RETIREMENT_BASE_REQUIREMENT * (2 ** Math.max(0, Math.floor(retirementCount)));

const getRetirementSalaryMultiplier = (retirementCount: number) =>
  1 + retirementCount * 0.10;

const getRetirementCompanyMultiplier = (retirementCount: number) =>
  1 + retirementCount * 0.05;

const GRAUS_ACADEMICOS = [
  { nome: "Ensino Médio", custoMensal: 0, mesesNecessarios: 0, salBase: 1600 },
  { nome: "Graduação", custoMensal: 400, mesesNecessarios: 12, salBase: 3800 },
  { nome: "Pós-graduação", custoMensal: 700, mesesNecessarios: 12, salBase: 6500 },
  { nome: "Mestrado", custoMensal: 1200, mesesNecessarios: 24, salBase: 13000 },
  { nome: "Doutorado", custoMensal: 2000, mesesNecessarios: 48, salBase: 25000 },
  { nome: "Pós-doutorado", custoMensal: 4000, mesesNecessarios: 18, salBase: 42000 }
];

// === SISTEMA DE CURSOS ===
interface CourseDefinition {
  id: string;
  nome: string;
  emoji: string;
  duracaoEstudos: number;
  mensalidade: number;
  unlockCondition: (stats: GameStats) => boolean;
  unlockLabel: string; // texto exibido quando bloqueado
  descricao: string;
  beneficios: string[];
}

const CURSOS: CourseDefinition[] = [
  {
    id: 'financas',
    nome: 'Finanças',
    emoji: '💰',
    duracaoEstudos: 25,
    mensalidade: 400,
    unlockCondition: () => true, // disponível desde o início
    unlockLabel: '',
    descricao: 'Domine o mercado financeiro e atraia melhores oportunidades.',
    beneficios: ['Desbloqueia os Investimentos (ações e criptos)'],
  },
  {
    id: 'nutricao',
    nome: 'Nutrição',
    emoji: '🥗',
    duracaoEstudos: 20,
    mensalidade: 350,
    unlockCondition: (s) => s.unlockedMechanics.saude,
    unlockLabel: 'Disponível no Mês 12',
    descricao: 'Aprenda a se alimentar melhor e cuide da sua saúde.',
    beneficios: ['Comida 10% mais barata', 'Saúde deteriora mais lentamente'],
  },
  {
    id: 'psicologia',
    nome: 'Psicologia',
    emoji: '🧠',
    duracaoEstudos: 30,
    mensalidade: 500,
    unlockCondition: (s) => s.unlockedMechanics.felicidade,
    unlockLabel: 'Disponível no Mês 24',
    descricao: 'Entenda a mente humana e melhore seu bem-estar.',
    beneficios: ['Felicidade diminui mais lentamente'],
  },
  {
    id: 'administracao',
    nome: 'Administração',
    emoji: '🏢',
    duracaoEstudos: 35,
    mensalidade: 550,
    unlockCondition: (s) => s.unlockedMechanics.produtividade,
    unlockLabel: 'Disponível no Mês 36',
    descricao: 'Desenvolva habilidades de gestão e liderança.',
    beneficios: ['Aumenta produtividade', 'Aumenta chance de propostas de emprego melhores'],
  },
  {
    id: 'ti',
    nome: 'TI',
    emoji: '💻',
    duracaoEstudos: 50,
    mensalidade: 700,
    unlockCondition: (s) => s.unlockedMechanics.produtividade,
    unlockLabel: 'Disponível no Mês 36',
    descricao: 'Tecnologia da informação para o mercado moderno.',
    beneficios: ['Aumenta significativamente as chances de propostas de emprego melhores'],
  },
];

const getCursoById = (id: string) => CURSOS.find(c => c.id === id) ?? null;

const CARGOS = ["Auxiliar Operacional", "Analista Trainee", "Especialista Pleno", "Coordenador de Área", "Diretor Executivo", "Cientista Chefe"];
const EMPRESAS = ["TechSolutions", "LogiCorp", "Banco Dinheiro", "Varejo Total", "Inova S.A", "Consultoria Pro"];

type Season = 'Primavera' | 'Verão' | 'Outono' | 'Inverno';

const seasonColors: Record<Season, string> = {
  'Primavera': 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  'Verão': 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  'Outono': 'bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300',
  'Inverno': 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
};

const seasonIcons: Record<Season, string> = {
  'Primavera': '🌸',
  'Verão': '☀️',
  'Outono': '🍂',
  'Inverno': '❄️',
};

const seasonNoticeConfig: Record<Season, {
  title: string;
  phrase: string;
  effect: string;
  details: string;
  gradient: string;
  button: string;
}> = {
  'Primavera': {
    title: 'Primavera chegou!',
    phrase: 'Uma nova fase começa a florescer.',
    effect: 'Estudar graduação custa 30% menos.',
    details: 'Aproveite a estação para avançar mais barato na sua formação acadêmica.',
    gradient: 'from-emerald-500 to-pink-500',
    button: 'bg-emerald-600 hover:bg-emerald-500',
  },
  'Verão': {
    title: 'Verão chegou!',
    phrase: 'O calor muda o ritmo do trabalho.',
    effect: 'Seu salário fica 30% menor.',
    details: 'Durante o verão, a renda mensal é reduzida. Organize seu saldo e evite novas dívidas.',
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    button: 'bg-amber-600 hover:bg-amber-500',
  },
  'Outono': {
    title: 'Outono chegou!',
    phrase: 'Tempo de abastecer a despensa.',
    effect: 'A comida fica cerca de 33% mais barata.',
    details: 'Este é o melhor momento para comprar comida e preparar seu estoque para os próximos meses.',
    gradient: 'from-amber-400 via-orange-600 to-red-900',
    button: 'bg-orange-600 hover:bg-orange-500',
  },
  'Inverno': {
    title: 'Inverno chegou!',
    phrase: 'As noites estão ficando mais frias.',
    effect: 'Cada mês de inverno consome 1 lenha.',
    details: 'Sem lenha suficiente, você não sobreviverá ao frio.',
    gradient: 'from-indigo-700 via-blue-600 to-cyan-400',
    button: 'bg-cyan-600 hover:bg-cyan-500',
  },
};

// === SISTEMA DE SAÚDE (numérico 0-100) ===

// Categoria interna usada apenas para os cálculos de felicidade/produtividade
const getHealthCategory = (value: number): HealthStatus => {
  if (value >= 85) return 'Excelente';
  if (value >= 60) return 'Saudável';
  if (value >= 40) return 'Cansado';
  if (value >= 20) return 'Exausto';
  return 'Doente';
};

// Cor da barra de saúde conforme o valor atual
const getHealthBarColor = (value: number): string => {
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 60) return 'bg-lime-500';
  if (value >= 40) return 'bg-amber-500';
  if (value >= 20) return 'bg-orange-500';
  return 'bg-rose-500';
};

// Chance de adoecer no próximo mês, conforme faixa de saúde
const getDiseaseChanceInfo = (value: number): { chance: number; pct: number; colorClass: string } => {
  if (value >= 80) return { chance: 0,    pct: 0,  colorClass: 'text-emerald-400' };
  if (value >= 60) return { chance: 0.02, pct: 2,  colorClass: 'text-lime-400' };
  if (value >= 40) return { chance: 0.05, pct: 5,  colorClass: 'text-yellow-400' };
  if (value >= 20) return { chance: 0.10, pct: 10, colorClass: 'text-red-400' };
  return            { chance: 0.20, pct: 20, colorClass: 'text-slate-300' };
};

// Lista de doenças possíveis
interface DoencaDef { id: string; nome: string; emoji: string; multiplicador: number; min: number; max: number; }
const DOENCAS: DoencaDef[] = [
  { id: 'gripe',        nome: 'Gripe',                 emoji: '🤧', multiplicador: 0.10, min: 100,  max: 2000 },
  { id: 'infeccao',     nome: 'Infecção',              emoji: '🦠', multiplicador: 0.25, min: 300,  max: 5000 },
  { id: 'respiratorio', nome: 'Problema Respiratório', emoji: '🫁', multiplicador: 0.50, min: 700,  max: 10000 },
  { id: 'cirurgia',     nome: 'Cirurgia Simples',      emoji: '🏥', multiplicador: 1.00, min: 2000, max: 50000 },
];

// Sorteia uma doença; quanto menor a saúde, maior a chance de doenças mais caras
const pickDisease = (saudeValue: number, salario: number): DoencaAtiva => {
  const severityBias = Math.max(0, (60 - saudeValue) / 60); // 0 em saúde >=60, até 1 em saúde 0
  const weights = DOENCAS.map((_, i) => 1 + severityBias * i * 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let chosen = DOENCAS[0];
  for (let i = 0; i < DOENCAS.length; i++) {
    r -= weights[i];
    if (r <= 0) { chosen = DOENCAS[i]; break; }
  }
  const custoRaw = salario * chosen.multiplicador;
  const custo = Math.max(chosen.min, Math.min(chosen.max, custoRaw));
  return { id: chosen.id, nome: chosen.nome, emoji: chosen.emoji, custo };
};

// Ações de saúde disponíveis no menu Ações
interface AcaoSaudeDef { id: string; nome: string; emoji: string; custo: number; ganho: number; desc: string; }
const ACOES_SAUDE: AcaoSaudeDef[] = [
  { id: 'exercicio',  nome: 'Exercícios',     emoji: '🏃', custo: 100,  ganho: 5,  desc: 'Você praticou exercícios físicos.' },
  { id: 'exame',      nome: 'Exame de Rotina', emoji: '🩺', custo: 500,  ganho: 15, desc: 'Você realizou um check-up preventivo.' },
  { id: 'suplemento', nome: 'Suplementos',    emoji: '💊', custo: 1500, ganho: 25, desc: 'Você investiu em suplementos para melhorar sua saúde.' },
];

// === SISTEMA DE FELICIDADE ===
const HUMOR_ORDEM: HappinessStatus[] = ['Triste', 'Desanimado', 'Normal', 'Feliz', 'Radiante'];

const getHumorFromMorale = (m: number): HappinessStatus => {
  if (m <= 15) return 'Triste';
  if (m <= 35) return 'Desanimado';
  if (m <= 60) return 'Normal';
  if (m <= 80) return 'Feliz';
  return 'Radiante';
};

const humorIcons: Record<HappinessStatus, string> = {
  'Radiante':   '🌟',
  'Feliz':      '😄',
  'Normal':     '😐',
  'Desanimado': '😞',
  'Triste':     '😢',
};

const humorColors: Record<HappinessStatus, string> = {
  'Radiante':   'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300',
  'Feliz':      'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  'Normal':     'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
  'Desanimado': 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300',
  'Triste':     'bg-violet-100 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300',
};

// Atividades de lazer disponíveis
// scaledBy: fração do salário que define o custo; happinessGain: ganho base no morale
const LAZER_ATIVIDADES = [
  { id: 'videogame', nome: 'Jogar Videogame',   emoji: '🎮', custoBase: 80,   happinessGain: 18 },
  { id: 'cinema',    nome: 'Ir ao Cinema',       emoji: '🎬', custoBase: 120,  happinessGain: 14 },
  { id: 'restaurante', nome: 'Comer Fora',       emoji: '🍽️', custoBase: 200,  happinessGain: 16 },
  { id: 'academia',  nome: 'Academia / Esporte', emoji: '🏋️', custoBase: 150,  happinessGain: 20 },
  { id: 'livros',    nome: 'Comprar Livros',      emoji: '📚', custoBase: 60,   happinessGain: 12 },
];

// Quanto mais rico, menos ganho proporcional de coisas simples (vazio existencial)
const getHappinessGainScaled = (baseGain: number, salario: number): number => {
  // Escala de 1.0 (salário mínimo) até 0.15 (muito rico)
  const factor = Math.max(0.15, 1 - (salario / 50000) * 0.85);
  return Math.round(baseGain * factor);
};

const HUMOR_MENSAGENS_PIORA: Record<HappinessStatus, string[]> = {
  'Radiante':   [],
  'Feliz':      ['Os dias parecem um pouco mais pesados ultimamente.'],
  'Normal':     ['Você sente que está apenas cumprindo mais uma rotina.', 'O peso da rotina começa a consumir sua mente.'],
  'Desanimado': ['Você sente que está apenas sobrevivendo.', 'A motivação foi embora sem avisar.'],
  'Triste':     ['O vazio tomou conta. Você mal lembra por que começou.', 'Cada mês parece igual ao anterior.'],
};

const HUMOR_MENSAGENS_MELHORA: Record<HappinessStatus, string[]> = {
  'Radiante':   ['Você se sente no topo do mundo!', 'Uma alegria inexplicável tomou conta do seu dia.'],
  'Feliz':      ['Os dias parecem mais leves ultimamente.', 'Você finalmente teve um momento de paz.'],
  'Normal':     ['Você se acalmou um pouco. A vida segue.'],
  'Desanimado': ['Ainda desanimado, mas pelo menos melhorou um pouco.'],
  'Triste':     [],
};

// === SISTEMA DE PRODUTIVIDADE ===
const PRODUTIVIDADE_ORDEM: ProductivityStatus[] = ['Péssima', 'Baixa', 'Normal', 'Alta', 'Excelente'];

const getProdutividadeFromPerformance = (p: number): ProductivityStatus => {
  if (p <= 15) return 'Péssima';
  if (p <= 35) return 'Baixa';
  if (p <= 60) return 'Normal';
  if (p <= 80) return 'Alta';
  return 'Excelente';
};

const produtividadeIcons: Record<ProductivityStatus, string> = {
  'Excelente': '🚀',
  'Alta':      '📈',
  'Normal':    '⚡',
  'Baixa':     '📉',
  'Péssima':   '🐢',
};

const produtividadeColors: Record<ProductivityStatus, string> = {
  'Excelente': 'bg-emerald-500',
  'Alta':      'bg-sky-500',
  'Normal':    'bg-slate-500',
  'Baixa':     'bg-orange-500',
  'Péssima':   'bg-rose-500',
};

// Modificador salarial por produtividade (multiplicador aplicado sobre o salário base)
const PRODUTIVIDADE_SALARY_MOD: Record<ProductivityStatus, number> = {
  'Excelente': 1.05,
  'Alta':      1.02,
  'Normal':    1.00,
  'Baixa':     0.97,
  'Péssima':   0.94,
};

const PRODUTIVIDADE_MENSAGENS_PIORA: Record<ProductivityStatus, string[]> = {
  'Excelente': [],
  'Alta':      ['Seu ritmo de trabalho caiu um pouco este mês.'],
  'Normal':    ['Você sente dificuldade em manter o foco.', 'O cansaço começou a afetar seu trabalho.'],
  'Baixa':     ['Seu desempenho está abaixo do esperado.', 'A rotina está pesando na sua entrega profissional.'],
  'Péssima':   ['Seu chefe está preocupado com sua performance.', 'Você mal consegue cumprir as tarefas básicas do dia.'],
};

const PRODUTIVIDADE_MENSAGENS_MELHORA: Record<ProductivityStatus, string[]> = {
  'Excelente': ['Seu chefe percebeu sua dedicação.', 'Você está no seu melhor momento profissional.'],
  'Alta':      ['Seu desempenho melhorou recentemente.', 'A equipe notou sua evolução.'],
  'Normal':    ['Você voltou ao ritmo normal de trabalho.'],
  'Baixa':     ['Ainda abaixo do ideal, mas pelo menos melhorou.'],
  'Péssima':   [],
};

interface MonthlyReportData {
  mes: number;
  estacao: Season;
  salarioRecebido: number;
  salarioBase: number;
  bonusEvento: number;
  contasAdicionadas: number;
  jurosAplicados: number;
  taxaJuros: number;
  comidaRestante: number;
  lenhaRestante: number;
  vagasNovas: number;
  rendimentoPoupanca: number;
  companyGrossRevenue: number;
  companyOperatingCosts: number;
  companyNetIncome: number;
  operatingCompanies: number;
  companyIncidents: string[];
  saldoFinal: number;
  dividaAcumulada: number;
  eventoIA: {
    descricao: string;
    tipo: string;
    impacto?: string;
  } | null;
  saudeValue: number;
  saudeDelta: number;
  doencaAtiva: DoencaAtiva | null;
  novaDoenca: boolean;
  humor: HappinessStatus;
  humorMudou: boolean;
  humorMensagem: string;
  produtividade: ProductivityStatus;
  produtividadeMudou: boolean;
  produtividadeMensagem: string;
  unlockedMechanics: GameStats['unlockedMechanics'];
}

// Card de saúde: barra 0-100, indicador de doença e tooltip com detalhes
const HealthCard: React.FC<{ value: number; doenca: DoencaAtiva | null }> = ({ value, doenca }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const barColor = getHealthBarColor(value);
  const chanceInfo = getDiseaseChanceInfo(value);
  const categoria = getHealthCategory(value);
  const categoriaColor =
    categoria === 'Excelente' ? 'text-emerald-300' :
    categoria === 'Saudável'  ? 'text-lime-300' :
    categoria === 'Cansado'   ? 'text-yellow-300' :
    categoria === 'Exausto'   ? 'text-orange-300' :
    'text-red-400';

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer ${doenca ? 'animate-pulse' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(p => !p)}
    >
      {doenca && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full ring-2 ring-white dark:ring-slate-900" />
      )}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saúde</p>
        <span className="text-lg leading-none">{doenca ? '🤒' : '❤️'}</span>
      </div>
      <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">{value}/100</p>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>

      {showTooltip && (
        <div className="absolute z-50 top-full mt-2 left-0 w-60 bg-slate-900 text-white text-xs p-4 rounded-xl shadow-2xl border border-slate-700">
          <p className="font-bold mb-1.5">Saúde: {value}/100</p>
          <p className={`${categoriaColor} font-bold`}>Condição: {categoria}</p>
          <p className={chanceInfo.colorClass}>Chance de doença no próximo mês: {chanceInfo.pct}%</p>
          {doenca && (
            <>
              <p className="mt-1.5 text-amber-300 font-bold">Status: {doenca.emoji} {doenca.nome} ativa</p>
              <p className="text-amber-200">Tratamento necessário: R$ {doenca.custo.toFixed(0)}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapMessage, setBootstrapMessage] = useState('Conectando ao servidor...');
  const [bootstrapError, setBootstrapError] = useState(false);
  const [bootstrapRetryKey, setBootstrapRetryKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [deathReason, setDeathReason] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [expandedReportSections, setExpandedReportSections] = useState<Record<'salary' | 'expenses' | 'companies', boolean>>({ salary: false, expenses: false, companies: false });
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [isWoodModalOpen, setIsWoodModalOpen] = useState(false);
  const [isDevModeEnabled, setIsDevModeEnabled] = useState(false);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
  const [isApplyingDevStats, setIsApplyingDevStats] = useState(false);
  const [isPayBillsModalOpen, setIsPayBillsModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyTab, setCompanyTab] = useState<'mine' | 'store'>('store');
  const [isArtifactBoxModalOpen, setIsArtifactBoxModalOpen] = useState(false);
  const [isArtifactIndexOpen, setIsArtifactIndexOpen] = useState(false);
  const [openingArtifactBox, setOpeningArtifactBox] = useState<ArtifactBoxType | null>(null);
  const [autoOpeningBox, setAutoOpeningBox] = useState<ArtifactBoxType | null>(null);
  const openingArtifactBoxRef = useRef(false);
  const autoOpeningRef = useRef(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'titles' | 'artifacts'>('titles');
  const [lastArtifactReward, setLastArtifactReward] = useState<{ id: string; upgraded: boolean } | null>(null);
  const [isAcoesModalOpen, setIsAcoesModalOpen] = useState(false);
  const [acoesTab, setAcoesTab] = useState<'saude' | 'lazer'>('saude');
  const [pendingDisease, setPendingDisease] = useState<DoencaAtiva | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRetirementModalOpen, setIsRetirementModalOpen] = useState(false);
  const [showRetirementConfirm, setShowRetirementConfirm] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [isCursoModalOpen, setIsCursoModalOpen] = useState(false);
  const [cursoConfirmId, setCursoConfirmId] = useState<string | null>(null);
  const [pendingUnlock, setPendingUnlock] = useState<'saude' | 'felicidade' | 'produtividade' | null>(null);
  const [highlightedStats, setHighlightedStats] = useState<string[]>([]);
  const [seasonNotice, setSeasonNotice] = useState<Season | null>(null);
  const [insufficientFundsMsg, setInsufficientFundsMsg] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [investTab, setInvestTab] = useState<'savings' | 'stocks' | 'crypto'>('savings');
  const [isNickModalOpen, setIsNickModalOpen] = useState(true);
  const [nickInput, setNickInput] = useState("");

  // Estados para Entrevista
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [interviewOffer, setInterviewOffer] = useState<JobOffer | null>(null);
  const [interviewCorrectCount, setInterviewCorrectCount] = useState(0);
  const [interviewWrongCount, setInterviewWrongCount] = useState(0);
  const [currentInterviewQuestion, setCurrentInterviewQuestion] = useState<InterviewQuestion | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState<'ongoing' | 'success' | 'failed'>('ongoing');

  const [foodQuantityInput, setFoodQuantityInput] = useState<string>("1");
  const [woodQuantityInput, setWoodQuantityInput] = useState<string>("1");
  const [devSaldoInput, setDevSaldoInput] = useState<string>("");
  const [devComidaInput, setDevComidaInput] = useState<string>("");
  const [devLenhaInput, setDevLenhaInput] = useState<string>("");
  const [devMesInput, setDevMesInput] = useState<string>("");
  const [billPayAmountInput, setBillPayAmountInput] = useState<string>("");
  const [stockTradeQtyInput, setStockTradeQtyInput] = useState<string>("1");
  const [cryptoTradeQtyInput, setCryptoTradeQtyInput] = useState<string>("0.01");

  const [investAmountInput, setInvestAmountInput] = useState<string>("");

  // === Persistência no servidor ===
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [saveSystemMsg, setSaveSystemMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteSaveConfirm, setShowDeleteSaveConfirm] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Carrega o estado autoritativo do backend assim que o jogo abre.
  useEffect(() => {
    let active = true;
    void (async () => {
      setIsBootstrapping(true);
      setBootstrapError(false);
      setBootstrapMessage('Conectando ao servidor...');

      const serverReady = await waitForServer(attempt => {
        if (active && attempt > 1) {
          setBootstrapMessage('Iniciando o servidor, aguarde alguns segundos...');
        }
      });
      if (!active) return;
      if (!serverReady) {
        setBootstrapError(true);
        setBootstrapMessage('O servidor demorou mais que o esperado para iniciar.');
        return;
      }

      const hadStoredGame = hasToken();
      const saved = await loadServerGame();
      if (!active) return;
      if (saved) {
        setStats(saved.stats);
        setEvents(saved.events);
        setGameOver(saved.stats.gameOver);
        setDeathReason(saved.stats.deathReason);
        setLastSavedAt(Date.now());
        setIsNickModalOpen(false);
      } else if (hadStoredGame && hasToken()) {
        setBootstrapError(true);
        setBootstrapMessage('Não foi possível carregar seu jogo. Seu progresso continua salvo; tente novamente.');
        return;
      }
      setIsBootstrapping(false);
    })();
    return () => { active = false; };
  }, [bootstrapRetryKey]);

  const applyServerResult = useCallback((result: DispatchResult): boolean => {
    if (!result.ok || !result.stats || !result.events) {
      setSaveSystemMsg({ text: result.error || 'Não foi possível concluir a ação.', type: 'error' });
      setTimeout(() => setSaveSystemMsg(null), 3500);
      return false;
    }

    setStats(result.stats);
    setEvents(result.events);
    setGameOver(result.stats.gameOver || result.flags?.gameOver === true);
    setDeathReason(result.stats.deathReason || result.flags?.deathReason || '');
    setLastSavedAt(Date.now());
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 1800);

    if (result.flags?.mechUnlocked) setPendingUnlock(result.flags.mechUnlocked);
    if (result.flags?.novaDoenca && result.stats.doencaAtiva) setPendingDisease(result.stats.doencaAtiva);
    if (result.flags?.seasonNotice) setSeasonNotice(result.flags.seasonNotice);
    return true;
  }, []);

  const runServerAction = useCallback(async (action: GameAction): Promise<DispatchResult> => {
    const result = await dispatchGameAction(action);
    applyServerResult(result);
    return result;
  }, [applyServerResult]);

  const handleManualSave = async () => {
    const result = await saveServerGame();
    if (applyServerResult(result)) {
      setSaveSystemMsg({ text: 'Jogo salvo com sucesso!', type: 'success' });
      setTimeout(() => setSaveSystemMsg(null), 3000);
    }
  };

  const handleOpenLeaderboard = async () => {
    setIsStatusModalOpen(false);
    setIsLeaderboardOpen(true);
    setIsLoadingLeaderboard(true);
    setLeaderboardError(null);

    const result = await loadLeaderboard();
    if (result.ok && result.leaderboard) {
      setLeaderboard(result.leaderboard);
      const refreshed = await loadServerGame();
      if (refreshed) {
        setStats(refreshed.stats);
        setEvents(refreshed.events);
      }
    } else {
      setLeaderboardError(result.error || 'Não foi possível carregar o ranking agora.');
    }
    setIsLoadingLeaderboard(false);
  };

  const handleDeleteSave = async () => {
    const result = await deleteServerSave();
    if (!result.ok) {
      setSaveSystemMsg({ text: result.error || 'Não foi possível apagar o save.', type: 'error' });
      setTimeout(() => setSaveSystemMsg(null), 3500);
      return;
    }
    setShowDeleteSaveConfirm(false);
    setIsSaveModalOpen(false);
    resetLocalUi();
  };

  const currentInterestRate = useMemo(() => {
    if (stats.mesesEmAtraso < 5) return 0;
    return 10 + (stats.mesesEmAtraso - 5) * 7;
  }, [stats.mesesEmAtraso]);

  const artifactEffects = useMemo(
    () => getArtifactEffects(stats),
    [stats.equippedArtifacts, stats.artifactLevels],
  );

  const getDiscountedUiPrice = useCallback(
    (price: number) => Math.max(0, Math.floor(price * (1 - artifactEffects.allPricesDiscount))),
    [artifactEffects.allPricesDiscount],
  );

  const getLifestyleUiPrice = useCallback((basePrice: number) => {
    const wealthSurcharge = Math.min(1_000_000, Math.floor(Math.max(0, stats.saldo - 100_000) * 0.0025));
    return getDiscountedUiPrice(basePrice + wealthSurcharge);
  }, [stats.saldo, getDiscountedUiPrice]);

  const getCurrentFoodPrice = useCallback(() => {
    let price = getSeason(stats.mes) === 'Outono' ? BASE_FOOD_PRICE / 1.5 : BASE_FOOD_PRICE;
    if (currentInterestRate >= 24) price *= 2.0;
    else if (currentInterestRate >= 17) price *= 1.4;
    price *= (1 - Math.min(0.75, stats.cursoBenefits.foodDiscount));
    return getDiscountedUiPrice(price);
  }, [stats.mes, currentInterestRate, stats.cursoBenefits.foodDiscount, getDiscountedUiPrice]);

  const currentWoodPrice = getDiscountedUiPrice(WOOD_PRICE);

  const getSeason = (mes: number): Season => {
    const cycle = ((mes - 1) % 12) + 1;
    if (cycle <= 3) return 'Primavera';
    if (cycle <= 6) return 'Verão';
    if (cycle <= 9) return 'Outono';
    return 'Inverno';
  };

  const currentSeason = getSeason(stats.mes);

  const calculatePatrimony = useCallback(() => {
    return (Object.entries(stats.portfolio) as [string, AssetPosition][]).reduce((acc, [symbol, position]) => {
      let asset = stats.stocks.find(s => s.symbol === symbol);
      if (!asset) asset = stats.cryptos.find(c => c.symbol === symbol);
      return acc + (position.quantity * (asset?.price || 0));
    }, 0);
  }, [stats.portfolio, stats.stocks, stats.cryptos]);

  const checkGameOver = useCallback(() => {
    if (stats.comida <= 0) {
      setDeathReason("FOME: Seu estoque de comida acabou. Sem energia para trabalhar, sua jornada terminou.");
      setGameOver(true);
    } else if (currentInterestRate >= 80) {
      setDeathReason("COLAPSO FINANCEIRO: Seus juros atingiram 80%. O sistema bancário tomou seus bens e encerrou sua cidadania.");
      setGameOver(true);
    }
  }, [stats.comida, currentInterestRate]);

  useEffect(() => {
    checkGameOver();
  }, [stats, checkGameOver]);

  const handlePassMonth = async () => {
    if (isProcessing || gameOver) return;
    setIsProcessing(true);

    const previous = stats;
    const previousEventsCount = events.length;
    const result = await dispatchGameAction({ type: 'PASS_MONTH' });
    const synced = applyServerResult(result);

    if (synced && result.stats && result.events) {
      const next = result.stats;
      const rate = previous.mesesEmAtraso < 5 ? 0 : 10 + (previous.mesesEmAtraso - 5) * 7;
      let salaryPenalty = 1;
      if (rate >= 45) salaryPenalty = 0.60;
      else if (rate >= 31) salaryPenalty = 0.80;
      let salaryBase = Math.floor(previous.salario * salaryPenalty);
      if (getSeason(previous.mes) === 'Verão') salaryBase = Math.floor(salaryBase * 0.7);
      salaryBase = Math.floor(salaryBase * (1 + previous.roomUpgrades.escritorio * 0.05));
      if (previous.unlockedMechanics.produtividade) {
        salaryBase = Math.floor(salaryBase * PRODUTIVIDADE_SALARY_MOD[previous.produtividade]);
      }
      salaryBase = Math.floor(salaryBase * getRetirementSalaryMultiplier(previous.retirementCount ?? 0));
      salaryBase = Math.floor(salaryBase * (1 + getArtifactEffects(previous).salaryBonus));
      const rendimento = next.poupanca - previous.poupanca;
      const companyNetIncome = result.flags?.companyNetIncome ?? 0;
      const bonusEvento = result.flags?.monthlyEventBalanceChange ?? 0;
      const jurosAplicados = rate > 0 ? Math.floor(previous.contas * (rate / 100)) : 0;
      const contasAdicionadas = Math.max(0, next.contasEmAtraso - previous.contasEmAtraso - jurosAplicados);
      const newEvents = result.events.slice(previousEventsCount);
      const monthlyEvent = [...newEvents].reverse().find(event =>
        event.type !== 'career' && !event.message.startsWith('🏆')
      );
      const vagasNovas = Math.max(0,
        next.emails.filter(email => email.jobOffer).length - previous.emails.filter(email => email.jobOffer).length
      );

      setReportData({
        mes: previous.mes,
        estacao: getSeason(previous.mes),
        salarioRecebido: salaryBase + bonusEvento,
        salarioBase: salaryBase,
        bonusEvento,
        contasAdicionadas,
        jurosAplicados,
        taxaJuros: rate,
        comidaRestante: next.comida,
        lenhaRestante: next.lenha,
        vagasNovas,
        rendimentoPoupanca: rendimento,
        companyGrossRevenue: result.flags?.companyGrossRevenue ?? 0,
        companyOperatingCosts: result.flags?.companyOperatingCosts ?? 0,
        companyNetIncome,
        operatingCompanies: result.flags?.operatingCompanies ?? 0,
        companyIncidents: result.flags?.companyIncidents ?? [],
        saldoFinal: next.saldo,
        dividaAcumulada: next.contasEmAtraso,
        eventoIA: {
          descricao: monthlyEvent?.message || 'Mais um mês de rotina CLT.',
          tipo: monthlyEvent?.type || 'neutral',
        },
        saudeValue: next.saudeValue,
        saudeDelta: next.saudeValue - previous.saudeValue,
        doencaAtiva: next.doencaAtiva,
        novaDoenca: !!result.flags?.novaDoenca,
        humor: next.humor,
        humorMudou: next.humor !== previous.humor,
        humorMensagem: '',
        produtividade: next.produtividade,
        produtividadeMudou: next.produtividade !== previous.produtividade,
        produtividadeMensagem: '',
        unlockedMechanics: next.unlockedMechanics,
      });
      setExpandedReportSections({ salary: false, expenses: false, companies: false });
      setShowReport(true);
    }

    setIsProcessing(false);
  };

  const buyAsset = async (symbol: string, type: 'stock' | 'crypto') => {
    const qty = parseFloat(type === 'stock' ? stockTradeQtyInput : cryptoTradeQtyInput);
    if (isNaN(qty) || qty <= 0) return;
    await runServerAction({ type: 'BUY_ASSET', symbol, qty, assetType: type });
  };

  const sellAsset = async (symbol: string, type: 'stock' | 'crypto') => {
    const qty = parseFloat(type === 'stock' ? stockTradeQtyInput : cryptoTradeQtyInput);
    if (isNaN(qty) || qty <= 0) return;
    await runServerAction({ type: 'SELL_ASSET', symbol, qty, assetType: type });
  };

  const getNextDegree = () => stats.nivelCurriculo < GRAUS_ACADEMICOS.length - 1 ? GRAUS_ACADEMICOS[stats.nivelCurriculo + 1] : null;

  const showInsufficientFunds = (needed: number) => {
    setInsufficientFundsMsg(`Saldo insuficiente! Você precisa de R$ ${needed.toFixed(0)}, mas tem apenas R$ ${stats.saldo.toFixed(0)}.`);
    setTimeout(() => setInsufficientFundsMsg(null), 3500);
  };

  const handleSelectCurso = async (id: string) => {
    if (stats.cursoAtivo && stats.cursoAtivo.id !== id) {
      setCursoConfirmId(id);
      return;
    }
    const result = await runServerAction({ type: 'SELECT_COURSE', courseId: id });
    if (result.ok) setIsCursoModalOpen(false);
  };

  const handleConfirmTrocarCurso = async () => {
    if (!cursoConfirmId) return;
    const result = await runServerAction({ type: 'CONFIRM_SWAP_COURSE', courseId: cursoConfirmId });
    if (result.ok) {
      setIsCursoModalOpen(false);
      setCursoConfirmId(null);
    }
  };

  const handlePayPartialBills = async () => {
    const amount = parseFloat(billPayAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    const result = await runServerAction({ type: 'PAY_BILLS', amount });
    if (result.ok) {
      setIsPayBillsModalOpen(false);
      setBillPayAmountInput("");
    }
  };

  const handleInvestment = async (type: 'deposit' | 'withdraw') => {
    const amount = parseFloat(investAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    if (type === 'deposit' && stats.poupanca + amount > MAX_SAVINGS) return;
    const action: GameAction = type === 'deposit'
      ? { type: 'INVEST_DEPOSIT', amount }
      : { type: 'INVEST_WITHDRAW', amount };
    const result = await runServerAction(action);
    if (result.ok) setInvestAmountInput("");
  };

  const resetLocalUi = () => {
    setStats(INITIAL_STATS);
    setEvents([]);
    setGameOver(false);
    setShowReport(false);
    setPendingUnlock(null);
    setPendingDisease(null);
    setSeasonNotice(null);
    setHighlightedStats([]);
    setIsInterviewOpen(false);
    setInterviewOffer(null);
    setCurrentInterviewQuestion(null);
    setInterviewStatus('ongoing');
    setLastSavedAt(null);
    setInventoryTab('titles');
    setLastArtifactReward(null);
    setIsDevModeEnabled(false);
    setIsDevPanelOpen(false);
    setIsNickModalOpen(true);
  };

  const handleReset = async () => {
    const result = await deleteServerSave();
    if (!result.ok) {
      setSaveSystemMsg({ text: result.error || 'Não foi possível reiniciar agora.', type: 'error' });
      setTimeout(() => setSaveSystemMsg(null), 3500);
      return;
    }
    resetLocalUi();
  };

  const handleEmailClick = async (emailId: string) => {
    setSelectedEmailId(emailId);
    await runServerAction({ type: 'READ_EMAIL', emailId });
  };

  const handleDeleteEmail = async (emailId: string) => {
    const result = await runServerAction({ type: 'DELETE_EMAIL', emailId });
    if (result.ok && selectedEmailId === emailId) setSelectedEmailId(null);
  };

  // Funções de Entrevista
  const handleAcceptJobClick = (offer: JobOffer) => {
    setInterviewOffer(offer);
    setInterviewCorrectCount(0);
    setInterviewWrongCount(0);
    setInterviewStatus('ongoing');
    setIsInterviewOpen(true);
    setIsEmailModalOpen(false);
    resetInterviewSession();
    loadInterviewQuestion(offer);
  };

  const loadInterviewQuestion = (offer: JobOffer) => {
    const question = getInterviewQuestion(stats.nivelCurriculo);
    setCurrentInterviewQuestion(question);
    setIsGeneratingQuestion(false);
  };

  const handleInterviewAnswer = (index: number) => {
    if (!currentInterviewQuestion || !interviewOffer || interviewStatus !== 'ongoing') return;

    if (index === currentInterviewQuestion.correctIndex) {
      const nextCorrect = interviewCorrectCount + 1;
      setInterviewCorrectCount(nextCorrect);
      if (nextCorrect >= 5) {
        setInterviewStatus('success');
      } else {
        loadInterviewQuestion(interviewOffer);
      }
    } else {
      const nextWrong = interviewWrongCount + 1;
      setInterviewWrongCount(nextWrong);
      if (nextWrong >= 3) {
        setInterviewStatus('failed');
      } else {
        loadInterviewQuestion(interviewOffer);
      }
    }
  };

  const finalizeInterview = async () => {
    if (!interviewOffer) return;

    if (interviewStatus === 'success') {
      await runServerAction({
        type: 'ACCEPT_JOB',
        offerId: interviewOffer.id,
        perfectInterview: interviewWrongCount === 0,
      });
    } else if (interviewStatus === 'failed') {
      const email = stats.emails.find(item => item.jobOffer?.id === interviewOffer.id);
      if (email) await runServerAction({ type: 'DELETE_EMAIL', emailId: email.id });
    }

    setIsInterviewOpen(false);
    setInterviewOffer(null);
    setCurrentInterviewQuestion(null);
    setInterviewStatus('ongoing');
  };

  const handleSetNick = async () => {
    const val = nickInput.trim();
    const regex = /^[a-zA-Z0-9]{4,15}$/;
    const isBanned = BANNED_NAMES.some(banned => val.toLowerCase().includes(banned.toLowerCase()));

    if (regex.test(val) && !isBanned) {
      const result = await initServerGame(val);
      if (applyServerResult(result)) setIsNickModalOpen(false);
    }
  };

  const handleLazer = async (atividadeId: string) => {
    const atividade = LAZER_ATIVIDADES.find(a => a.id === atividadeId);
    if (!atividade) return;

    const price = getLifestyleUiPrice(atividade.custoBase);
    if (stats.saldo < price) {
      showInsufficientFunds(price);
      return;
    }

    await runServerAction({ type: 'LEISURE', activityId: atividadeId });
  };

  const handleAcaoSaude = async (acaoId: string) => {
    const acao = ACOES_SAUDE.find(a => a.id === acaoId);
    if (!acao) return;

    const price = getLifestyleUiPrice(acao.custo);
    if (stats.saldo < price) {
      showInsufficientFunds(price);
      return;
    }

    await runServerAction({ type: 'HEALTH_ACTION', actionId: acaoId });
  };

  const handleComprarRemedio = async () => {
    const doenca = stats.doencaAtiva;
    if (!doenca) return;

    const price = getLifestyleUiPrice(doenca.custo);
    if (stats.saldo < price) {
      showInsufficientFunds(price);
      return;
    }

    const result = await runServerAction({ type: 'PAY_DISEASE' });
    if (result.ok) setPendingDisease(null);
  };

  const fillDevInputs = (source: GameStats = stats) => {
    setDevSaldoInput(String(source.saldo));
    setDevComidaInput(String(source.comida));
    setDevLenhaInput(String(source.lenha));
    setDevMesInput(String(source.mes));
  };

  const activateDevMode = async () => {
    setFoodQuantityInput("1");
    setIsFoodModalOpen(false);

    const result = await runServerAction({
      type: 'DEV_SET_STATS',
      saldo: stats.saldo,
      comida: stats.comida,
      lenha: stats.lenha,
      mes: stats.mes,
    });

    if (result.ok && result.stats) {
      setIsDevModeEnabled(true);
      fillDevInputs(result.stats);
      setIsDevPanelOpen(true);
      setSaveSystemMsg({ text: 'Modo de desenvolvimento ativado. Esta partida não participa do ranking.', type: 'success' });
      setTimeout(() => setSaveSystemMsg(null), 3500);
    }
  };

  const handleFoodQuantityChange = (value: string) => {
    if (value.trim() === 'DevModeOn') {
      void activateDevMode();
      return;
    }
    setFoodQuantityInput(value);
  };

  const openDevPanel = () => {
    fillDevInputs();
    setIsDevPanelOpen(true);
  };

  const handleApplyDevStats = async () => {
    const saldo = Number(devSaldoInput.replace(',', '.'));
    const comida = Number(devComidaInput);
    const lenha = Number(devLenhaInput);
    const mes = Number(devMesInput);

    if (!Number.isFinite(saldo) || !Number.isInteger(comida) || !Number.isInteger(lenha) || !Number.isInteger(mes)) {
      setSaveSystemMsg({ text: 'Preencha os campos DEV com valores válidos.', type: 'error' });
      setTimeout(() => setSaveSystemMsg(null), 3500);
      return;
    }

    setIsApplyingDevStats(true);
    try {
      const result = await runServerAction({ type: 'DEV_SET_STATS', saldo, comida, lenha, mes });
      if (result.ok) {
        setIsDevPanelOpen(false);
        setSaveSystemMsg({ text: 'Dados DEV aplicados e salvos.', type: 'success' });
        setTimeout(() => setSaveSystemMsg(null), 3000);
      }
    } finally {
      setIsApplyingDevStats(false);
    }
  };

  const handleBuyFood = async () => {
    const qty = parseInt(foodQuantityInput, 10);
    if (!Number.isInteger(qty) || qty <= 0) return;
    const result = await runServerAction({ type: 'BUY_FOOD', qty });
    if (result.ok) setIsFoodModalOpen(false);
  };

  const handleBuyWood = async () => {
    const qty = parseInt(woodQuantityInput, 10);
    if (!Number.isInteger(qty) || qty <= 0) return;
    const result = await runServerAction({ type: 'BUY_WOOD', qty });
    if (result.ok) setIsWoodModalOpen(false);
  };

  const handleStudyDegree = async () => {
    await runServerAction({ type: 'STUDY_DEGREE' });
  };

  const handleStudyCourse = async () => {
    await runServerAction({ type: 'STUDY_COURSE' });
  };

  const handleEquipTitle = async (titleId: string, isEquipped: boolean) => {
    await runServerAction({ type: 'EQUIP_TITLE', titleId: isEquipped ? '' : titleId });
  };

  const handleBuyAndOpenArtifactBox = async (boxType: ArtifactBoxType): Promise<boolean> => {
    if (openingArtifactBoxRef.current) return false;
    openingArtifactBoxRef.current = true;
    setLastArtifactReward(null);
    setOpeningArtifactBox(boxType);
    await new Promise(resolve => setTimeout(resolve, 850));
    const result = await runServerAction({ type: 'BUY_AND_OPEN_ARTIFACT_BOX', boxType });
    if (result.ok && result.flags?.artifactAwardedId) {
      setLastArtifactReward({ id: result.flags.artifactAwardedId, upgraded: result.flags.artifactWasUpgrade === true });
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
    setOpeningArtifactBox(null);
    openingArtifactBoxRef.current = false;
    return result.ok;
  };

  const stopAutoOpening = () => {
    autoOpeningRef.current = false;
    setAutoOpeningBox(null);
  };

  const handleAutoOpenArtifactBox = async (boxType: ArtifactBoxType) => {
    if (autoOpeningRef.current) {
      stopAutoOpening();
      return;
    }
    autoOpeningRef.current = true;
    setAutoOpeningBox(boxType);
    while (autoOpeningRef.current) {
      const opened = await handleBuyAndOpenArtifactBox(boxType);
      if (!opened) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    stopAutoOpening();
  };

  const handleToggleArtifact = async (artifactId: string) => {
    await runServerAction({ type: 'TOGGLE_ARTIFACT', artifactId });
  };

  const handleRetire = async () => {
    const requirement = getRetirementRequirement(stats.retirementCount ?? 0);
    if (isRetiring || stats.retirementCount >= 10 || stats.saldo < requirement) return;

    setIsRetiring(true);
    const result = await runServerAction({ type: 'RETIRE' });
    if (result.ok) {
      setIsRetirementModalOpen(false);
      setShowRetirementConfirm(false);
      setIsStatusModalOpen(false);
      setShowReport(false);
      setReportData(null);
      setPendingUnlock(null);
      setPendingDisease(null);
      setSeasonNotice(null);
      setHighlightedStats([]);
      setSelectedEmailId(null);
      setCompanyTab('store');
    }
    setIsRetiring(false);
  };

  const handleBuyCompany = async (companyId: string) => {
    const result = await runServerAction({ type: 'BUY_COMPANY', companyId });
    if (result.ok) setCompanyTab('mine');
  };

  const handleUpgradeCompany = async (companyId: string) => {
    await runServerAction({ type: 'UPGRADE_COMPANY', companyId });
  };

  const handleSetCompanyStrategy = async (companyId: string, strategy: CompanyStrategy) => {
    await runServerAction({ type: 'SET_COMPANY_STRATEGY', companyId, strategy });
  };

  const handleHireEmployees = async (companyId: string, qty: number) => {
    if (qty < 1) return;
    await runServerAction({ type: 'HIRE_EMPLOYEES', companyId, qty });
  };

  const unreadEmailsCount = stats.emails.filter(e => !e.read).length;
  const selectedEmail = stats.emails.find(e => e.id === selectedEmailId);

  const UniversalCloseButton = ({ onClick }: { onClick: () => void }) => (
    <button 
      onClick={onClick} 
      className="absolute top-6 right-6 w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 transition-all z-50 shadow-lg"
    >
      ✕
    </button>
  );

  const isInvestLocked = !(stats.cursosCompletos ?? []).includes('financas');
  const retirementCount = stats.retirementCount ?? 0;
  const retirementRequirement = getRetirementRequirement(retirementCount);
  const retirementSalaryMultiplier = getRetirementSalaryMultiplier(retirementCount);
  const retirementCompanyMultiplier = getRetirementCompanyMultiplier(retirementCount);
  const retirementProgress = Math.min(100, (stats.saldo / retirementRequirement) * 100);
  const canRetire = retirementCount < 10 && stats.saldo >= retirementRequirement;
  const companyPortfolioValue = calculatePatrimony();
  const totalWealth = stats.saldo + stats.poupanca + companyPortfolioValue;
  const isCompanyUnlocked = retirementCount >= 1;
  const artifactsUnlocked = retirementCount >= 1;
  const totalArtifactBoxes = Object.values(stats.artifactBoxes ?? {}).reduce((total, amount) => total + Number(amount || 0), 0);
  const operatingCompanyCount = stats.companies.filter(owned => {
    const definition = COMPANY_DEFINITIONS.find(company => company.id === owned.id);
    return !!definition && owned.employees >= getCompanyRequiredEmployees(definition, owned.level);
  }).length;
  const conglomerateRevenueBonus = Math.min(0.20, artifactEffects.conglomerateRevenuePerCompany * operatingCompanyCount);
  const companySummary = stats.companies.reduce((summary, owned) => {
    const definition = COMPANY_DEFINITIONS.find(company => company.id === owned.id);
    if (!definition) return summary;
    const requiredEmployees = getCompanyRequiredEmployees(definition, owned.level);
    const gross = owned.employees >= requiredEmployees
      ? Math.floor(getCompanyProjectedGrossRevenue(definition, owned.level, owned.strategy, stats.produtividade, stats.unlockedMechanics.produtividade) * retirementCompanyMultiplier * (1 + artifactEffects.companyRevenueBonus + conglomerateRevenueBonus))
      : 0;
    const costs = Math.floor(getCompanyMaintenance(definition, owned.level) * (1 - artifactEffects.companyMaintenanceDiscount) * (1 - artifactEffects.companyOperatingCostDiscount)) + Math.floor(owned.employees * definition.salaryPerEmployee * (1 - artifactEffects.companyOperatingCostDiscount));
    summary.gross += gross;
    summary.costs += costs;
    if (gross > 0) summary.operating += 1;
    return summary;
  }, { gross: 0, costs: 0, operating: 0 });
  const equippedTitleName = TITLES_LIST.find(title => title.id === stats.equippedTitle)?.name ?? stats.equippedTitle;

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center px-6 max-w-md">
          <div className={`text-5xl mb-4 ${bootstrapError ? '' : 'animate-bounce'}`}>{bootstrapError ? '⚠️' : '🏢'}</div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-200">{bootstrapMessage}</p>
          {bootstrapError && (
            <button
              onClick={() => setBootstrapRetryKey(current => current + 1)}
              className="mt-6 px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans">
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <h1 className="text-4xl font-poppins font-bold italic tracking-wide text-primary dark:text-primary uppercase leading-none">Vida de CLT</h1>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:scale-110 transition-transform shrink-0"
                  title="Trocar Tema"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button 
                  onClick={() => setIsSaveModalOpen(true)} 
                  className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:scale-110 transition-transform shrink-0"
                  title="Salvamento"
                >
                  💾
                </button>
                <div className={`px-4 py-2 rounded-xl border text-[10px] font-bold shadow-sm uppercase tracking-widest flex items-center shrink-0 ${seasonColors[currentSeason]}`}>
                  <span className="mr-2 text-lg">{seasonIcons[currentSeason]}</span>
                  {currentSeason}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showSaveIndicator && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
                  ✓ Salvo
                </span>
              )}
              <span className="bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl">Mês {stats.mes}</span>
            </div>
          </div>

          {stats.playerNick && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold text-slate-500 dark:text-white leading-none tracking-tight">
                {stats.playerNick}
              </span>
              {stats.equippedTitle && (
                <span className={`text-3xl ${getTitleStyle(equippedTitleName)}`}>
                  ({equippedTitleName})
                </span>
              )}
            </div>
          )}
        </header>

        {/* Linha 1: cards sempre visíveis */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
          <StatCard label="Saldo" value={`R$ ${stats.saldo.toFixed(0)}`} icon="💰" color="bg-emerald-500" />
          <StatCard label="Salário" value={`R$ ${Math.floor(stats.salario * (1 + (stats.roomUpgrades?.escritorio ?? 0) * 0.05) * retirementSalaryMultiplier).toLocaleString('pt-BR')}`} icon="💼" color="bg-primary" />
          <div className={stats.comida <= 3 ? 'animate-pulse' : ''}>
            <StatCard label="Comida" value={`${stats.comida}`} icon="🍞" color="bg-emerald-500" />
          </div>
          <div className={(stats.lenha <= 3 && stats.mes >= 10) ? 'animate-pulse' : ''}>
            <StatCard label="Lenha" value={`${stats.lenha}`} icon="🪵" color="bg-primary" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <StatCard label="Dívidas" value={`R$ ${stats.contasEmAtraso.toFixed(0)}`} icon="🧾" color="bg-rose-500"
              subLabel={`Juros: ${currentInterestRate.toFixed(1)}%`} />
          </div>
        </section>

        {/* Linha 2: mecânicas desbloqueadas ao longo do tempo */}
        {(stats.unlockedMechanics?.saude || stats.unlockedMechanics?.felicidade || stats.unlockedMechanics?.produtividade) && (() => {
          const hl = (key: string) => highlightedStats.includes(key) ? 'ring-2 ring-offset-2 ring-primary rounded-xl animate-pulse' : '';
          const count = (stats.unlockedMechanics?.saude ? 1 : 0) + (stats.unlockedMechanics?.felicidade ? 1 : 0) + (stats.unlockedMechanics?.produtividade ? 1 : 0);
          const cols = count === 1 ? 'grid-cols-1 md:grid-cols-3' : count === 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3';
          return (
            <section className={`grid ${cols} gap-4 mb-8`}>
              {stats.unlockedMechanics?.saude && (
                <div className={hl('saude')}><HealthCard value={stats.saudeValue} doenca={stats.doencaAtiva} /></div>
              )}
              {stats.unlockedMechanics?.felicidade && (
                <div className={hl('felicidade')}><StatCard label="Humor" value={stats.humor} icon={humorIcons[stats.humor]} color="bg-violet-500" /></div>
              )}
              {stats.unlockedMechanics?.produtividade && (
                <div className={`${hl('produtividade')} ${count === 3 ? 'col-span-2 md:col-span-1' : ''}`}><StatCard label="Produtividade" value={stats.produtividade} icon={produtividadeIcons[stats.produtividade]} color={produtividadeColors[stats.produtividade]} /></div>
              )}
            </section>
          );
        })()}
        {!(stats.unlockedMechanics?.saude || stats.unlockedMechanics?.felicidade || stats.unlockedMechanics?.produtividade) && <div className="mb-8" />}

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Decisões CLT</h2>
                <div className="flex flex-wrap gap-2 gap-y-3 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsEmailModalOpen(true)} 
                    className={`relative flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase shadow-xl tracking-widest transition-all hover:scale-105 active:scale-95`}
                  >
                    📧 Email
                    {unreadEmailsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] font-bold px-2 py-1 rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
                        {unreadEmailsCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsInventoryModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase shadow-lg tracking-widest transition-all hover:scale-105 active:scale-95"
                  >
                    🎒 Coleção
                  </button>

                  <button
                    onClick={() => setIsStatusModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase shadow-lg tracking-widest transition-all hover:scale-105 active:scale-95"
                  >
                    📊 Status
                  </button>

                  {stats.unlockedMechanics.saude && (
                  <button
                    onClick={() => setIsAcoesModalOpen(true)}
                    className={`flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-white text-slate-800 border-2 border-slate-200 rounded-xl text-[10px] font-bold uppercase shadow-lg tracking-widest transition-all hover:scale-105 hover:border-primary active:scale-95 ${stats.doencaAtiva ? 'ring-2 ring-yellow-400 ring-offset-1' : ''} ${highlightedStats.includes('saude') ? 'ring-2 ring-emerald-400 ring-offset-1 animate-pulse' : ''}`}
                  >
                    ⚙️ Ações
                  </button>
                  )}
                  
                  <div className="relative group flex-1 sm:flex-none">
                    <button 
                      onClick={() => !isInvestLocked && setIsInvestModalOpen(true)} 
                      className={`w-full px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-[10px] font-bold uppercase shadow-lg tracking-widest transition-all bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 active:scale-95 ${isInvestLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      {isInvestLocked ? '🔒 Investir' : '💰 Investir'}
                    </button>
                    {isInvestLocked && (
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block group-active:block bg-slate-900 dark:bg-slate-800 text-white text-xs p-5 rounded-xl w-64 z-50 pointer-events-none shadow-2xl border border-slate-700 transition-all text-center">
                        <span className="text-yellow-400 font-black">🔒 Conclua o curso de Finanças</span><br/>
                        para desbloquear os Investimentos
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={handlePassMonth} disabled={isProcessing || gameOver} className={`group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-primary/5 dark:border-primary/20 bg-primary/5 dark:bg-primary/10 hover:border-primary transition-all ${stats.mes === 1 && stats.playerNick ? 'animate-pulse ring-4 ring-primary/30 shadow-xl shadow-primary/20' : ''}`}>
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-5 shadow-2xl group-hover:scale-110 transition-transform">
                    {isProcessing ? <span className="animate-spin text-3xl">⏳</span> : <span className="text-3xl">🏢</span>}
                  </div>
                  <span className="font-bold text-lg uppercase tracking-tight text-slate-800 dark:text-slate-100">Próximo Mês</span>
                  <p className="text-[10px] mt-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Trabalhar e Receber</p>
                </button>

                <button onClick={() => setIsPayBillsModalOpen(true)} disabled={gameOver || stats.contasEmAtraso <= 0} className={`group flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all ${stats.contasEmAtraso > 0 ? 'border-red-100 dark:border-red-900/50 bg-red-50/20 dark:bg-red-900/10 hover:border-red-500 text-red-700 dark:text-red-400 shadow-sm' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 opacity-60'}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-xl transition-transform group-hover:scale-110 ${stats.contasEmAtraso > 0 ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <span className="text-3xl">🧾</span>
                  </div>
                  <span className="font-bold text-lg uppercase tracking-tight">Pagar Boletos</span>
                </button>

                <button onClick={() => setIsFoodModalOpen(true)} className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-emerald-50 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-primary/10 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 transition-all shadow-sm">
                  <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl flex items-center justify-center mb-5 shadow-xl text-3xl group-hover:scale-110 transition-transform">🛒</div>
                  <span className="font-bold text-lg uppercase tracking-tight">Comprar comida</span>
                  <p className="text-[10px] mt-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">R$ {getCurrentFoodPrice().toFixed(0)}</p>
                </button>

                <button onClick={() => setIsWoodModalOpen(true)} className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-primary/5 dark:border-primary/20 bg-primary/5 dark:bg-primary/10 hover:border-primary text-primary dark:text-primary transition-all shadow-sm">
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-5 shadow-xl text-3xl group-hover:scale-110 transition-transform">🪵</div>
                  <span className="font-bold text-lg uppercase tracking-tight">Comprar Lenha</span>
                  <p className="text-[10px] mt-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-primary">R$ {currentWoodPrice.toFixed(0)}</p>
                </button>

                {artifactsUnlocked && <>
                <button
                  onClick={() => {
                    if (!isCompanyUnlocked) return;
                    setCompanyTab(stats.companies.length > 0 ? 'mine' : 'store');
                    setIsCompanyModalOpen(true);
                  }}
                  disabled={!isCompanyUnlocked}
                  className={`group flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all shadow-sm ${isCompanyUnlocked ? 'border-amber-100 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 hover:border-amber-500 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-55 cursor-not-allowed'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-xl text-3xl transition-transform group-hover:scale-110 ${isCompanyUnlocked ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white' : 'bg-slate-200 dark:bg-slate-800 grayscale'}`}>{isCompanyUnlocked ? '🏢' : '🔒'}</div>
                  <span className="font-bold text-lg uppercase tracking-tight">Empresas</span>
                  <p className="text-[10px] mt-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{stats.companies.length} adquirida{stats.companies.length !== 1 ? 's' : ''}</p>
                </button>

                <button
                  onClick={() => setIsArtifactBoxModalOpen(true)}
                  className={`group relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all shadow-sm ${artifactsUnlocked ? 'border-violet-100 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-900/10 hover:border-violet-500 text-violet-700 dark:text-violet-300' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500'}`}
                >
                  {totalArtifactBoxes > 0 && <span className="absolute right-5 top-5 rounded-full bg-amber-400 px-2.5 py-1 text-[9px] font-black text-slate-950 shadow-lg">{totalArtifactBoxes}</span>}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-xl text-3xl transition-transform group-hover:scale-110 ${artifactsUnlocked ? 'bg-gradient-to-br from-violet-500 to-fuchsia-700 text-white' : 'bg-slate-200 dark:bg-slate-800 grayscale'}`}>{artifactsUnlocked ? '📦' : '🔒'}</div>
                  <span className="font-bold text-lg uppercase tracking-tight">Comprar Caixas</span>
                  <p className="text-[10px] mt-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{artifactsUnlocked ? 'Artefatos e raridades' : 'Libera após a 1ª aposentadoria'}</p>
                </button>
                </>}
              </div>

              <div className="mt-10 space-y-3">
                {/* Botão Estudar Graduação */}
                {(getNextDegree() || !getNextDegree()) && (
                <button 
                  onClick={handleStudyDegree}
                  disabled={gameOver || !getNextDegree() || currentInterestRate >= 59}
                  className={`group w-full flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${getNextDegree() && currentInterestRate < 59 ? 'border-amber-100 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-900/10 hover:border-amber-500 text-amber-700 dark:text-amber-400 shadow-md' : 'border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed'}`}
                >
                  <span className="font-bold text-base uppercase tracking-widest group-hover:scale-105 transition-transform">
                    {currentInterestRate >= 59 ? 'Estudos Bloqueados (Dívidas)'
                      : getNextDegree() ? `🎓 Estudar | ${getNextDegree()?.nome} (${stats.experienciaCurriculo}/${getNextDegree()?.mesesNecessarios})`
                      : '🎓 Formação Completa'}
                  </span>
                  {getNextDegree() && currentInterestRate < 59 && (
                    <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                      R$ {currentSeason === 'Primavera' ? Math.floor(getNextDegree()!.custoMensal * 0.7) : getNextDegree()!.custoMensal}
                    </p>
                  )}
                </button>
                )}

                {/* Barra de progresso da graduação */}
                {getNextDegree() && (
                  <div className="px-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      <span>Graduação — {getNextDegree()?.nome}</span>
                      <span>{stats.experienciaCurriculo}/{getNextDegree()?.mesesNecessarios}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${(stats.experienciaCurriculo / (getNextDegree()?.mesesNecessarios ?? 1)) * 100}%` }} />
                    </div>
                  </div>
                )}

                {/* Botão Estudar Curso (separado) */}
                {stats.cursoAtivo && (() => {
                  const c = getCursoById(stats.cursoAtivo.id);
                  if (!c) return null;
                  const custoCurso = c.mensalidade;
                  const podeEstudar = stats.saldo >= custoCurso && currentInterestRate < 59;
                  return (
                    <>
                      <button
                        onClick={handleStudyCourse}
                        disabled={!podeEstudar || gameOver}
                        className={`group w-full flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${podeEstudar ? 'border-primary/20 bg-primary/5 dark:bg-primary/10 hover:border-primary text-primary shadow-md' : 'border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed text-slate-400'}`}
                      >
                        <span className="font-bold text-base uppercase tracking-widest group-hover:scale-105 transition-transform">
                          📚 Estudar — {c.nome} ({stats.cursoAtivo.progress}/{c.duracaoEstudos})
                        </span>
                        <p className="text-[10px] mt-1 font-bold uppercase tracking-widest opacity-70">R$ {custoCurso} por estudo</p>
                      </button>
                      <div className="px-2">
                        <div className="flex justify-between text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-1">
                          <span>{c.emoji} {c.nome}</span>
                          <span>{stats.cursoAtivo.progress}/{c.duracaoEstudos}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${(stats.cursoAtivo.progress / c.duracaoEstudos) * 100}%` }} />
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Botão Cursos */}
                <button
                  onClick={() => setIsCursoModalOpen(true)}
                  className="w-full py-3 rounded-2xl border-2 border-primary/30 text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary/5 hover:border-primary transition-all active:scale-95"
                >
                  📚 Cursos {(stats.cursosCompletos ?? []).length > 0 && `(${stats.cursosCompletos.length} concluído${stats.cursosCompletos.length > 1 ? 's' : ''})`}
                </button>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <ActionLog events={events} />
          </aside>
        </main>
      </div>

      {/* Modal Coleção: Títulos e Artefatos */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 relative">
            <UniversalCloseButton onClick={() => setIsInventoryModalOpen(false)} />
            <div className="p-8 bg-gradient-to-br from-primary via-indigo-700 to-violet-900 text-white">
              <h2 className="text-3xl font-bold uppercase tracking-tighter">Coleção</h2>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Títulos e itens especiais da sua jornada</p>
              <div className="mt-6 flex max-w-sm gap-2 rounded-2xl bg-black/20 p-1.5">
                <button onClick={() => setInventoryTab('titles')} className={`flex-1 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${inventoryTab === 'titles' ? 'bg-white text-primary shadow-lg' : 'text-white/70 hover:text-white'}`}>🏆 Títulos</button>
                <button onClick={() => setInventoryTab('artifacts')} className={`relative flex-1 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${inventoryTab === 'artifacts' ? 'bg-white text-violet-700 shadow-lg' : 'text-white/70 hover:text-white'}`}>
                  ✨ Artefatos
                  {totalArtifactBoxes > 0 && <span className="absolute -right-1 -top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[8px] text-slate-950">{totalArtifactBoxes}</span>}
                </button>
              </div>
            </div>
            <div className="p-6 md:p-8 max-h-[68vh] overflow-y-auto">
              {inventoryTab === 'titles' ? (
                <div className="space-y-4">
                {TITLES_LIST.map(title => {
                const isUnlocked = stats.unlockedTitles.includes(title.id);
                const isEquipped = stats.equippedTitle === title.id;

                return (
                  <div key={title.id} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between ${isUnlocked ? 'bg-white dark:bg-slate-800 border-primary/20 dark:border-primary/40' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <h4 className={`max-w-full break-words text-lg sm:text-xl ${getTitleStyle(title.name)}`}>
                          {title.name}
                        </h4>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                          title.difficulty === 'Exclusivo' ? 'bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-700 text-white shadow-md shadow-amber-500/30' :
                          title.difficulty === 'Insano+++' ? 'bg-purple-700 text-white' :
                          title.difficulty === 'Insano'    ? 'bg-pink-500 text-white' :
                          title.difficulty === 'Difícil'   ? 'bg-red-600 text-white' :
                          title.difficulty === 'Médio'     ? 'bg-yellow-500 text-white' :
                          'bg-green-400 text-white'
                        }`}>{title.difficulty}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{title.desc}</p>
                    </div>
                    {isUnlocked ? (
                      <button 
                        onClick={() => handleEquipTitle(title.id, isEquipped)}
                        className={`w-full px-6 py-3 sm:w-auto rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isEquipped ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-primary hover:text-white'}`}
                      >
                        {isEquipped ? 'Equipado' : 'Equipar'}
                      </button>
                    ) : (
                      <div className="w-full px-3 py-2 text-left text-[10px] font-black text-slate-300 uppercase tracking-widest sm:w-auto sm:px-6 sm:py-3 sm:text-center">Bloqueado</div>
                    )}
                  </div>
                );
              })}
                </div>
              ) : !artifactsUnlocked ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-100 text-5xl grayscale dark:bg-slate-800">🔒</div>
                  <h3 className="mt-6 text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Artefatos bloqueados</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-relaxed text-slate-500 dark:text-slate-400">Complete sua primeira aposentadoria para liberar caixas, descobrir artefatos e equipar até quatro vantagens.</p>
                  <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Progresso até a primeira aposentadoria</p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-emerald-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600" style={{ width: `${retirementProgress}%` }} /></div>
                    <p className="mt-2 text-xs font-black text-emerald-700 dark:text-emerald-300">{retirementProgress.toFixed(1)}% de R$ 10.000.000</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <section className="overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-5 dark:border-violet-500/20 dark:from-violet-950/40 dark:via-slate-900 dark:to-amber-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-500">Artefatos equipados</p>
                        <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{stats.equippedArtifacts.length} de {MAX_EQUIPPED_ARTIFACTS} espaços usados</h3>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {Array.from({ length: MAX_EQUIPPED_ARTIFACTS }, (_, index) => {
                        const artifactId = stats.equippedArtifacts[index];
                        const artifact = ARTIFACT_DEFINITIONS.find(item => item.id === artifactId);
                        const level = artifact ? stats.artifactLevels[artifact.id] ?? 0 : 0;
                        return artifact ? (
                          <button key={artifact.id} onClick={() => handleToggleArtifact(artifact.id)} className={`rounded-2xl border bg-gradient-to-br ${getArtifactCardStyle(artifact)} p-3 text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-95`}>
                            <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-3xl ${getArtifactIconStyle(artifact.rarity)}`}><ArtifactIcon artifact={artifact} /></span>
                            <p className="mt-2 truncate text-[9px] font-black uppercase">{artifact.name}</p>
                            {artifact.rarity !== 'Divinity' && <p className="text-[8px] font-bold opacity-80">Nível {level}</p>}
                          </button>
                        ) : (
                          <div key={`empty-${index}`} className="flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-300 dark:border-slate-700 dark:bg-white/5 dark:text-slate-600">
                            <span className="text-2xl">＋</span><span className="mt-1 text-[8px] font-black uppercase">Vazio</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <div className="mb-4 flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Inventário</p><h3 className="text-xl font-black text-slate-900 dark:text-white">Seus artefatos</h3></div><p className="text-[9px] font-bold text-slate-400">Evolutivos: até nível {MAX_ARTIFACT_LEVEL}</p></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {ARTIFACT_DEFINITIONS.filter(artifact => (stats.artifactLevels[artifact.id] ?? 0) > 0).map(artifact => {
                        const level = stats.artifactLevels[artifact.id] ?? 0;
                        const owned = level > 0;
                        const equipped = stats.equippedArtifacts.includes(artifact.id);
                        return (
                          <div key={artifact.id} className={`relative overflow-hidden rounded-[1.75rem] border-2 p-4 transition-all ${owned ? getArtifactCardStyle(artifact) : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-950'}`}>
                            <div className="flex items-start gap-4">
                              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg ${getArtifactIconStyle(artifact.rarity)}`}><ArtifactIcon artifact={artifact} /></div>
                              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h4 className="truncate text-sm font-black text-slate-900 dark:text-white">{owned ? artifact.name : 'Não descoberto'}</h4>{owned && artifact.rarity !== 'Divinity' && <span className="text-[8px] font-black uppercase text-slate-400">Nv. {level}</span>}</div><p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{artifact.rarity}</p>{owned && <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">{describeArtifactEffect(artifact, level)}</p>}</div>
                            </div>
                            {owned && <>{artifact.rarity !== 'Divinity' && <div className="mt-4 flex gap-1">{Array.from({ length: MAX_ARTIFACT_LEVEL }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < level ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700'}`} />)}</div>}<button onClick={() => handleToggleArtifact(artifact.id)} disabled={!equipped && stats.equippedArtifacts.length >= MAX_EQUIPPED_ARTIFACTS} className={`mt-4 w-full rounded-xl py-2.5 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${equipped ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'}`}>{equipped ? '✓ Equipado · remover' : stats.equippedArtifacts.length >= MAX_EQUIPPED_ARTIFACTS ? 'Troque um espaço primeiro' : 'Equipar'}</button></>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loja de Caixas de Artefatos */}
      {isArtifactBoxModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 p-3 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-50 shadow-2xl dark:bg-[#080d1a]">
            <UniversalCloseButton onClick={() => { stopAutoOpening(); setIsArtifactBoxModalOpen(false); }} />
            <div className="shrink-0 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-slate-950 p-7 pr-20 text-white sm:p-9">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-200">Artefatos</p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-tighter">Loja de Caixas</h2>
              <p className="mt-2 text-xs font-bold text-white/70">Escolha a caixa, confira as chances e veja exatamente o que pode encontrar.</p>
            </div>
            {openingArtifactBox && (() => {
              const openingBox = ARTIFACT_BOX_DEFINITIONS.find(box => box.id === openingArtifactBox);
              const reward = lastArtifactReward ? ARTIFACT_DEFINITIONS.find(item => item.id === lastArtifactReward.id) : null;
              if (!openingBox) return null;
              return (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/95 p-6 text-center text-white backdrop-blur-xl">
                  {!reward ? (
                    <div><div className="artifact-box-opening text-8xl drop-shadow-[0_20px_35px_rgba(139,92,246,0.55)]">{openingBox.emoji}</div><p className="mt-8 text-xs font-black uppercase tracking-[0.35em] text-violet-300">Abrindo {openingBox.name}...</p></div>
                  ) : (
                    <div className="artifact-reward-reveal max-w-sm"><div className={`mx-auto flex h-36 w-36 items-center justify-center rounded-[2.5rem] text-7xl shadow-2xl ${getArtifactIconStyle(reward.rarity)}`}><ArtifactIcon artifact={reward} /></div><p className="mt-7 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">{lastArtifactReward?.upgraded ? 'Artefato fortalecido!' : 'Novo artefato!'}</p><h3 className="mt-2 text-3xl font-black">{reward.name}</h3><p className={`mt-2 text-sm font-black uppercase tracking-widest ${reward.rarity === 'Lendário' ? 'artifact-chance-rgb' : reward.rarity === 'Divinity' ? 'text-sky-200' : 'text-white/70'}`}>{reward.rarity}</p></div>
                  )}
                </div>
              );
            })()}
            <div className="overflow-y-auto p-5 sm:p-7">
              {!artifactsUnlocked ? (
                <div className="mx-auto max-w-lg py-12 text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-200 text-5xl grayscale dark:bg-slate-800">🔒</div>
                  <h3 className="mt-6 text-2xl font-black uppercase text-slate-900 dark:text-white">Loja bloqueada</h3>
                  <p className="mt-3 text-sm font-bold leading-relaxed text-slate-500">As caixas e os artefatos são liberados quando você completa a primeira aposentadoria.</p>
                  <button onClick={() => { setIsArtifactBoxModalOpen(false); setShowRetirementConfirm(false); setIsRetirementModalOpen(true); }} className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">Ver aposentadoria</button>
                </div>
              ) : (
                <div className="space-y-7">
                  <section>
                    <div className="mb-4"><p className="text-[9px] font-black uppercase tracking-widest text-violet-500">Passo 1</p><h3 className="text-xl font-black text-slate-900 dark:text-white">Escolha uma caixa</h3></div>
                    <div className="grid gap-5">
                      {ARTIFACT_BOX_DEFINITIONS.map(box => {
                        const amount = stats.artifactBoxes?.[box.id] ?? 0;
                        const price = getDiscountedUiPrice(getArtifactBoxPrice(box.id, retirementCount));
                        const canUseStored = amount > 0;
                        const canBuy = stats.saldo >= price;
                        return (
                          <div key={box.id} className="overflow-hidden rounded-[2rem] border-2 border-violet-500/70 bg-white shadow-lg shadow-violet-950/10 dark:bg-slate-900">
                            <div className={`grid gap-5 bg-gradient-to-br ${box.style} p-5 text-white md:grid-cols-[220px_1fr] md:p-6`}>
                              <div className="relative"><div className="flex items-center justify-between md:block"><span className="text-5xl">{box.emoji}</span></div><h4 className="mt-4 text-2xl font-black">{box.name}</h4></div>
                              <div className="rounded-2xl border border-white/15 bg-black/15 p-3 backdrop-blur-sm">
                                <div className="mb-3 flex items-center justify-between"><p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/65">Possíveis artefatos</p>{box.id === 'elite' && <span className="text-xs font-black tracking-[0.25em] text-sky-200 drop-shadow-[0_0_8px_rgba(186,230,253,0.9)]">???</span>}</div>
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                                  {ARTIFACT_DEFINITIONS.filter(artifact => box.artifactIds.includes(artifact.id) && artifact.rarity !== 'Divinity').sort((a, b) => ['Comum', 'Raro', 'Épico', 'Lendário'].indexOf(a.rarity) - ['Comum', 'Raro', 'Épico', 'Lendário'].indexOf(b.rarity)).map(artifact => {
                                    const rarityCount = ARTIFACT_DEFINITIONS.filter(item => box.artifactIds.includes(item.id) && item.rarity === artifact.rarity).length;
                                    const individualChance = box.chances[artifact.rarity] / rarityCount;
                                    const owned = (stats.artifactLevels?.[artifact.id] ?? 0) > 0;
                                    const chanceColor = artifact.rarity === 'Comum' ? 'text-white' : artifact.rarity === 'Raro' ? 'text-sky-300' : artifact.rarity === 'Épico' ? 'text-violet-300' : 'artifact-chance-rgb';
                                    return <div key={artifact.id} className={`min-w-0 rounded-xl px-1.5 py-3 text-center transition-all ${owned ? 'bg-white/25 ring-1 ring-white/35' : 'bg-white/10'}`}><div className={`${owned ? 'drop-shadow-lg' : 'artifact-silhouette'} mx-auto text-3xl sm:text-4xl`}>{artifact.emoji}</div><p className={`mt-1.5 text-[11px] font-black sm:text-xs ${chanceColor}`}>{individualChance.toFixed(individualChance < 10 ? 2 : 1)}%</p></div>;
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
                              <button onClick={() => handleBuyAndOpenArtifactBox(box.id)} disabled={openingArtifactBox !== null || (!canUseStored && !canBuy)} className={`w-full rounded-2xl bg-gradient-to-r ${box.style} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-35`}>
                                {canUseStored ? `Abrir ${box.name} disponível` : <>Comprar e abrir<br/><span className="text-[9px] opacity-80">R$ {price.toLocaleString('pt-BR')}</span></>}
                              </button>
                              <button onClick={() => handleAutoOpenArtifactBox(box.id)} disabled={(autoOpeningBox !== null && autoOpeningBox !== box.id) || (!canUseStored && !canBuy)} className={`w-full rounded-2xl border-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 ${autoOpeningBox === box.id ? 'border-rose-400 bg-rose-500 text-white' : 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200'}`}>
                                {autoOpeningBox === box.id ? 'Parar abertura automática' : 'Abrir automaticamente'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {lastArtifactReward && (() => {
                    const reward = ARTIFACT_DEFINITIONS.find(item => item.id === lastArtifactReward.id);
                    if (!reward) return null;
                    const level = stats.artifactLevels[reward.id] ?? 1;
                    return <div className={`rounded-[2rem] border bg-gradient-to-r ${getArtifactCardStyle(reward)} p-1 shadow-xl`}><div className="flex items-center gap-4 rounded-[1.75rem] bg-slate-950 p-5 text-white"><span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-5xl ${getArtifactIconStyle(reward.rarity)}`}><ArtifactIcon artifact={reward} /></span><div><p className="text-[9px] font-black uppercase tracking-widest text-amber-300">{lastArtifactReward.upgraded ? 'Artefato fortalecido!' : 'Novo artefato!'}</p><h4 className="text-xl font-black">{reward.name}{reward.rarity !== 'Divinity' ? ` · Nível ${level}` : ''}</h4><p className={`mt-1 text-xs font-black uppercase tracking-widest ${reward.rarity === 'Lendário' ? 'artifact-chance-rgb' : reward.rarity === 'Divinity' ? 'text-sky-200' : 'text-slate-300'}`}>{reward.rarity}</p></div></div></div>;
                  })()}

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Índice completo de Artefatos */}
      {isArtifactIndexOpen && (
        <div className="fixed inset-0 z-[155] flex items-center justify-center bg-black/85 p-3 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <UniversalCloseButton onClick={() => setIsArtifactIndexOpen(false)} />
            <div className="shrink-0 bg-gradient-to-br from-slate-900 via-violet-950 to-fuchsia-950 p-7 pr-20 text-white sm:p-9"><p className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-300">Enciclopédia</p><h2 className="mt-1 text-3xl font-black uppercase tracking-tighter">Índice de Artefatos</h2><p className="mt-2 text-xs font-bold text-white/65">Todos os artefatos, suas raridades e vantagens.</p></div>
            <div className="overflow-y-auto p-5 sm:p-7">
              <div className="mb-5 flex flex-wrap gap-2">{(['Comum', 'Raro', 'Épico', 'Lendário'] as const).map(rarity => <span key={rarity} className={`rounded-full bg-gradient-to-r ${ARTIFACT_RARITY_STYLE[rarity]} px-3 py-1.5 text-[9px] font-black uppercase text-white`}>{rarity} · {ARTIFACT_DEFINITIONS.filter(item => item.rarity === rarity).length}</span>)}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {ARTIFACT_DEFINITIONS
                  .filter(artifact => artifact.rarity !== 'Divinity' || (stats.artifactLevels?.[artifact.id] ?? 0) > 0)
                  .sort((a, b) => ['Comum', 'Raro', 'Épico', 'Lendário', 'Divinity'].indexOf(a.rarity) - ['Comum', 'Raro', 'Épico', 'Lendário', 'Divinity'].indexOf(b.rarity))
                  .map(artifact => {
                  const level = stats.artifactLevels?.[artifact.id] ?? 0;
                  const discovered = level > 0;
                  const equipped = stats.equippedArtifacts.includes(artifact.id);
                  return <div key={artifact.id} className={`relative overflow-hidden rounded-[1.75rem] border-2 bg-slate-50 p-4 dark:bg-slate-950/60 ${discovered ? getArtifactCardStyle(artifact) : 'border-slate-200 dark:border-slate-800'}`}><div className="flex items-start gap-4"><div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg ${discovered ? getArtifactIconStyle(artifact.rarity) : 'artifact-silhouette bg-slate-700 text-slate-950 grayscale'}`}><ArtifactIcon artifact={artifact} /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{discovered ? artifact.name : 'Não descoberto'}</h3>{discovered && equipped && <span className="rounded-full bg-emerald-500 px-2 py-1 text-[7px] font-black uppercase text-white">Equipado</span>}</div><p className="mt-1 text-[8px] font-black uppercase tracking-widest text-slate-400">{discovered ? `${artifact.rarity}${artifact.rarity !== 'Divinity' ? ` · Nível ${level}` : ''}` : 'Não descoberto'}</p><p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">{discovered ? artifact.description : 'Não descoberto'}</p>{discovered && <p className="mt-2 text-[10px] font-black text-violet-600 dark:text-violet-300">{artifact.rarity === 'Divinity' ? 'Efeito' : `No nível ${level}`}: {describeArtifactEffect(artifact, level)}</p>}</div></div></div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nickname Inicial */}
      {isNickModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] w-full max-sm:max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <span className="text-6xl mb-6 block">💼</span>
            <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-800 dark:text-white">Identificação CLT</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 mb-8">
              Apenas letras e números (4-15 caracteres)<br/>Sem espaços, acentos ou símbolos
            </p>
            <input 
              type="text" 
              value={nickInput} 
              onChange={e => setNickInput(e.target.value)} 
              className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl mb-6 text-center font-bold text-xl text-slate-800 dark:text-slate-100 outline-none focus:border-primary" 
              placeholder="Nickname"
              maxLength={15}
            />
            <button 
              onClick={handleSetNick} 
              disabled={nickInput.length < 4}
              className="w-full py-5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl uppercase text-xs tracking-widest transition-all active:scale-95"
            >
              Iniciar Carreira
            </button>
          </div>
        </div>
      )}

      {/* Modal E-mail */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-5xl h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row relative">
            <UniversalCloseButton onClick={() => { setIsEmailModalOpen(false); setSelectedEmailId(null); }} />
            
            <div className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col ${selectedEmailId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Caixa de Entrada</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {stats.emails.length === 0 ? (
                  <div className="p-10 text-center opacity-40">
                    <span className="text-4xl block mb-2">📭</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Vazio</p>
                  </div>
                ) : (
                  stats.emails.map(email => (
                    <button 
                      key={email.id} 
                      onClick={() => handleEmailClick(email.id)}
                      className={`w-full p-5 text-left border-b border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 flex flex-col gap-1 relative ${selectedEmailId === email.id ? 'bg-white dark:bg-slate-800 border-l-4 border-l-primary' : ''}`}
                    >
                      {!email.read && <span className="absolute top-6 right-6 w-2 h-2 bg-primary rounded-full" />}
                      <p className={`text-[10px] font-bold uppercase truncate pr-4 ${!email.read ? 'text-primary' : 'text-slate-400'}`}>
                        {email.sender}
                      </p>
                      <h4 className={`text-sm font-bold truncate ${!email.read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {email.subject}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{email.body}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 min-h-0 ${selectedEmailId ? 'flex' : 'hidden md:flex'}`}>
              {selectedEmail ? (
                <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 min-h-0">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <button onClick={() => setSelectedEmailId(null)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">← Voltar</button>
                    <button 
                      onClick={() => handleDeleteEmail(selectedEmail.id)} 
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                    >
                      🗑️ Excluir
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-8 md:p-12 space-y-10 pb-24">
                      <div className="space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tighter leading-tight">{selectedEmail.subject}</h2>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">
                            {selectedEmail.sender[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedEmail.sender}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Enviado recentemente</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          {selectedEmail.body}
                        </p>

                        {selectedEmail.jobOffer && (
                          <div className="mt-10 pt-10 border-t border-slate-200 dark:border-slate-700">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-primary/10 dark:border-primary/20 shadow-xl space-y-6">
                              <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Resumo da Proposta</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Novo Salário</p>
                                  <p className="text-lg font-bold text-emerald-600">R$ {selectedEmail.jobOffer.salario}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                  <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Novo Custo</p>
                                  <p className="text-lg font-bold text-rose-500">R$ {selectedEmail.jobOffer.contas}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleAcceptJobClick(selectedEmail.jobOffer!)}
                                className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl uppercase text-xs tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95"
                              >
                                Agendar Entrevista 💼
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 select-none p-10 text-center">
                  <span className="text-8xl mb-6">📬</span>
                  <p className="text-sm font-bold uppercase tracking-[0.5em]">Selecione uma mensagem</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENTREVISTA */}
      {isInterviewOpen && interviewOffer && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border-4 border-primary animate-in zoom-in-95 duration-500 relative">
            <UniversalCloseButton onClick={() => setIsInterviewOpen(false)} />
            {interviewStatus === 'ongoing' ? (
              <>
                <div className="bg-primary p-8 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter">Entrevista de Emprego</h2>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{interviewOffer.empresa} • {interviewOffer.cargo}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-emerald-500 rounded-2xl shadow-lg">
                      <p className="text-[8px] font-bold uppercase">Acertos</p>
                      <p className="text-xl font-bold">{interviewCorrectCount}/5</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-rose-500 rounded-2xl shadow-lg">
                      <p className="text-[8px] font-bold uppercase">Erros</p>
                      <p className="text-xl font-bold">{interviewWrongCount}/3</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12 space-y-8 min-h-[400px] flex flex-col justify-center">
                  {isGeneratingQuestion ? (
                    <div className="text-center space-y-6 animate-pulse">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center text-4xl">👔</div>
                      <p className="font-bold text-slate-400 uppercase tracking-widest">O recrutador está formulando a próxima pergunta...</p>
                    </div>
                  ) : currentInterviewQuestion ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                        <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-tight">
                          "{currentInterviewQuestion.question}"
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {currentInterviewQuestion.options.map((option, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleInterviewAnswer(idx)}
                            className="p-5 text-left bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-medium hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-sm md:text-base group flex items-center gap-4"
                          >
                            <div className="w-10 h-10 shrink-0 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              {String.fromCharCode(65 + idx)}
                            </div>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-slate-400">Erro ao carregar pergunta. Tente novamente.</p>
                      <button onClick={() => loadInterviewQuestion(interviewOffer)} className="mt-4 px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm">Outra pergunta</button>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Dica: Responda com profissionalismo e ética para impressionar o RH.</p>
                </div>
              </>
            ) : (
              <div className="p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
                {interviewStatus === 'success' ? (
                  <>
                    <div className="text-7xl mb-4">🥳</div>
                    <h2 className="text-4xl font-bold text-emerald-600 uppercase tracking-tighter">Parabéns!</h2>
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300 italic leading-relaxed">
                        "Seu perfil superou todas as nossas expectativas. Ficamos impressionados com sua postura profissional. Seja bem-vindo à equipe da {interviewOffer.empresa}!"
                      </p>
                    </div>
                    <button 
                      onClick={finalizeInterview}
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Começar no Novo Emprego 💼
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-7xl mb-4">😔</div>
                    <h2 className="text-4xl font-bold text-rose-600 uppercase tracking-tighter">Obrigado pelo Interesse</h2>
                    <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-800">
                      <p className="text-lg font-bold text-rose-800 dark:text-rose-300 italic leading-relaxed">
                        "Infelizmente, neste momento, seu perfil não atendeu nossas expectativas para a vaga de {interviewOffer.cargo}. Desejamos sorte em sua jornada profissional."
                      </p>
                    </div>
                    <button 
                      onClick={finalizeInterview}
                      className="w-full py-5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl shadow-xl uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Voltar para a Luta 🏢
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Mercado */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm border-2 border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <UniversalCloseButton onClick={() => setIsFoodModalOpen(false)} />
            <div className="text-center mb-6">
              <span className="text-5xl">🛒</span>
              <h2 className="text-2xl font-bold mt-4 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Supermercado</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 italic">R$ {getCurrentFoodPrice().toFixed(0)} / unidade</p>
            </div>
            <input type="text" inputMode="numeric" value={foodQuantityInput} onChange={e => handleFoodQuantityChange(e.target.value)} className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl mb-6 text-center font-bold text-4xl text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500" />
            <div className="flex gap-3">
              <button onClick={handleBuyFood} className="w-full py-4 bg-emerald-600 dark:bg-emerald-700 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Comprar Agora</button>
            </div>
          </div>
        </div>
      )}

      {isDevModeEnabled && !isDevPanelOpen && (
        <button
          onClick={openDevPanel}
          className="fixed bottom-5 left-5 z-[90] rounded-full border border-fuchsia-400/40 bg-slate-950 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300 shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          DEV
        </button>
      )}

      {isDevPanelOpen && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-fuchsia-500/40 bg-slate-950 text-white shadow-[0_0_60px_rgba(217,70,239,0.2)]">
            <UniversalCloseButton onClick={() => setIsDevPanelOpen(false)} />
            <div className="border-b border-white/10 bg-gradient-to-br from-fuchsia-950 via-slate-950 to-violet-950 p-8 text-center">
              <span className="text-5xl">🛠️</span>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-tighter">Painel DEV</h2>
              <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">Somente ambiente local · fora do ranking</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6">
              {[
                { label: 'Saldo', value: devSaldoInput, setter: setDevSaldoInput, step: '0.01' },
                { label: 'Comida', value: devComidaInput, setter: setDevComidaInput, step: '1' },
                { label: 'Lenha', value: devLenhaInput, setter: setDevLenhaInput, step: '1' },
                { label: 'Mês', value: devMesInput, setter: setDevMesInput, step: '1' },
              ].map(field => (
                <label key={field.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-400">{field.label}</span>
                  <input
                    type="number"
                    step={field.step}
                    value={field.value}
                    onChange={event => field.setter(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-lg font-black text-white outline-none focus:border-fuchsia-400"
                  />
                </label>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={handleApplyDevStats}
                disabled={isApplyingDevStats}
                className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-4 text-xs font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
              >
                {isApplyingDevStats ? 'Aplicando...' : 'Aplicar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lenha */}
      {isWoodModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm border-2 border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <UniversalCloseButton onClick={() => setIsWoodModalOpen(false)} />
            <div className="text-center mb-6">
              <span className="text-5xl">🪵</span>
              <h2 className="text-2xl font-bold mt-4 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Comprar Lenha</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 italic">R$ {currentWoodPrice.toFixed(0)} / unidade</p>
            </div>
            <input type="number" value={woodQuantityInput} onChange={e => setWoodQuantityInput(e.target.value)} className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl mb-6 text-center font-bold text-4xl text-slate-800 dark:text-slate-100 outline-none focus:border-primary" min="1" />
            <div className="flex gap-3">
              <button onClick={handleBuyWood} className="w-full py-4 bg-primary text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Comprar Agora</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagar Boletos (Dívidas) */}
      {isPayBillsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-sm:max-w-xs max-w-sm border-2 border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <UniversalCloseButton onClick={() => setIsPayBillsModalOpen(false)} />
            <div className="text-center mb-6">
              <span className="text-5xl">🧾</span>
              <h2 className="text-2xl font-bold mt-4 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Pagar Boletos</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Dívida Total: R$ {stats.contasEmAtraso.toFixed(0)}</p>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">Valor para pagamento</p>
              <input type="number" value={billPayAmountInput} onChange={e => setBillPayAmountInput(e.target.value)} className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-center font-bold text-3xl text-slate-800 dark:text-slate-100 outline-none focus:border-red-500" placeholder="0.00" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setBillPayAmountInput(stats.contasEmAtraso.toString())} className="py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl uppercase text-[8px] tracking-widest">Pagar Tudo</button>
                <button onClick={() => setBillPayAmountInput((stats.contasEmAtraso / 2).toString())} className="py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl uppercase text-[8px] tracking-widest">Pagar Metade</button>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={handlePayPartialBills} className="w-full py-4 bg-red-600 dark:bg-red-700 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg">Confirmar Pagamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Investimentos */}
      {isInvestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
            <UniversalCloseButton onClick={() => setIsInvestModalOpen(false)} />
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <button onClick={() => setInvestTab('savings')} className={`flex-1 py-6 font-bold uppercase text-[11px] tracking-widest transition-all relative ${investTab === 'savings' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600'}`}>
                Poupança
                {investTab === 'savings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-600 animate-in slide-in-from-left duration-300" />}
              </button>
              <button onClick={() => setInvestTab('stocks')} className={`flex-1 py-6 font-bold uppercase text-[11px] tracking-widest transition-all relative ${investTab === 'stocks' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                Ações
                {investTab === 'stocks' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-in duration-300" />}
              </button>
              <button onClick={() => setInvestTab('crypto')} className={`flex-1 py-6 font-bold uppercase text-[11px] tracking-widest transition-all relative ${investTab === 'crypto' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
                Cripto
                {investTab === 'crypto' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 animate-in slide-in-from-right duration-300" />}
              </button>
            </div>
            
            <div className="p-4 md:p-8 max-h-[80vh] overflow-y-auto space-y-8">
               {investTab === 'savings' && (
                 <div key="savings" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="p-8 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 rounded-[2rem] border border-violet-100 dark:border-violet-800 shadow-inner">
                        <p className="text-[10px] font-bold uppercase text-violet-600 dark:text-violet-400 tracking-[0.2em] mb-2">Rendimento Real Mensal</p>
                        <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter">{((SAVINGS_YIELD + (stats.roomUpgrades.sala * 0.001) + artifactEffects.savingsYieldBonus) * 100).toFixed(2)}% <span className="text-sm text-slate-400 font-bold">a.m.</span></p>
                        <div className="mt-4 pt-4 border-t border-violet-100/50">
                          <p className="text-[10px] font-bold uppercase text-violet-500/60 tracking-widest">Saldo Atual na Poupança</p>
                          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 tracking-tight">R$ {stats.poupanca.toFixed(0)}</p>
                          <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-violet-400">Limite: R$ 1.000.000.000</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-2">Valor da Operação</label>
                       <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">R$</span>
                          <input type="number" value={investAmountInput} onChange={e => setInvestAmountInput(e.target.value)} className="w-full p-8 pl-16 text-4xl font-bold text-center bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-3xl text-slate-800 dark:text-slate-100 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm" placeholder="0.00" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-2">
                       <button onClick={() => handleInvestment('deposit')} className="py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 uppercase text-[11px] tracking-widest transition-all active:scale-95">Efetuar Depósito</button>
                       <button onClick={() => handleInvestment('withdraw')} className="py-5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 uppercase text-[11px] tracking-widest transition-all active:scale-95">Solicitar Resgate</button>
                    </div>
                 </div>
               )}

               {(investTab === 'stocks' || investTab === 'crypto') && (
                 <div key={investTab} className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 p-4 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 gap-4">
                            <div>
                                <h3 className={`text-[11px] font-bold uppercase tracking-[0.3em] mb-2 ${investTab === 'crypto' ? 'text-amber-500' : 'text-primary'}`}>
                                  {investTab === 'crypto' ? 'Meus Ativos Digitais' : 'Meu Portfólio Ativo'}
                                </h3>
                                <div className={`h-1.5 w-12 rounded-full ${investTab === 'crypto' ? 'bg-amber-500' : 'bg-primary'}`} />
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto space-y-4">
                                <div>
                                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Saldo em Poupança</p>
                                    <p className="text-xl md:text-2xl font-bold text-violet-600 dark:text-violet-400 tracking-tighter">R$ {stats.poupanca.toFixed(0)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-1">Patrimônio na Categoria</p>
                                    <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter">
                                      R$ {
                                        (Object.entries(stats.portfolio) as [string, AssetPosition][]).filter(([s]) => {
                                          const isC = stats.cryptos.some(c => c.symbol === s);
                                          return investTab === 'crypto' ? isC : !isC;
                                        }).reduce((acc, [s, pos]) => {
                                          const asset = (investTab === 'crypto' ? stats.cryptos : stats.stocks).find(a => a.symbol === s);
                                          return acc + (pos.quantity * (asset?.price || 0));
                                        }, 0).toFixed(0)
                                      }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            {(Object.entries(stats.portfolio) as [string, AssetPosition][]).filter(([s]) => {
                              const isC = stats.cryptos.some(c => c.symbol === s);
                              return investTab === 'crypto' ? isC : !isC;
                            }).length === 0 ? (
                                <div className="text-center py-8 md:py-10 bg-white/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhuma posição em aberto</p>
                                </div>
                            ) : (
                                (Object.entries(stats.portfolio) as [string, AssetPosition][]).filter(([s]) => {
                                  const isC = stats.cryptos.some(c => c.symbol === s);
                                  return investTab === 'crypto' ? isC : !isC;
                                }).map(([symbol, pos]) => {
                                    const asset = (investTab === 'crypto' ? stats.cryptos : stats.stocks).find(a => a.symbol === symbol);
                                    const currentPrice = asset?.price || 0;
                                    const totalCost = pos.quantity * pos.averagePrice;
                                    const currentValue = pos.quantity * currentPrice;
                                    const profitLoss = currentValue - totalCost;
                                    const profitLossPerc = ((currentPrice / pos.averagePrice) - 1) * 100;

                                    return (
                                        <div key={symbol} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-center hover:shadow-md transition-shadow group">
                                            <div className="col-span-1">
                                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Ativo</p>
                                                <p className={`font-bold text-sm md:text-base truncate ${investTab === 'crypto' ? 'text-amber-500' : 'text-primary'}`}>{symbol}</p>
                                            </div>
                                            <div className="col-span-1">
                                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Volume</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">{pos.quantity.toFixed(investTab === 'crypto' ? 4 : 0)} <span className="text-[8px] opacity-50">un</span></p>
                                            </div>
                                            <div className="hidden md:block">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">P. Médio</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-100">R$ {pos.averagePrice.toFixed(0)}</p>
                                            </div>
                                            <div className="col-span-1">
                                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Cotação</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">R$ {currentPrice.toFixed(0)}</p>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Performance</p>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-xs md:text-base font-bold ${profitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {profitLoss >= 0 ? '+' : ''}R$ {Math.abs(profitLoss).toFixed(0)}
                                                    </span>
                                                    <span className={`text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full ${profitLoss >= 0 ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-500 dark:bg-rose-900/20'}`}>
                                                        {profitLoss >= 0 ? '+' : ''}{profitLossPerc.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="w-full md:w-auto">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2 block ml-1 text-center md:text-left">Lote de Operação</label>
                                <input 
                                    type="number" 
                                    value={investTab === 'crypto' ? cryptoTradeQtyInput : stockTradeQtyInput} 
                                    onChange={e => investTab === 'crypto' ? setCryptoTradeQtyInput(e.target.value) : setStockTradeQtyInput(e.target.value)} 
                                    step={investTab === 'crypto' ? "0.0001" : "1"}
                                    className={`w-full md:w-40 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-center outline-none transition-all shadow-sm text-2xl ${investTab === 'crypto' ? 'focus:border-amber-500 focus:ring-amber-500/5' : 'focus:border-primary focus:ring-primary/5'}`} 
                                    min={investTab === 'crypto' ? "0.0001" : "1"} 
                                />
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner w-full md:w-auto text-center md:text-right">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Liquidez Disponível</p>
                                <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">R$ {stats.saldo.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pb-4">
                        <div className="flex items-center gap-4 ml-2">
                           <h3 className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.3em]">
                             {investTab === 'crypto' ? 'Criptoativos Disponíveis' : 'Mercado à Vista'}
                           </h3>
                           <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                        </div>
                        
                        <div className="space-y-4">
                            {(investTab === 'crypto' ? stats.cryptos : stats.stocks).map(asset => {
                                const position = stats.portfolio[asset.symbol];
                                return (
                                    <div key={asset.symbol} className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] hover:shadow-xl transition-all duration-300 group gap-4 md:gap-0 ${investTab === 'crypto' ? 'hover:border-amber-500/30' : 'hover:border-primary/30'}`}>
                                        <div className="flex items-center justify-between w-full md:w-auto md:min-w-[160px]">
                                            <div className="flex items-center gap-3">
                                               <div className={`w-1.5 h-8 rounded-full shrink-0 ${investTab === 'crypto' ? 'bg-amber-500' : 'bg-primary'}`} />
                                               <div className="overflow-hidden">
                                                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg md:text-xl uppercase tracking-tighter leading-none">{asset.symbol}</h4>
                                                  <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-1 truncate max-w-[120px]">{asset.name}</p>
                                               </div>
                                            </div>
                                            <div className="text-right md:hidden">
                                                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tighter">R$ {asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <div className={`flex items-center justify-end gap-1 text-[9px] font-bold ${asset.history[asset.history.length-1] >= asset.history[asset.history.length-2] ? 'text-[#00FFDD]' : 'text-[#FF0066]'}`}>
                                                    {((asset.history[asset.history.length-1] / asset.history[asset.history.length-2] - 1) * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex justify-center w-full py-2 md:py-0">
                                            <Sparkline data={asset.history} id={asset.symbol} />
                                        </div>
                                        <div className="flex flex-row items-center justify-between md:justify-end w-full md:w-auto gap-4 md:gap-8">
                                            <div className="hidden md:block text-right min-w-[100px]">
                                                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter">R$ {asset.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                <div className={`flex items-center justify-end gap-1.5 text-[10px] font-bold mt-1 ${asset.history[asset.history.length-1] >= asset.history[asset.history.length-2] ? 'text-[#00FFDD]' : 'text-[#FF0066]'}`}>
                                                    <span className="text-sm">{asset.history[asset.history.length-1] >= asset.history[asset.history.length-2] ? '▴' : '▾'}</span>
                                                    {((asset.history[asset.history.length-1] / asset.history[asset.history.length-2] - 1) * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col gap-2 w-full md:w-28">
                                                <button 
                                                    onClick={() => buyAsset(asset.symbol, investTab === 'crypto' ? 'crypto' : 'stock')} 
                                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                                                >
                                                    Compra
                                                </button>
                                                <button 
                                                    onClick={() => sellAsset(asset.symbol, investTab === 'crypto' ? 'crypto' : 'stock')} 
                                                    disabled={!position}
                                                    className={`flex-1 py-3 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all ${position ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-500/10 active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'}`}
                                                >
                                                    Venda
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Empresas */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-5 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="bg-slate-50 dark:bg-[#08101f] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_32px_100px_rgba(0,0,0,0.55)] w-full max-w-4xl max-h-[94vh] overflow-hidden border border-white/10 flex flex-col relative">
            <UniversalCloseButton onClick={() => setIsCompanyModalOpen(false)} />
            <div className="relative overflow-hidden p-6 sm:p-8 bg-slate-950 text-white shrink-0">
              <div className="pointer-events-none absolute -top-24 -left-12 h-56 w-56 rounded-full bg-amber-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 right-8 h-56 w-56 rounded-full bg-violet-600/30 blur-3xl" />
              <div className="relative flex items-center gap-4 pr-12">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-3xl shadow-lg shadow-orange-950/40">🏢</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400">Seu império</p>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Minhas Empresas</h2>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">Construa equipes, escolha sua estratégia e cresça.</p>
                </div>
              </div>
              <div className="relative grid grid-cols-2 gap-3 mt-6">
                <div className="rounded-2xl bg-white/[0.07] border border-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Em operação</p>
                  </div>
                  <p className="text-lg sm:text-xl font-black mt-1">{companySummary.operating}<span className="text-sm text-slate-500">/{stats.companies.length}</span></p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-400/5 border border-emerald-400/20 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[8px] font-black uppercase tracking-widest text-emerald-300/80">Resultado mensal</p>
                  <p className="text-lg sm:text-xl font-black mt-1 text-emerald-300">{companySummary.gross - companySummary.costs >= 0 ? '+' : '-'}R$ {Math.abs(companySummary.gross - companySummary.costs).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-white dark:bg-[#0b1527] border-b border-slate-200 dark:border-white/5 shrink-0">
              <button onClick={() => setCompanyTab('mine')} className={`py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all ${companyTab === 'mine' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>Minha gestão <span className="ml-1 opacity-60">{stats.companies.length}</span></button>
              <button onClick={() => setCompanyTab('store')} className={`py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all ${companyTab === 'store' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>Comprar empresas</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-7 bg-slate-100/70 dark:bg-[#08101f]">
              {companyTab === 'store' ? (
                <>
                  <div className="mb-5 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 mb-3">Como funciona</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[['1', 'Compre'], ['2', 'Contrate'], ['3', 'Lucre todo mês']].map(([step, label]) => (
                        <div key={step} className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-blue-100 dark:border-blue-900">
                          <span className="mx-auto flex w-6 h-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-black">{step}</span>
                          <p className="mt-1 text-[8px] sm:text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {COMPANY_DEFINITIONS.filter(definition => !stats.companies.some(company => company.id === definition.id)).map(definition => {
                      const requiredEmployees = getCompanyRequiredEmployees(definition, 1);
                      const purchaseCost = getDiscountedUiPrice(definition.purchaseCost);
                      const hiringCost = getDiscountedUiPrice(Math.floor(getEmployeeHiringCost(definition) * requiredEmployees * (1 - artifactEffects.hiringCostDiscount)));
                      const estimatedProfit = Math.floor(getCompanyProjectedGrossRevenue(definition, 1, 'balanced', stats.produtividade, stats.unlockedMechanics.produtividade) * retirementCompanyMultiplier * (1 + artifactEffects.companyRevenueBonus + conglomerateRevenueBonus)) - Math.floor(getCompanyMaintenance(definition, 1) * (1 - artifactEffects.companyMaintenanceDiscount) * (1 - artifactEffects.companyOperatingCostDiscount)) - Math.floor(requiredEmployees * definition.salaryPerEmployee * (1 - artifactEffects.companyOperatingCostDiscount));
                      const missingMoney = Math.max(0, purchaseCost - stats.saldo);
                      return (
                        <div key={definition.id} className="flex h-full flex-col rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e192c] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-3xl flex items-center justify-center shadow-lg">{definition.emoji}</div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{definition.name}</h3>
                              <p className="text-[10px] text-slate-400 font-bold">{definition.description}</p>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                              <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Preço</p>
                              <p className="text-sm font-black text-slate-800 dark:text-slate-100">R$ {purchaseCost.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                              <p className="text-[7px] font-black uppercase tracking-widest text-emerald-500">Lucro estimado</p>
                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+R$ {estimatedProfit.toLocaleString('pt-BR')}/mês</p>
                            </div>
                          </div>
                          <button onClick={() => handleBuyCompany(definition.id)} disabled={gameOver || missingMoney > 0} className="mt-auto w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-900/20 disabled:opacity-40 disabled:grayscale active:scale-95 transition-all">
                            {missingMoney > 0 ? `Faltam R$ ${missingMoney.toLocaleString('pt-BR')}` : 'Comprar empresa'}
                          </button>
                          <p className="mt-2 text-center text-[8px] font-bold text-slate-400">Depois da compra, monte a equipe por R$ {hiringCost.toLocaleString('pt-BR')}.</p>
                        </div>
                      );
                    })}
                    {COMPANY_DEFINITIONS.every(definition => stats.companies.some(company => company.id === definition.id)) && (
                      <div className="py-12 text-center"><span className="text-5xl">🏆</span><p className="mt-3 text-sm font-black text-slate-700 dark:text-slate-200">Você já comprou todas as empresas!</p></div>
                    )}
                  </div>
                </>
              ) : stats.companies.length === 0 ? (
                <div className="py-14 text-center">
                  <span className="text-6xl">🏪</span>
                  <h3 className="mt-4 text-xl font-black text-slate-800 dark:text-slate-100">Você ainda não tem empresas</h3>
                  <p className="mt-2 text-sm text-slate-400">Comece comprando uma Lanchonete.</p>
                  <button onClick={() => setCompanyTab('store')} className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest">Ver empresas disponíveis</button>
                </div>
              ) : (
                <div className="space-y-5">
                  {COMPANY_DEFINITIONS.filter(definition => stats.companies.some(company => company.id === definition.id)).map(definition => {
                  const owned = stats.companies.find(company => company.id === definition.id);
                  const level = owned?.level ?? 1;
                  const employees = owned?.employees ?? 0;
                  const requiredEmployees = getCompanyRequiredEmployees(definition, level);
                  const strategy = owned?.strategy ?? 'balanced';
                  const grossRevenue = Math.floor(getCompanyProjectedGrossRevenue(definition, level, strategy, stats.produtividade, stats.unlockedMechanics.produtividade) * retirementCompanyMultiplier * (1 + artifactEffects.companyRevenueBonus + conglomerateRevenueBonus));
                  const riskChance = getCompanyRiskChance(strategy, stats.produtividade, stats.unlockedMechanics.produtividade) * (1 - artifactEffects.companyRiskReduction);
                  const maintenance = getDiscountedUiPrice(Math.floor(getCompanyMaintenance(definition, level) * (1 - artifactEffects.companyMaintenanceDiscount) * (1 - artifactEffects.companyOperatingCostDiscount)));
                  const payroll = Math.floor(employees * definition.salaryPerEmployee * (1 - artifactEffects.companyOperatingCostDiscount));
                  const operating = !!owned && employees >= requiredEmployees;
                  const displayedGross = operating ? grossRevenue : 0;
                  const netIncome = displayedGross - maintenance - payroll;
                  const missingEmployees = Math.max(0, requiredEmployees - employees);
                  const hiringCost = getDiscountedUiPrice(Math.floor(getEmployeeHiringCost(definition) * missingEmployees * (1 - artifactEffects.hiringCostDiscount)));
                  const baseUpgradeCost = owned ? getCompanyUpgradeCost(definition, level) : null;
                  const upgradeCost = baseUpgradeCost === null ? null : getDiscountedUiPrice(Math.floor(baseUpgradeCost * (1 - artifactEffects.companyUpgradeDiscount)));

                  return (
                    <div key={definition.id} className={`overflow-hidden rounded-[1.75rem] border bg-white dark:bg-[#0e192c] shadow-sm transition-all ${operating ? 'border-emerald-200/80 dark:border-emerald-500/25' : 'border-amber-300 dark:border-amber-500/30'}`}>
                      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-3xl shadow-lg shadow-orange-900/20">{definition.emoji}</div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-black leading-tight text-slate-900 dark:text-white">{definition.name}</h3>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-slate-300">Nível {level}</span>
                            </div>
                            <p className="mt-1 text-[10px] font-bold text-slate-400">{definition.description}</p>
                          </div>
                        </div>
                        <div className={`min-w-[165px] rounded-2xl px-4 py-3 sm:text-right ${netIncome >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
                          <p className={`text-[8px] font-black uppercase tracking-widest ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{operating ? 'Lucro projetado' : 'Custo mensal'}</p>
                          <p className={`mt-0.5 text-xl font-black ${netIncome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{netIncome >= 0 ? '+' : '-'}R$ {Math.abs(netIncome).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-[0.85fr_1.15fr]">
                        <div className="space-y-3">
                          <div className={`rounded-2xl border p-4 ${operating ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${operating ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]' : 'bg-amber-500'}`} />
                                <span className={`text-[9px] font-black uppercase tracking-wider ${operating ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{operating ? 'Operando normalmente' : 'Equipe incompleta'}</span>
                              </div>
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">👥 {employees}/{requiredEmployees}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-950/60">
                              <div className={`h-full rounded-full transition-all ${operating ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${Math.min(100, (employees / requiredEmployees) * 100)}%` }} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-white/5 dark:bg-slate-950/30">
                            <div><p className="text-[7px] font-black uppercase tracking-wider text-slate-400">Receita</p><p className="mt-1 text-[10px] font-black text-emerald-600">R$ {displayedGross.toLocaleString('pt-BR')}</p></div>
                            <div className="border-l border-slate-200 dark:border-white/10"><p className="text-[7px] font-black uppercase tracking-wider text-slate-400">Gastos mensais</p><p className="mt-1 text-[10px] font-black text-rose-500">R$ {(payroll + maintenance).toLocaleString('pt-BR')}</p></div>
                          </div>

                          {!operating ? (
                            <button onClick={() => handleHireEmployees(definition.id, missingEmployees)} disabled={missingEmployees === 0 || stats.saldo < hiringCost || gameOver} className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-4 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-35">
                              {stats.saldo < hiringCost ? `Faltam R$ ${(hiringCost - stats.saldo).toLocaleString('pt-BR')} para montar a equipe` : `Montar equipe • R$ ${hiringCost.toLocaleString('pt-BR')}`}
                            </button>
                          ) : (
                            <button onClick={() => handleUpgradeCompany(definition.id)} disabled={upgradeCost === null || stats.saldo < (upgradeCost ?? 0) || gameOver} className="w-full rounded-2xl bg-slate-900 py-4 text-[10px] font-black uppercase tracking-wider text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-35 dark:bg-white dark:text-slate-950">
                              {upgradeCost === null ? 'Empresa no nível máximo' : stats.saldo < upgradeCost ? `Melhoria: R$ ${upgradeCost.toLocaleString('pt-BR')}` : `Melhorar para o nível ${level + 1} • R$ ${upgradeCost.toLocaleString('pt-BR')}`}
                            </button>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/5 dark:bg-slate-950/25 sm:p-4">
                          <div className="mb-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Estratégia de gestão</p>
                              <p className="mt-0.5 text-[9px] font-bold text-slate-400">Escolha entre segurança e rendimento.</p>
                            </div>
                            <span className="hidden rounded-full bg-white px-2.5 py-1 text-[8px] font-black text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300 sm:block">Risco mensal</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {COMPANY_STRATEGIES.map(strategyOption => {
                              const optionGross = Math.floor(getCompanyProjectedGrossRevenue(definition, level, strategyOption.id, stats.produtividade, stats.unlockedMechanics.produtividade) * retirementCompanyMultiplier * (1 + artifactEffects.companyRevenueBonus + conglomerateRevenueBonus));
                              const optionNet = optionGross - maintenance - payroll;
                              const optionRisk = getCompanyRiskChance(strategyOption.id, stats.produtividade, stats.unlockedMechanics.produtividade) * (1 - artifactEffects.companyRiskReduction);
                              const selected = strategy === strategyOption.id;
                              const color = strategyOption.id === 'safe'
                                ? selected ? 'border-blue-500 bg-blue-600 text-white shadow-blue-900/25' : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-300'
                                : strategyOption.id === 'aggressive'
                                  ? selected ? 'border-rose-500 bg-rose-600 text-white shadow-rose-900/25' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-300'
                                  : selected ? 'border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-orange-900/25' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300';
                              return (
                                <button key={strategyOption.id} aria-pressed={selected} onClick={() => handleSetCompanyStrategy(definition.id, strategyOption.id)} disabled={gameOver} className={`relative rounded-2xl border p-2.5 text-center shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 ${color} ${selected ? '' : 'shadow-none opacity-75 hover:opacity-100'}`}>
                                  {selected && <span className="absolute right-2 top-2 text-[9px]">✓</span>}
                                  <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-lg ${selected ? 'bg-white/20' : 'bg-white/70 dark:bg-white/10'}`}>{strategyOption.emoji}</span>
                                  <p className="mt-2 text-[8px] font-black uppercase tracking-wide">{strategyOption.name}</p>
                                  <p className="mt-1 text-[10px] font-black">{optionNet >= 0 ? '+' : '-'}R$ {Math.abs(optionNet).toLocaleString('pt-BR')}</p>
                                  <p className={`mx-auto mt-1.5 w-fit rounded-full px-2 py-0.5 text-[7px] font-black uppercase ${selected ? 'bg-black/15 text-white' : 'bg-white/80 dark:bg-white/10'}`}>{(optionRisk * 100).toFixed(1)}% risco</p>
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-center shadow-sm dark:bg-white/5">
                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-200">{getCompanyStrategy(strategy).description}</p>
                            <p className="mt-0.5 text-[8px] font-bold text-slate-400">O risco é a chance de um problema acontecer no próximo mês.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
              <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">Os valores são calculados automaticamente quando você avança o mês.</p>
            </div>
          </div>
        </div>
      )}

      {/* Relatório Mensal Detalhado */}
      {showReport && reportData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-sm:max-w-xs max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col relative max-h-[90vh]">
            <UniversalCloseButton onClick={() => setShowReport(false)} />
            
            <div className={`p-6 text-white flex flex-col items-center gap-2 transition-colors relative overflow-hidden shrink-0 ${
              reportData.estacao === 'Inverno' ? 'bg-primary' :
              reportData.estacao === 'Verão' ? 'bg-amber-600' :
              reportData.estacao === 'Outono' ? 'bg-orange-600' :
              'bg-emerald-600'
            }`}
            style={{
              backgroundImage: `url(${SEASON_IMAGES[(reportData.mes - 1) % 12]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <div className="absolute inset-0 bg-black/40 z-0"></div>
              <div className="absolute top-0 right-0 p-6 opacity-10 text-8xl pointer-events-none select-none z-10">
                {seasonIcons[reportData.estacao]}
              </div>
              <div className="text-4xl mb-1 drop-shadow-2xl z-10">{seasonIcons[reportData.estacao]}</div>
              <div className="z-10 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Resumo Mensal</h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] mt-1 opacity-80">Mês {reportData.mes} • {reportData.estacao}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
               <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    Finanças do Período
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </h3>
                  <div className="space-y-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/30">
                      <button onClick={() => setExpandedReportSections(current => ({ ...current, salary: !current.salary }))} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                        <span className="flex items-center gap-3 text-[15px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300"><span className={`transition-transform ${expandedReportSections.salary ? 'rotate-90' : ''}`}>›</span> Salário</span>
                        <span className={`text-[19px] font-black ${reportData.salarioRecebido >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{reportData.salarioRecebido >= 0 ? '+' : '-'} R$ {Math.abs(reportData.salarioRecebido).toFixed(0)}</span>
                      </button>
                      {expandedReportSections.salary && <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-xs font-bold dark:border-slate-800">
                        <div className="flex justify-between text-slate-500"><span>Salário recebido</span><span className="text-emerald-600">R$ {reportData.salarioBase.toFixed(0)}</span></div>
                        {reportData.estacao === 'Verão' && <div className="flex justify-between text-amber-500"><span>Efeito Verão (-30%)</span><span>já aplicado</span></div>}
                        {reportData.bonusEvento !== 0 && <div className="flex justify-between text-slate-500"><span>Extras do mês</span><span className={reportData.bonusEvento > 0 ? 'text-emerald-600' : 'text-rose-500'}>{reportData.bonusEvento > 0 ? '+' : '-'} R$ {Math.abs(reportData.bonusEvento).toFixed(0)}</span></div>}
                        {reportData.rendimentoPoupanca > 0 && <div className="flex justify-between text-slate-500"><span>Rendimento da poupança</span><span className="text-violet-500">+ R$ {reportData.rendimentoPoupanca.toFixed(0)}</span></div>}
                      </div>}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/30">
                      <button onClick={() => setExpandedReportSections(current => ({ ...current, expenses: !current.expenses }))} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                        <span className="flex items-center gap-3 text-[15px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300"><span className={`transition-transform ${expandedReportSections.expenses ? 'rotate-90' : ''}`}>›</span> Gastos</span>
                        <span className="text-[19px] font-black text-rose-500">- R$ {(reportData.contasAdicionadas + reportData.jurosAplicados).toFixed(0)}</span>
                      </button>
                      {expandedReportSections.expenses && <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-xs font-bold dark:border-slate-800">
                        <div className="flex justify-between text-slate-500"><span>Novos gastos</span><span className="text-rose-500">- R$ {reportData.contasAdicionadas.toFixed(0)}</span></div>
                        {reportData.jurosAplicados > 0 && <div className="flex justify-between text-slate-500"><span>Juros bancários ({reportData.taxaJuros.toFixed(1)}%)</span><span className="text-rose-500">- R$ {reportData.jurosAplicados.toFixed(0)}</span></div>}
                      </div>}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/30">
                      <button onClick={() => setExpandedReportSections(current => ({ ...current, companies: !current.companies }))} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                        <span className="flex items-center gap-3 text-[15px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300"><span className={`transition-transform ${expandedReportSections.companies ? 'rotate-90' : ''}`}>›</span> Empresas</span>
                        <span className={`text-[19px] font-black ${reportData.companyNetIncome >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{reportData.companyNetIncome >= 0 ? '+' : '-'} R$ {Math.abs(reportData.companyNetIncome).toFixed(0)}</span>
                      </button>
                      {expandedReportSections.companies && <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-xs font-bold dark:border-slate-800">
                        <div className="flex justify-between text-slate-500"><span>Receita ({reportData.operatingCompanies} operando)</span><span className="text-emerald-600">+ R$ {reportData.companyGrossRevenue.toFixed(0)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Funcionários e manutenção</span><span className="text-rose-500">- R$ {reportData.companyOperatingCosts.toFixed(0)}</span></div>
                      </div>}
                    </div>
                    {reportData.companyIncidents.length > 0 && (
                      <div className="space-y-2 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 dark:border-rose-700 dark:bg-rose-950/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-300">⚠️ Problemas nas empresas</p>
                        {reportData.companyIncidents.map((incident, index) => <p key={`${incident}-${index}`} className="text-[11px] font-bold leading-snug text-rose-700 dark:text-rose-200">• {incident}</p>)}
                      </div>
                    )}
                  </div>
               </section>

               <section className="space-y-3">
                  <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    Manutenção de Vida
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-[1.2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <span className="text-[16px]">🍞</span>
                      <div>
                        <p className="text-[12px] font-black text-slate-400 uppercase leading-none mb-0.5">Comida</p>
                        <p className="text-[14px] font-black text-slate-800 dark:text-slate-100">{reportData.comidaRestante} un</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-[1.2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <span className="text-[16px]">🪵</span>
                      <div>
                        <p className="text-[12px] font-black text-slate-400 uppercase leading-none mb-0.5">Lenha</p>
                        <p className="text-[14px] font-black text-slate-800 dark:text-slate-100">{reportData.lenhaRestante} un</p>
                      </div>
                    </div>
                  </div>
               </section>

               {(reportData.unlockedMechanics.saude || reportData.unlockedMechanics.felicidade) && (
               <section className="space-y-3">
                  <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    Condição Física e Mental
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {reportData.unlockedMechanics.saude && (() => {
                      const barColor = getHealthBarColor(reportData.saudeValue);
                      return (
                      <div className="p-4 rounded-[1.5rem] border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{reportData.doencaAtiva ? '🤒' : '❤️'}</span>
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Saúde</p>
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">{reportData.saudeValue}/100 {reportData.saudeDelta !== 0 && <span className="text-[10px] font-bold text-slate-400">({reportData.saudeDelta > 0 ? '+' : ''}{reportData.saudeDelta})</span>}</p>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${reportData.saudeValue}%` }} />
                        </div>
                        {reportData.novaDoenca && reportData.doencaAtiva && (
                          <p className="text-[10px] font-bold text-red-500 mt-2">{reportData.doencaAtiva.emoji} Nova doença: {reportData.doencaAtiva.nome}</p>
                        )}
                      </div>
                      );
                    })()}
                    {reportData.unlockedMechanics.felicidade && (
                    <div className={`p-4 rounded-[1.5rem] border-2 flex items-center gap-3 ${humorColors[reportData.humor]}`}>
                      <span className="text-2xl">{humorIcons[reportData.humor]}</span>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">Humor</p>
                        <p className="text-sm font-black uppercase tracking-tight leading-none">{reportData.humor}</p>
                        {reportData.humorMudou && reportData.humorMensagem && (
                          <p className="text-[10px] font-bold italic mt-1 opacity-80">"{reportData.humorMensagem}"</p>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
               </section>
               )}

               {reportData.eventoIA && (
                 <section className="space-y-3">
                    <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      Acontecimento Especial
                      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    </h3>
                    <div className={`p-4 rounded-[1.5rem] border border-dashed transition-all ${
                        reportData.eventoIA.tipo === 'positive' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' :
                        reportData.eventoIA.tipo === 'negative' ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800' :
                        'bg-slate-50/50 border-slate-200 dark:bg-slate-800'
                      }`}>
                      <p className={`text-[13px] font-bold leading-relaxed italic text-center ${
                          reportData.eventoIA.tipo === 'positive' ? 'text-emerald-800 dark:text-emerald-300' :
                          reportData.eventoIA.tipo === 'negative' ? 'text-rose-800 dark:text-rose-300' :
                          'text-slate-700 dark:text-slate-300'
                        }`}>"{reportData.eventoIA.descricao}"</p>
                    </div>
                 </section>
               )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-4 shrink-0">
               <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Saldo Atualizado</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-tighter">R$ {reportData.saldoFinal.toFixed(0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Dívida Total</p>
                    <p className={`text-lg font-black leading-none tracking-tighter ${reportData.dividaAcumulada > 0 ? 'text-rose-600' : 'text-slate-300 dark:text-slate-700'}`}>
                      R$ {reportData.dividaAcumulada.toFixed(0)}
                    </p>
                  </div>
               </div>
               <button 
                  onClick={() => setShowReport(false)} 
                  className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-[1.5rem] shadow-2xl uppercase text-[11px] tracking-[0.15em] transition-all hover:scale-[1.01] active:scale-95"
                >
                  Continuar Jornada
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Status */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-sm max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <UniversalCloseButton onClick={() => setIsStatusModalOpen(false)} />
            <div className="text-center mb-6">
              <span className="text-5xl">📊</span>
              <h2 className="text-2xl font-bold mt-4 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Status</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Resumo do trabalhador</p>
            </div>
            <div className="space-y-2">
              {[
                { icon: '💼', label: 'Salário', value: `R$ ${Math.floor(stats.salario * (1 + (stats.roomUpgrades.escritorio * 0.05)) * retirementSalaryMultiplier * (1 + artifactEffects.salaryBonus)).toLocaleString('pt-BR')}` },
                { icon: '🏦', label: 'Investimentos', value: `R$ ${stats.poupanca.toFixed(0)}` },
                { icon: '📅', label: 'Meses Jogados', value: `${stats.mes} ${stats.mes === 1 ? 'mês' : 'meses'}` },
                { icon: '⭐', label: 'Nível de Carreira', value: `Nível ${stats.nivel}` },
                { icon: '🎓', label: 'Currículo', value: `Nível ${stats.nivelCurriculo}` },
                { icon: '🎒', label: 'Títulos', value: `${stats.unlockedTitles.length} desbloqueado${stats.unlockedTitles.length !== 1 ? 's' : ''}` },
                { icon: '🏖️', label: 'Aposentadorias', value: `${retirementCount}` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setIsArtifactIndexOpen(true);
              }}
              className="mt-5 w-full rounded-2xl border-2 border-violet-200 bg-violet-50 p-4 text-violet-700 shadow-sm transition-all hover:scale-[1.02] hover:border-violet-400 active:scale-95 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"
            >
              <span className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider">✨ Índice de Artefatos</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest opacity-70">Ver itens, raridades e vantagens</span>
            </button>
            <button
              onClick={handleOpenLeaderboard}
              className="mt-3 w-full p-4 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-700 text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider">🏆 Ranking Global</span>
              <span className="block mt-1 text-[9px] font-bold uppercase tracking-widest text-white/80">10 jogadores mais ricos</span>
            </button>
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setShowRetirementConfirm(false);
                setIsRetirementModalOpen(true);
              }}
              className={`mt-3 w-full p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${canRetire ? 'border-emerald-400 bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'}`}
            >
              <span className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider">🏖️ Aposentadoria</span>
              <span className={`block mt-1 text-[9px] font-bold uppercase tracking-widest ${canRetire ? 'text-white/85' : 'text-slate-400'}`}>
                {retirementCount >= 10 ? 'Limite de 10 rebirths atingido' : canRetire ? 'Você já pode se aposentar' : `Próxima: R$ ${retirementRequirement.toLocaleString('pt-BR')}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Aposentadoria */}
      {isRetirementModalOpen && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[2.5rem] border border-emerald-400/30 bg-white dark:bg-[#071522] shadow-2xl shadow-emerald-950/40 animate-in zoom-in-95 duration-300">
            <UniversalCloseButton onClick={() => { setIsRetirementModalOpen(false); setShowRetirementConfirm(false); }} />

            <div className="overflow-hidden rounded-t-[2.5rem] bg-gradient-to-br from-cyan-500 via-emerald-500 to-teal-700 p-8 text-white">
              <div className="flex items-center gap-4 pr-12">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-4xl shadow-xl backdrop-blur-sm">🏖️</div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/75">Rebirth permanente</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Aposentadoria</h2>
                  <p className="mt-1 text-xs font-bold text-white/85">Recomece mais forte a cada nova jornada.</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              {!showRetirementConfirm ? (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Aposentadorias concluídas</p>
                        <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{retirementCount}<span className="text-sm text-slate-400">/10</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Meta atual</p>
                        <p className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">R$ {retirementRequirement.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-500 to-teal-600 transition-all duration-700" style={{ width: `${retirementProgress}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] font-bold text-slate-400">
                      <span>R$ {Math.max(0, stats.saldo).toLocaleString('pt-BR')}</span>
                      <span>{retirementProgress.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Benefícios permanentes atuais</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                        <span className="text-2xl">💼</span>
                        <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-blue-500">Salário mensal</p>
                        <p className="text-xl font-black text-blue-700 dark:text-blue-300">+{retirementCount * 10}%</p>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                        <span className="text-2xl">🏢</span>
                        <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-amber-500">Receita das empresas</p>
                        <p className="text-xl font-black text-amber-700 dark:text-amber-300">+{retirementCount * 5}%</p>
                      </div>
                    </div>
                    <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-center text-[10px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      A próxima aposentadoria adiciona mais +10% ao salário e +5% às empresas.
                    </p>
                    {retirementCount === 0 && (
                      <div className="mt-3 rounded-2xl border-2 border-violet-300 bg-violet-50 p-4 text-center dark:border-violet-500/30 dark:bg-violet-500/10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-violet-500">Desbloqueio do 1º rebirth</p>
                        <p className="mt-1 text-sm font-black text-violet-800 dark:text-violet-200">🏢 Empresas e 📦 Caixas de Artefatos</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">✓ Você mantém</p>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Todos os títulos, artefatos, caixas, seu nick e os bônus permanentes.</p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-500/20 dark:bg-rose-500/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-600">✕ Você perde</p>
                      <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600 dark:text-slate-300">Dinheiro, meses, emprego, estudos, investimentos, casas, empresas e dívidas.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => canRetire && setShowRetirementConfirm(true)}
                    disabled={!canRetire || gameOver}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-600 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40"
                  >
                    {retirementCount >= 10 ? 'Limite de 10 rebirths atingido' : canRetire ? `Aposentar e iniciar jornada ${retirementCount + 1}` : `Faltam R$ ${Math.max(0, retirementRequirement - stats.saldo).toLocaleString('pt-BR')}`}
                  </button>
                </>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-5xl dark:bg-rose-500/15">⚠️</div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Confirmar aposentadoria?</h3>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-slate-500 dark:text-slate-400">Esta ação reinicia toda a sua jornada atual e não pode ser desfeita.</p>
                  </div>
                  <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-left dark:border-rose-500/30 dark:bg-rose-500/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Você está trocando</p>
                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">R$ {stats.saldo.toLocaleString('pt-BR')} e todo o progresso atual</p>
                    <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">Em troca, receberá permanentemente +{(retirementCount + 1) * 10}% no salário e +{(retirementCount + 1) * 5}% na receita empresarial.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowRetirementConfirm(false)} disabled={isRetiring} className="rounded-2xl bg-slate-100 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300">Voltar</button>
                    <button onClick={handleRetire} disabled={isRetiring} className="rounded-2xl bg-rose-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-900/20 transition-all active:scale-95 disabled:opacity-50">
                      {isRetiring ? 'Aposentando...' : 'Sim, recomeçar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ranking Global */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg border border-amber-200 dark:border-amber-800/60 shadow-2xl overflow-hidden relative">
            <UniversalCloseButton onClick={() => setIsLeaderboardOpen(false)} />
            <div className="p-8 text-center bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-700 text-white">
              <span className="text-5xl drop-shadow-lg">🏆</span>
              <h2 className="text-3xl font-black mt-3 uppercase tracking-tighter">Ranking Global</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mt-1">Os 10 jogadores mais ricos</p>
            </div>

            <div className="p-5 md:p-7 max-h-[60vh] overflow-y-auto">
              {isLoadingLeaderboard ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-8 w-8 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Carregando ranking...</p>
                </div>
              ) : leaderboardError ? (
                <div className="py-10 text-center">
                  <span className="text-4xl">⚠️</span>
                  <p className="mt-3 text-sm font-bold text-rose-500">{leaderboardError}</p>
                  <button onClick={handleOpenLeaderboard} className="mt-5 px-5 py-3 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest">Tentar novamente</button>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="py-12 text-center text-sm font-bold text-slate-400">Ainda não há jogadores no ranking.</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[2.25rem_1fr_auto_auto] gap-3 px-3 pb-2 text-[8px] font-black uppercase tracking-widest text-slate-400">
                    <span>#</span>
                    <span>Nick</span>
                    <span className="text-right">Meses</span>
                    <span className="text-right">Saldo</span>
                  </div>
                  {leaderboard.map((player, index) => (
                    <div
                      key={`${player.nick}-${index}`}
                      className={`grid grid-cols-[2.25rem_1fr_auto_auto] items-center gap-3 p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 ${player.nick === stats.playerNick ? 'ring-2 ring-amber-400' : ''}`}
                    >
                      <span className={`text-sm font-black ${
                        index === 0 ? 'text-[#D4AF37]' :
                        index === 1 ? 'text-[#A8A9AD]' :
                        index === 2 ? 'text-[#CD7F32]' :
                        'text-[#B56576]'
                      }`}>{index + 1}º</span>
                      <span className="min-w-0 truncate text-sm font-black text-slate-800 dark:text-slate-100">{player.nick}</span>
                      <span className="whitespace-nowrap text-right text-xs font-bold text-slate-500 dark:text-slate-400">{player.mesesJogados}</span>
                      <span className="whitespace-nowrap text-right text-sm font-black text-emerald-600 dark:text-emerald-400">R$ {Math.floor(player.saldo).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Salvamento */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <UniversalCloseButton onClick={() => { setIsSaveModalOpen(false); setShowDeleteSaveConfirm(false); }} />
            <div className="text-center mb-6">
              <span className="text-5xl">💾</span>
              <h2 className="text-2xl font-bold mt-4 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Salvamento</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                {lastSavedAt ? `Salvo automaticamente às ${new Date(lastSavedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Ainda não salvo'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-4">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                ✓ Todo o Seu Progresso é Salvo Neste Navegador
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleManualSave}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all"
              >
                <span className="text-xl">💾</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Salvar jogo</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Salvar agora</p>
                </div>
              </button>

              {!showDeleteSaveConfirm ? (
                <button
                  onClick={() => setShowDeleteSaveConfirm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-rose-100 dark:border-rose-900/40 hover:border-rose-400 transition-all"
                >
                  <span className="text-xl">🗑️</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Apagar Save</p>
                    <p className="text-[10px] text-rose-400 uppercase tracking-widest">Recomeçar do zero</p>
                  </div>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300 dark:border-rose-800">
                  <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300 text-center mb-3">
                    ⚠️ Isso apaga seu progresso para sempre. Tem certeza?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteSaveConfirm(false)} className="flex-1 py-2 rounded-xl border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/30">Cancelar</button>
                    <button onClick={handleDeleteSave} className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 active:scale-95">Apagar Tudo</button>
                  </div>
                </div>
              )}
              <p className="px-2 pt-2 text-center text-[9px] font-black uppercase tracking-wider leading-relaxed text-rose-500 dark:text-rose-400">
                Atenção: excluir o cache do navegador pode apagar o seu progresso
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cursos */}
      {isCursoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]">
            <UniversalCloseButton onClick={() => { setIsCursoModalOpen(false); setCursoConfirmId(null); }} />
            <div className="p-8 pb-4 text-center">
              <span className="text-5xl">📚</span>
              <h2 className="text-2xl font-bold mt-4 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Cursos</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Invista no seu conhecimento</p>
            </div>

            {/* Modal de confirmação de troca */}
            {cursoConfirmId && (() => {
              const novoCurso = getCursoById(cursoConfirmId);
              const cursoAtualNome = stats.cursoAtivo ? getCursoById(stats.cursoAtivo.id)?.nome : '';
              return (
                <div className="mx-6 mb-6 p-5 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300 text-center mb-1">⚠️ Trocar de curso?</p>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400 text-center mb-4">
                    Você perderá todo o progresso em <strong>{cursoAtualNome}</strong> e começará <strong>{novoCurso?.nome}</strong> do zero.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setCursoConfirmId(null)} className="flex-1 py-2 rounded-xl border-2 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-[11px] font-bold uppercase tracking-widest hover:bg-orange-100 dark:hover:bg-orange-900/30">Cancelar</button>
                    <button onClick={handleConfirmTrocarCurso} className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-orange-600 active:scale-95">Confirmar</button>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-y-auto px-6 pb-8 space-y-3">
              {CURSOS.map(curso => {
                const desbloqueado = curso.unlockCondition(stats);
                const concluido = (stats.cursosCompletos ?? []).includes(curso.id);
                const ativo = stats.cursoAtivo?.id === curso.id;

                return (
                  <div key={curso.id} className={`rounded-2xl border-2 p-4 transition-all ${
                    concluido ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 opacity-70' :
                    ativo ? 'border-primary/50 bg-primary/5 dark:bg-primary/10' :
                    desbloqueado ? 'border-slate-100 dark:border-slate-800 hover:border-primary/40 cursor-pointer' :
                    'border-slate-100 dark:border-slate-800 opacity-50'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl shrink-0">{concluido ? '✅' : !desbloqueado ? '🔒' : curso.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">
                            {curso.nome}
                            {ativo && <span className="ml-2 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Em Curso</span>}
                            {concluido && <span className="ml-2 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Concluído</span>}
                          </p>
                          {!desbloqueado && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{curso.unlockLabel}</p>
                          )}
                          {desbloqueado && !concluido && (
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{curso.duracaoEstudos} estudos • R$ {curso.mensalidade}/estudo</p>
                          )}
                        </div>
                      </div>
                      {desbloqueado && !concluido && !ativo && (
                        <button
                          onClick={() => handleSelectCurso(curso.id)}
                          className="shrink-0 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/80 active:scale-95 transition-all"
                        >
                          Iniciar
                        </button>
                      )}
                    </div>

                    {/* Benefícios */}
                    {desbloqueado && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {curso.beneficios.map((b, i) => (
                          <span key={i} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg uppercase tracking-widest">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Barra de progresso se ativo */}
                    {ativo && stats.cursoAtivo && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-bold text-primary mb-1">
                          <span>Progresso</span>
                          <span>{stats.cursoAtivo.progress}/{curso.duracaoEstudos}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${(stats.cursoAtivo.progress / curso.duracaoEstudos) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ações */}
      {isAcoesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]">
            <UniversalCloseButton onClick={() => setIsAcoesModalOpen(false)} />

            <div className="p-8 pb-4 text-center">
              <span className="text-5xl">⚙️</span>
              <h2 className="text-2xl font-bold mt-3 uppercase tracking-tighter text-slate-800 dark:text-slate-100">Ações</h2>
            </div>

            {/* Tabs */}
            <div className="flex mx-6 mb-4 gap-2">
              <button
                onClick={() => setAcoesTab('saude')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${acoesTab === 'saude' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
              >❤️ Saúde</button>
              {stats.unlockedMechanics.felicidade && (
              <button
                onClick={() => setAcoesTab('lazer')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${acoesTab === 'lazer' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
              >🎉 Lazer</button>
              )}
            </div>

            <div className="overflow-y-auto px-6 pb-8 space-y-3">
              {acoesTab === 'saude' && (
                <>
                  {/* Card de saúde atual */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saúde atual</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">{stats.saudeValue}/100</span>
                    </div>
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${getHealthBarColor(stats.saudeValue)} rounded-full transition-all`} style={{ width: `${stats.saudeValue}%` }} />
                    </div>
                    {stats.doencaAtiva && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">{stats.doencaAtiva.emoji} {stats.doencaAtiva.nome} ativa</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Tratamento: R$ {getLifestyleUiPrice(stats.doencaAtiva.custo).toFixed(0)}</p>
                        <button
                          onClick={handleComprarRemedio}
                          className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >💊 Comprar Remédio</button>
                      </div>
                    )}
                  </div>
                  {ACOES_SAUDE.map(acao => {
                    const price = getLifestyleUiPrice(acao.custo);
                    const pode = stats.saldo >= price;
                    return (
                      <button
                        key={acao.id}
                        onClick={() => handleAcaoSaude(acao.id)}
                        disabled={!pode}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 font-bold transition-all ${pode ? 'border-slate-100 dark:border-slate-800 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 active:scale-95' : 'border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{acao.emoji}</span>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{acao.nome}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">R$ {price.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">+{acao.ganho} saúde</span>
                      </button>
                    );
                  })}
                </>
              )}

              {acoesTab === 'lazer' && (
                <>
                  <div className={`mb-3 p-3 rounded-2xl border flex items-center gap-3 ${humorColors[stats.humor]}`}>
                    <span className="text-2xl">{humorIcons[stats.humor]}</span>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Humor atual</p>
                      <p className="font-black uppercase tracking-tight">{stats.humor}</p>
                    </div>
                  </div>
                  {LAZER_ATIVIDADES.map(atividade => {
                    const ganhoEfetivo = getHappinessGainScaled(atividade.happinessGain, stats.salario);
                    const price = getLifestyleUiPrice(atividade.custoBase);
                    const pode = stats.saldo >= price;
                    return (
                      <button
                        key={atividade.id}
                        onClick={() => handleLazer(atividade.id)}
                        disabled={!pode}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 font-bold transition-all ${pode ? 'border-slate-100 dark:border-slate-800 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 active:scale-95' : 'border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{atividade.emoji}</span>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{atividade.nome}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">R$ {price.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">+{ganhoEfetivo} humor</span>
                      </button>
                    );
                  })}
                  {stats.salario > 15000 && (
                    <p className="text-center text-[10px] text-slate-400 italic pt-2">"O dinheiro já não traz a mesma sensação..."</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup de Doença */}
      {pendingDisease && !showReport && !pendingUnlock && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-sm border-2 border-red-500 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400">
            <div className="bg-gradient-to-b from-red-950 to-slate-900 p-10 flex flex-col items-center text-center">
              <span className="text-6xl mb-4 animate-pulse">{pendingDisease.emoji}</span>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-red-400">🤒 Você ficou doente</h2>
              <p className="text-slate-300 mt-2 font-bold">Diagnóstico: {pendingDisease.nome}</p>
              <p className="text-red-300 mt-1 text-sm">Custo do tratamento: <strong>R$ {getLifestyleUiPrice(pendingDisease.custo).toFixed(0)}</strong></p>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={handleComprarRemedio}
                disabled={stats.saldo < getLifestyleUiPrice(pendingDisease.custo)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all"
              >
                💊 Comprar Remédio — R$ {getLifestyleUiPrice(pendingDisease.custo).toFixed(0)}
              </button>
              <button
                onClick={() => setPendingDisease(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-all"
              >
                Ignorar por enquanto
              </button>
              {stats.saldo < getLifestyleUiPrice(pendingDisease.custo) && (
                <p className="text-center text-[10px] text-rose-400 font-bold">Saldo insuficiente. A doença persistirá e piorará sua saúde.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Popup de Desbloqueio de Mecânica */}
      {!showReport && pendingUnlock && (() => {
        const configs = {
          saude: {
            icon: '❤️', titulo: 'Saúde desbloqueada!', cor: 'from-emerald-500 to-green-600',
            frase: 'Com o passar do tempo, cuidar da saúde se torna importante.',
            desc: (
              <span>
                Se sua <strong className="text-emerald-400">Saúde</strong> ficar muito baixa, você pode adoecer e gastar dinheiro com tratamentos. O botão <strong className="text-primary">⚙️ Ações</strong> foi desbloqueado.
              </span>
            ),
          },
          felicidade: {
            icon: '😊', titulo: 'Felicidade', cor: 'from-yellow-500 to-orange-500',
            frase: 'Sobreviver não é a mesma coisa que viver.',
            desc: (
              <span>
                <strong className="text-orange-400">Lazer</strong> aumenta sua <strong className="text-yellow-400">Felicidade</strong>. Dificuldades podem reduzi-la.
              </span>
            ),
          },
          produtividade: {
            icon: '⚡', titulo: 'Produtividade', cor: 'from-cyan-500 to-blue-600',
            frase: 'Seu desempenho começou a definir seu futuro.',
            desc: (
              <span>
                <strong className="text-emerald-400">Saúde</strong> e <strong className="text-yellow-400">Felicidade</strong> influenciam sua <strong className="text-cyan-400">Produtividade</strong>.
              </span>
            ),
          },
        };
        const cfg = configs[pendingUnlock];
        const handleClose = () => {
          setPendingUnlock(null);
          setHighlightedStats(prev => [...prev, pendingUnlock!]);
          if (pendingUnlock === 'felicidade') setHighlightedStats(prev => [...prev, 'felicidade-lazer']);
          setTimeout(() => {
            setHighlightedStats(prev => prev.filter(s => s !== pendingUnlock && s !== 'felicidade-lazer'));
          }, 4000);
        };
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-sm border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className={`bg-gradient-to-br ${cfg.cor} p-10 flex flex-col items-center text-white text-center`}>
                <span className="text-7xl mb-4 animate-bounce">{cfg.icon}</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter">{cfg.titulo}</h2>
                <p className="text-lg font-bold italic mt-2 opacity-90">"{cfg.frase}"</p>
              </div>
              <div className="p-8 text-center space-y-6">
                <p className="text-slate-300 text-sm leading-relaxed">{cfg.desc}</p>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Nova mecânica desbloqueada no Mês {stats.mes}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-100 active:scale-95 transition-all"
                >
                  Entendido!
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Aviso de entrada em uma nova estação */}
      {seasonNotice && !showReport && !pendingUnlock && (() => {
        const notice = seasonNoticeConfig[seasonNotice];
        return (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-400">
            <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-sm border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-400">
              <div className={`bg-gradient-to-br ${notice.gradient} p-10 flex flex-col items-center text-white text-center`}>
                <span className="text-7xl mb-3">{seasonIcons[seasonNotice]}</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter">{notice.title}</h2>
                <p className="text-lg font-bold italic mt-2 opacity-90">"{notice.phrase}"</p>
              </div>
              <div className="p-8 text-center space-y-5">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white text-base font-black">{notice.effect}</p>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{notice.details}</p>
                {seasonNotice === 'Inverno' && (
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Estoque atual: {stats.lenha} unidade{stats.lenha !== 1 ? 's' : ''} de lenha
                  </p>
                )}
                <button
                  onClick={() => setSeasonNotice(null)}
                  className={`w-full py-4 ${notice.button} text-white rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-all`}
                >
                  Entendido!
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast de Saldo Insuficiente */}
      {insufficientFundsMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
            <span className="text-2xl shrink-0">💸</span>
            <p className="text-sm font-bold">{insufficientFundsMsg}</p>
          </div>
        </div>
      )}

      {/* Toast do Sistema de Salvamento */}
      {saveSystemMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 duration-300">
          <div className={`text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm ${saveSystemMsg.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <span className="text-2xl shrink-0">{saveSystemMsg.type === 'success' ? '💾' : '⚠️'}</span>
            <p className="text-sm font-bold">{saveSystemMsg.text}</p>
          </div>
        </div>
      )}

      {/* Game Over Popup */}
      {gameOver && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-md border-4 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-gradient-to-b from-red-950 to-slate-900 p-12 flex flex-col items-center text-center">
              <span className="text-7xl mb-6">💀</span>
              <h2 className="text-6xl font-black uppercase tracking-tighter text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                GAME OVER
              </h2>
              <div className="mt-6 px-6 py-4 rounded-2xl bg-slate-800/60 border border-red-900/50">
                <p className="text-slate-300 text-sm italic leading-relaxed">"{deathReason}"</p>
              </div>
              <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Mês {stats.mes} • {currentSeason}
              </div>
            </div>
            <div className="px-10 pb-10">
              <button
                onClick={handleReset}
                className="w-full py-5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-2xl font-black uppercase tracking-widest text-lg transition-all shadow-2xl"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}


      <footer className="mt-10 text-center text-slate-400 dark:text-slate-700 text-[8px] font-bold uppercase tracking-[0.5em] pb-10">
        Vida de CLT &bull; O Simulador &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
