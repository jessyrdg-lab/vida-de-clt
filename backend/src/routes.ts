import { Router, Request, Response, RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { createSession, sessionExists, loadState, saveState, deleteState, getLeaderboard } from './db.js';
import { createInitialStats } from './constants.js';
import { applyPassMonth, applyAction } from './gameLogic.js';
import { GameAction, GameEvent, GameStats } from './types.js';

const router = Router();

const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req, res).catch(next);
};

// ── Helper: extrai e valida o token do header ─────────────────
function getToken(req: Request): string | null {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token.length === 36 ? token : null; // UUID tem 36 chars
}

async function reconcileGlobalPlayerTitle(token: string, stats: GameStats, events: GameEvent[]): Promise<boolean> {
  const isTopTen = stats.devModeUsed !== true && (await getLeaderboard(10)).some(entry => entry.token === token);
  const hasTitle = stats.unlockedTitles.includes('GlobalPlayer');

  if (isTopTen && !hasTitle) {
    stats.unlockedTitles.push('GlobalPlayer');
    events.push({
      id: randomUUID(),
      timestamp: Date.now(),
      message: '🏆 Título desbloqueado: Global Player! Você entrou no Top 10 global.',
      type: 'career',
    });
    return true;
  }

  if (!isTopTen && hasTitle) {
    stats.unlockedTitles = stats.unlockedTitles.filter(title => title !== 'GlobalPlayer');
    if (stats.equippedTitle === 'GlobalPlayer') stats.equippedTitle = '';
    return true;
  }

  return false;
}

async function saveStateWithRanking(token: string, stats: GameStats, events: GameEvent[]): Promise<void> {
  await saveState(token, stats, events);
  if (await reconcileGlobalPlayerTitle(token, stats, events)) {
    await saveState(token, stats, events);
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/game/init
// Cria uma nova sessão (novo jogo) ou retorna o estado existente
// Body: { nick: string }
// ─────────────────────────────────────────────────────────────
router.post('/init', asyncRoute(async (req: Request, res: Response) => {
  const { nick } = req.body as { nick?: string };

  if (!nick || typeof nick !== 'string') {
    return res.status(400).json({ ok: false, error: 'Nick obrigatório.' });
  }

  const trimmed = nick.trim();
  const BANNED  = ['admin','moderador','suporte','root','puta','viado','caralho','merda','porra','buceta','cu','piroca','pica','vagina','gay','corno'];
  const valid   = /^[a-zA-Z0-9]{4,15}$/.test(trimmed);
  const banned  = BANNED.some(b => trimmed.toLowerCase().includes(b));

  if (!valid)  return res.status(400).json({ ok: false, error: 'Nick inválido (4–15 caracteres, sem espaços).' });
  if (banned)  return res.status(400).json({ ok: false, error: 'Nick não permitido.' });

  const token = randomUUID();
  await createSession(token);

  const stats  = createInitialStats(trimmed);
  const events = [{ id: randomUUID(), timestamp: Date.now(), message: `Bem-vindo, ${trimmed}! Sua jornada CLT começa agora.`, type: 'neutral' as const }];

  await saveStateWithRanking(token, stats, events);

  return res.json({ ok: true, token, stats, events });
}));

// ─────────────────────────────────────────────────────────────
// GET /api/game/state
// Retorna o estado atual do jogo para o token informado
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
router.get('/state', asyncRoute(async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ ok: false, error: 'Token inválido.' });
  if (!await sessionExists(token)) return res.status(404).json({ ok: false, error: 'Sessão não encontrada.' });

  const state = await loadState(token);
  if (!state) return res.status(404).json({ ok: false, error: 'Estado não encontrado.' });

  if (await reconcileGlobalPlayerTitle(token, state.stats, state.events)) {
    await saveState(token, state.stats, state.events);
  }

  return res.json({ ok: true, stats: state.stats, events: state.events });
}));

// GET /api/game/leaderboard
// Retorna somente os dez jogadores elegíveis com os maiores saldos.
router.get('/leaderboard', asyncRoute(async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ ok: false, error: 'Token inválido.' });
  if (!await sessionExists(token)) return res.status(404).json({ ok: false, error: 'Sessão não encontrada.' });

  const state = await loadState(token);
  if (state && await reconcileGlobalPlayerTitle(token, state.stats, state.events)) {
    await saveState(token, state.stats, state.events);
  }

  const leaderboard = (await getLeaderboard(10)).map(({ nick, saldo, mesesJogados }) => ({
    nick,
    saldo,
    mesesJogados,
  }));

  return res.json({ ok: true, leaderboard });
}));

// ─────────────────────────────────────────────────────────────
// POST /api/game/action
// Processa uma ação do jogador e retorna o novo estado
// Header: Authorization: Bearer <token>
// Body: { type: string, ...params }
// ─────────────────────────────────────────────────────────────
router.post('/action', asyncRoute(async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ ok: false, error: 'Token inválido.' });
  if (!await sessionExists(token)) return res.status(404).json({ ok: false, error: 'Sessão não encontrada.' });

  const action = req.body as GameAction;
  if (!action || !action.type) {
    return res.status(400).json({ ok: false, error: 'Ação inválida.' });
  }

  // Carrega estado atual — imutável até a ação ser validada e aplicada
  const stored = await loadState(token);
  if (!stored) return res.status(404).json({ ok: false, error: 'Estado não encontrado.' });

  // Deep-copy para que a lógica possa mutar sem corromper o estado salvo
  const stats  = JSON.parse(JSON.stringify(stored.stats));
  const events = [...stored.events];

  // ── PASS_MONTH ───────────────────────────────────────────
  if (action.type === 'PASS_MONTH') {
    const { flags, gameOver, deathReason } = applyPassMonth(stats, events);
    await saveStateWithRanking(token, stats, events);
    return res.json({ ok: true, stats, events, flags: { ...flags, gameOver, deathReason: deathReason || undefined } });
  }

  // ── RESET_GAME ───────────────────────────────────────────
  if (action.type === 'RESET_GAME') {
    await deleteState(token);
    // Mantém o token válido mas limpa o estado; frontend pode chamar /init de novo
    return res.json({ ok: true });
  }

  // ── Todas as outras ações ────────────────────────────────
  const result = applyAction(action as any, stats, events);
  if (!result.ok) return res.status(422).json({ ok: false, error: result.error });

  await saveStateWithRanking(token, result.stats!, result.events!);
  return res.json({ ok: true, stats: result.stats, events: result.events, flags: result.flags });
}));

// ─────────────────────────────────────────────────────────────
// POST /api/game/save
// Confirma e renova o salvamento atual sem aceitar valores do cliente
// ─────────────────────────────────────────────────────────────
router.post('/save', asyncRoute(async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ ok: false, error: 'Token inválido.' });
  if (!await sessionExists(token)) return res.status(404).json({ ok: false, error: 'Sessão não encontrada.' });

  const state = await loadState(token);
  if (!state) return res.status(404).json({ ok: false, error: 'Estado não encontrado.' });

  await saveStateWithRanking(token, state.stats, state.events);
  return res.json({ ok: true, stats: state.stats, events: state.events });
}));

// ─────────────────────────────────────────────────────────────
// DELETE /api/game/save
// Apaga o save do jogador (reiniciar do zero)
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
router.delete('/save', asyncRoute(async (req: Request, res: Response) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ ok: false, error: 'Token inválido.' });
  if (!await sessionExists(token)) return res.status(404).json({ ok: false, error: 'Sessão não encontrada.' });

  await deleteState(token);
  return res.json({ ok: true });
}));

export default router;
