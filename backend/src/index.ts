import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import gameRouter from './routes.js';
import { initializeDatabase } from './db.js';

const app  = express();
const PORT = process.env.PORT || 3001;
let databaseStatus: 'starting' | 'ready' | 'error' = 'starting';

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = new Set([
  ...(process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000').split(','),
  'https://vidadeclt.com.br',
  'https://www.vidadeclt.com.br',
  'http://vidadeclt.com.br',
  'http://www.vidadeclt.com.br',
  'https://jessyrdg-lab.github.io',
].map(origin => origin.trim().replace(/\/$/, '')).filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem não autorizada.'));
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: '64kb' })); // Limita tamanho do body

// ── Rate limiting ─────────────────────────────────────────────
// Global: folga suficiente para uma sessão ativa, mantendo proteção contra abuso.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Muitas requisições. Aguarde alguns minutos.' },
});

// Por ação: impede automação agressiva sem bloquear cliques legítimos.
const actionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Muitas ações por minuto. Calma aí!' },
});

app.use(globalLimiter);
app.use('/api/game/action', actionLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/game', gameRouter);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: Math.floor(process.uptime()), database: databaseStatus });
});

// O frontend espera este endpoint antes de carregar o save.
app.get('/ready', (_req, res) => {
  if (databaseStatus === 'ready') {
    return res.json({ ok: true });
  }
  return res.status(503).json({ ok: false, database: databaseStatus });
});

// ── 404 catch-all ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Rota não encontrada.' });
});

// Erros inesperados retornam JSON, evitando que o frontend confunda a resposta.
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Vida de CLT Backend]', error);
  res.status(500).json({ ok: false, error: 'O servidor encontrou um erro. Tente novamente.' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Vida de CLT Backend] Rodando na porta ${PORT}`);
  console.log(`[Vida de CLT Backend] Banco: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite local'}`);
});

async function keepDatabaseConnected(): Promise<void> {
  databaseStatus = 'starting';
  try {
    await initializeDatabase();
    databaseStatus = 'ready';
    console.log('[Vida de CLT Backend] Banco pronto.');
  } catch (error) {
    databaseStatus = 'error';
    console.error('[Vida de CLT Backend] Falha ao iniciar o banco:', error);
    console.warn('[Vida de CLT Backend] Uma nova tentativa será feita em 30 segundos.');
    setTimeout(() => void keepDatabaseConnected(), 30_000);
  }
}

void keepDatabaseConnected();
