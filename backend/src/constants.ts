import { GameStats, Stock, JobOffer } from './types.js';

export const BASE_FOOD_PRICE = 60;
export const WOOD_PRICE = 500;
export const SAVINGS_YIELD = 0.007;

export const GRAUS_ACADEMICOS = [
  { nome: 'Ensino Médio',   custoMensal: 0,    mesesNecessarios: 0,  salBase: 1600  },
  { nome: 'Graduação',      custoMensal: 400,  mesesNecessarios: 12, salBase: 3800  },
  { nome: 'Pós-graduação',  custoMensal: 700,  mesesNecessarios: 12, salBase: 6500  },
  { nome: 'Mestrado',       custoMensal: 1200, mesesNecessarios: 24, salBase: 13000 },
  { nome: 'Doutorado',      custoMensal: 2000, mesesNecessarios: 48, salBase: 25000 },
  { nome: 'Pós-doutorado',  custoMensal: 4000, mesesNecessarios: 18, salBase: 42000 },
];

export const CURSOS = [
  { id: 'financas',      nome: 'Finanças',       emoji: '💰', duracaoEstudos: 25, mensalidade: 400, unlockMes: 0  },
  { id: 'nutricao',      nome: 'Nutrição',       emoji: '🥗', duracaoEstudos: 20, mensalidade: 350, unlockMes: 12 },
  { id: 'psicologia',    nome: 'Psicologia',     emoji: '🧠', duracaoEstudos: 30, mensalidade: 500, unlockMes: 24 },
  { id: 'administracao', nome: 'Administração',  emoji: '🏢', duracaoEstudos: 35, mensalidade: 550, unlockMes: 36 },
  { id: 'ti',            nome: 'TI',             emoji: '💻', duracaoEstudos: 50, mensalidade: 700, unlockMes: 36 },
];

export const ACOES_SAUDE = [
  { id: 'exercicio',  nome: 'Exercícios',      emoji: '🏃', custo: 100,  ganho: 5  },
  { id: 'exame',      nome: 'Exame de Rotina', emoji: '🩺', custo: 500,  ganho: 15 },
  { id: 'suplemento', nome: 'Suplementos',     emoji: '💊', custo: 1500, ganho: 25 },
];

export const LAZER_ATIVIDADES = [
  { id: 'videogame',   nome: 'Jogar Videogame',   emoji: '🎮', custoBase: 80,  happinessGain: 18 },
  { id: 'cinema',      nome: 'Ir ao Cinema',      emoji: '🎬', custoBase: 120, happinessGain: 14 },
  { id: 'restaurante', nome: 'Comer Fora',        emoji: '🍽️', custoBase: 200, happinessGain: 16 },
  { id: 'academia',    nome: 'Academia / Esporte',emoji: '🏋️', custoBase: 150, happinessGain: 20 },
  { id: 'livros',      nome: 'Comprar Livros',    emoji: '📚', custoBase: 60,  happinessGain: 12 },
];

export const DOENCAS = [
  { id: 'gripe',        nome: 'Gripe',                 emoji: '🤧', multiplicador: 0.10, min: 100,  max: 2000  },
  { id: 'infeccao',     nome: 'Infecção',              emoji: '🦠', multiplicador: 0.25, min: 300,  max: 5000  },
  { id: 'respiratorio', nome: 'Problema Respiratório', emoji: '🫁', multiplicador: 0.50, min: 700,  max: 10000 },
  { id: 'cirurgia',     nome: 'Cirurgia Simples',      emoji: '🏥', multiplicador: 1.00, min: 2000, max: 50000 },
];

export const CARGOS  = ['Auxiliar Operacional', 'Analista Trainee', 'Especialista Pleno', 'Coordenador de Área', 'Diretor Executivo', 'Cientista Chefe'];
export const EMPRESAS = ['TechSolutions', 'LogiCorp', 'Banco Dinheiro', 'Varejo Total', 'Inova S.A', 'Consultoria Pro'];

export const TITLES_LIST = [
  { id: 'CLT',          desc: 'Passe o seu 1° mês!' },
  { id: 'Investidor',   desc: 'Compre sua 1° ação' },
  { id: 'BomPapo',      desc: 'Passar em entrevista com 0 erros' },
  { id: 'Gorducho',     desc: 'Compre 100 Comidas' },
  { id: 'Diplomado',    desc: 'Complete a graduação da faculdade' },
  { id: 'WinterWarrior',desc: 'Sobreviva ao inverno' },
  { id: 'CryptoMaster', desc: 'Compre sua 1° criptomoeda' },
  { id: 'Magnata',      desc: 'Atinja R$ 100.000 de saldo' },
  { id: 'CLThanos',     desc: 'Atinja 100 meses de trabalho' },
  { id: 'Doctor',       desc: 'Complete toda a faculdade' },
  { id: 'OneMillion',   desc: 'Atinja R$ 1.000.000' },
  { id: 'Sabido',       desc: 'Complete todos os cursos' },
  { id: 'GOD',          desc: 'Tenha todos os títulos' },
];

