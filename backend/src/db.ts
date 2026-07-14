import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameStats, GameEvent } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const usesPostgres = Boolean(DATABASE_URL);

type PostgresPool = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }>;
};

let postgres: PostgresPool | null = null;
let sqlite: Database.Database | null = null;

const sqliteStatements: {
  insertSession?: Database.Statement;
  getState?: Database.Statement;
  upsertState?: Database.Statement;
  deleteState?: Database.Statement;
  sessionExists?: Database.Statement;
  getAllStates?: Database.Statement;
} = {};

const databaseReady = (async () => {
  if (usesPostgres) {
    // O pacote pg é instalado automaticamente no Render. O import dinâmico
    // permite continuar usando SQLite localmente sem exigir um Postgres local.
    const postgresDriverName = 'pg';
    const { Pool } = await import(postgresDriverName) as any;
    postgres = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    }) as PostgresPool;

    await postgres.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `);
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS game_states (
        token TEXT PRIMARY KEY REFERENCES sessions(token) ON DELETE CASCADE,
        stats JSONB NOT NULL,
        events JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `);
    await postgres.query('CREATE INDEX IF NOT EXISTS idx_game_states_token ON game_states(token)');
    return;
  }

  const databasePath = path.join(__dirname, '../../game.db');
  sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS game_states (
      token      TEXT PRIMARY KEY REFERENCES sessions(token) ON DELETE CASCADE,
      stats      TEXT NOT NULL,
      events     TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_game_states_token ON game_states(token);
  `);

  sqliteStatements.insertSession = sqlite.prepare('INSERT OR IGNORE INTO sessions (token) VALUES (?)');
  sqliteStatements.getState = sqlite.prepare('SELECT stats, events FROM game_states WHERE token = ?');
  sqliteStatements.upsertState = sqlite.prepare(`
    INSERT INTO game_states (token, stats, events, updated_at)
    VALUES (?, ?, ?, unixepoch())
    ON CONFLICT(token) DO UPDATE SET
      stats = excluded.stats,
      events = excluded.events,
      updated_at = excluded.updated_at
  `);
  sqliteStatements.deleteState = sqlite.prepare('DELETE FROM game_states WHERE token = ?');
  sqliteStatements.sessionExists = sqlite.prepare('SELECT 1 FROM sessions WHERE token = ?');
  sqliteStatements.getAllStates = sqlite.prepare('SELECT token, stats, events FROM game_states');
})();

export interface StoredState {
  stats: GameStats;
  events: GameEvent[];
}

export interface LeaderboardEntry {
  token: string;
  nick: string;
  saldo: number;
  mesesJogados: number;
}

function parseJson<T>(value: unknown): T {
  return (typeof value === 'string' ? JSON.parse(value) : value) as T;
}

export async function initializeDatabase(): Promise<void> {
  await databaseReady;
}

export async function createSession(token: string): Promise<void> {
  await databaseReady;
  if (postgres) {
    await postgres.query('INSERT INTO sessions (token) VALUES ($1) ON CONFLICT (token) DO NOTHING', [token]);
    return;
  }
  sqliteStatements.insertSession!.run(token);
}

export async function sessionExists(token: string): Promise<boolean> {
  await databaseReady;
  if (postgres) {
    const result = await postgres.query('SELECT 1 FROM sessions WHERE token = $1', [token]);
    return result.rows.length > 0;
  }
  return Boolean(sqliteStatements.sessionExists!.get(token));
}

export async function loadState(token: string): Promise<StoredState | null> {
  await databaseReady;
  const row = postgres
    ? (await postgres.query('SELECT stats, events FROM game_states WHERE token = $1', [token])).rows[0]
    : sqliteStatements.getState!.get(token) as { stats: string; events: string } | undefined;

  if (!row) return null;
  try {
    return {
      stats: parseJson<GameStats>(row.stats),
      events: parseJson<GameEvent[]>(row.events),
    };
  } catch {
    return null;
  }
}

export async function saveState(token: string, stats: GameStats, events: GameEvent[]): Promise<void> {
  await databaseReady;
  const statsJson = JSON.stringify(stats);
  const eventsJson = JSON.stringify(events);

  if (postgres) {
    await postgres.query(`
      INSERT INTO game_states (token, stats, events, updated_at)
      VALUES ($1, $2::jsonb, $3::jsonb, EXTRACT(EPOCH FROM NOW())::BIGINT)
      ON CONFLICT (token) DO UPDATE SET
        stats = excluded.stats,
        events = excluded.events,
        updated_at = excluded.updated_at
    `, [token, statsJson, eventsJson]);
    return;
  }

  sqliteStatements.upsertState!.run(token, statsJson, eventsJson);
}

export async function deleteState(token: string): Promise<void> {
  await databaseReady;
  if (postgres) {
    await postgres.query('DELETE FROM game_states WHERE token = $1', [token]);
    return;
  }
  sqliteStatements.deleteState!.run(token);
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  await databaseReady;
  const rows = postgres
    ? (await postgres.query('SELECT token, stats, events FROM game_states')).rows
    : sqliteStatements.getAllStates!.all() as Array<{ token: string; stats: string; events: string }>;
  const entries: LeaderboardEntry[] = [];

  for (const row of rows) {
    try {
      const stats = parseJson<GameStats>(row.stats);
      const events = parseJson<GameEvent[]>(row.events);
      const usedDevTools = stats.devModeUsed === true || events.some(event =>
        event.message.includes('ferramentas de desenvolvimento')
      );
      if (usedDevTools) continue;
      if (typeof stats.playerNick !== 'string' || !Number.isFinite(stats.saldo)) continue;

      entries.push({
        token: row.token,
        nick: stats.playerNick,
        saldo: stats.saldo,
        mesesJogados: Number.isFinite(stats.mes) ? stats.mes : 0,
      });
    } catch {
      // Um save inválido não deve impedir a abertura do ranking.
    }
  }

  return entries
    .sort((a, b) =>
      b.saldo - a.saldo ||
      b.mesesJogados - a.mesesJogados ||
      a.nick.localeCompare(b.nick, 'pt-BR')
    )
    .slice(0, Math.max(0, limit));
}
