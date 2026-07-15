import { GameStats, GameEvent } from './types';

// ─────────────────────────────────────────────────────────────
// Configuração
// ─────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/game').replace(/\/$/, '');
const SERVER_BASE = API_BASE.replace(/\/api\/game$/, '');
const TOKEN_KEY = 'vidadeclt_token';

export type GameAction =
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
  | { type: 'ACCEPT_JOB'; offerId: string; perfectInterview: boolean }
  | { type: 'INVEST_DEPOSIT'; amount: number }
  | { type: 'INVEST_WITHDRAW'; amount: number }
  | { type: 'BUY_ASSET'; symbol: string; qty: number; assetType: 'stock' | 'crypto' }
  | { type: 'SELL_ASSET'; symbol: string; qty: number; assetType: 'stock' | 'crypto' }
  | { type: 'EQUIP_TITLE'; titleId: string }
  | { type: 'READ_EMAIL'; emailId: string }
  | { type: 'DELETE_EMAIL'; emailId: string }
  | { type: 'RESET_GAME' };

export interface DispatchResult {
  ok: boolean;
  error?: string;
  stats?: GameStats;
  events?: GameEvent[];
  flags?: {
    mechUnlocked?: 'saude' | 'felicidade' | 'produtividade';
    novaDoenca?: boolean;
    seasonNotice?: 'Primavera' | 'Verão' | 'Outono' | 'Inverno';
    gameOver?: boolean;
    deathReason?: string;
  };
}

export interface LeaderboardEntry {
  nick: string;
  saldo: number;
  mesesJogados: number;
}

// ─────────────────────────────────────────────────────────────
// Token management
// ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

/**
 * Aguarda o servidor e o banco ficarem prontos antes de abrir o save.
 */
export async function waitForServer(onAttempt?: (attempt: number) => void): Promise<boolean> {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    onAttempt?.(attempt);
    const controller = new AbortController();
    // A primeira conexão é mantida tempo suficiente para o Render acordar.
    const requestTimeout = attempt === 1 ? 75_000 : 10_000;
    const timeout = window.setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(`${SERVER_BASE}/ready`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.ok === true) return true;
      }
    } catch {
      // O Render pode recusar algumas tentativas enquanto o servidor inicia.
    } finally {
      window.clearTimeout(timeout);
    }

    if (attempt < maxAttempts) await wait(3_000);
  }

  return false;
}

// ─────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────
async function request(method: string, path: string, body?: object): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({
    ok: false,
    error: `O servidor respondeu com o status ${res.status}.`,
  }));

  if (res.status === 401 || res.status === 404 && path === '/state') {
    clearToken();
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────

/**
 * Cria um novo jogo. Salva o token recebido no localStorage.
 * Retorna o estado inicial ou um erro.
 */
export async function initGame(nick: string): Promise<DispatchResult> {
  try {
    const data = await request('POST', '/init', { nick });
    if (data.ok && data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err) {
    return { ok: false, error: 'Não foi possível conectar ao servidor.' };
  }
}

/**
 * Carrega o estado salvo do servidor.
 * Retorna null se não houver save ou se o token for inválido.
 */
export async function loadGame(): Promise<{ stats: GameStats; events: GameEvent[] } | null> {
  if (!hasToken()) return null;
  try {
    const data = await request('GET', '/state');
    if (!data.ok) return null;
    return { stats: data.stats, events: data.events };
  } catch {
    return null;
  }
}

/** Carrega os dez maiores saldos globais, sem expor dados internos das partidas. */
export async function loadLeaderboard(): Promise<{ ok: boolean; leaderboard?: LeaderboardEntry[]; error?: string }> {
  try {
    return await request('GET', '/leaderboard');
  } catch {
    return { ok: false, error: 'Não foi possível carregar o ranking agora.' };
  }
}

/**
 * Envia uma ação para o servidor, que valida, aplica e retorna o novo estado.
 * Esta é a função central — substitui todos os setStats locais.
 */
export async function dispatch(action: GameAction): Promise<DispatchResult> {
  try {
    const data = await request('POST', '/action', action);
    return data;
  } catch (err) {
    return { ok: false, error: 'Erro de conexão. Verifique sua internet.' };
  }
}

/** Confirma o salvamento atual que já está armazenado no servidor. */
export async function saveGame(): Promise<DispatchResult> {
  try {
    return await request('POST', '/save');
  } catch {
    return { ok: false, error: 'Não foi possível salvar agora.' };
  }
}

/**
 * Apaga o save do servidor. Chame antes de mostrar o modal de novo nick.
 */
export async function deleteSave(): Promise<void> {
  try {
    await request('DELETE', '/save');
  } catch {
    // Falha silenciosa — o token é local de qualquer forma
  }
  clearToken();
}