const INITIAL_STOCKS: Stock[] = [
  { symbol: 'PETR4',  name: 'Petrobras',          price: 35.50,  history: [34,34.5,35,34.8,35.2,35,34.5,35.1,35.3,35.5], volatility: 0.15 },
  { symbol: 'VALE3',  name: 'Vale S.A.',           price: 68.20,  history: [70,69.5,69,68.5,68.2,67.8,68,68.5,68,68.2],   volatility: 0.12 },
  { symbol: 'AAPL34', name: 'Apple Inc.',          price: 75.20,  history: [70,71.5,72.8,73.2,74.5,74,73.5,74.8,75,75.2], volatility: 0.08 },
  { symbol: 'MSFT34', name: 'Microsoft',           price: 82.50,  history: [78,79.2,80,80.5,81.8,81,80.5,81.5,82,82.5],   volatility: 0.07 },
  { symbol: 'MCDC34', name: "McDonald's",          price: 72.10,  history: [68,69,70.5,70.2,71.5,71.8,71,71.5,71.8,72.1], volatility: 0.06 },
  { symbol: 'AMZO34', name: 'Amazon',              price: 58.40,  history: [52,53.5,55,54.8,56.2,57,56.5,57.8,58,58.4],   volatility: 0.12 },
  { symbol: 'TSLA34', name: 'Tesla, Inc.',         price: 42.15,  history: [35,38,36.5,40,39,41,40.5,43,41.5,42.15],      volatility: 0.25 },
  { symbol: 'GOGL34', name: 'Google (Alphabet)',   price: 78.90,  history: [74,75.2,76,76.5,77.8,77,77.5,78.2,78.5,78.9], volatility: 0.09 },
  { symbol: 'COCA34', name: 'Coca-Cola',           price: 62.30,  history: [60,60.5,61,61.2,61.8,61.5,61.2,61.8,62,62.3], volatility: 0.05 },
  { symbol: 'NVDC34', name: 'NVIDIA Corp.',        price: 145.20, history: [120,125,132,130,138,142,140,143,144,145.2],    volatility: 0.30 },
  { symbol: 'DISB34', name: 'Disney',              price: 55.40,  history: [58,57.5,56,55.5,56.2,55.8,55,55.2,55.3,55.4], volatility: 0.11 },
];

const INITIAL_CRYPTOS: Stock[] = [
  { symbol: 'BTC', name: 'Bitcoin',   price: 500000, history: [480000,500000,490000,510000,530000,550000,520000,510000,530000,500000], volatility: 0.15 },
  { symbol: 'ETH', name: 'Ethereum',  price: 16000,  history: [14000,14500,13800,14200,15000,16000,14800,14500,15000,16000],          volatility: 0.18 },
  { symbol: 'SOL', name: 'Solana',    price: 820,    history: [700,750,850,820,750,780,800,810,815,820],                               volatility: 0.20 },
];

export function createInitialStats(nick: string): GameStats {
  return {
    playerNick: nick,
    devModeUsed: false,
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
    emails: [{
      id: 'welcome-email',
      sender: 'RH - Vida de CLT',
      subject: 'Bem-vindo ao mercado de trabalho!',
      body: 'Olá, trabalhador! Fique atento à sua caixa de entrada para novas oportunidades de emprego.',
      timestamp: Date.now(),
      read: false,
    }],
    stocks: INITIAL_STOCKS,
    cryptos: INITIAL_CRYPTOS,
    portfolio: {},
    unlockedTitles: [],
    equippedTitle: '',
    totalFoodBought: 0,
    hasBoughtStock: false,
    hasBoughtCrypto: false,
    currentHouse: null,
    ownedHousesIds: [],
    perHouseUpgrades: {},
    roomUpgrades: { sala: 0, cozinha: 0, escritorio: 0, armazem: 0 },
    maxComida: 15,
    maxLenha: 15,
    saudeValue: 100,
    doencaAtiva: null,
    humor: 'Normal',
    morale: 50,
    produtividade: 'Normal',
    workPerformance: 50,
    unlockedMechanics: { saude: false, felicidade: false, produtividade: false },
    seenSeasonNotices: [],
    cursoAtivo: null,
    cursosCompletos: [],
    cursoBenefits: { foodDiscount: 0, healthDecayReduction: 0, happinessDecayReduction: 0, jobChanceBonus: 0, productivityBonus: 0 },
  };
}
