import type Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameStats, GameEvent } from './types.js';
import { COMPANY_DEFINITIONS } from './companies.js';
import { ARTIFACT_DEFINITIONS, MAX_ARTIFACT_LEVEL, MAX_EQUIPPED_ARTIFACTS } from './artifacts.js';
import { GOD_REQUIRED_TITLE_IDS } from './constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const usesPostgres = Boolean(DATABASE_URL);
const MAX_STORED_EVENTS = 200;
export const MIN_LEADERBOARD_BALANCE = 1_000_000;

type PostgresPool = {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: any[] }>;
};

let postgres: PostgresPool | null = null;
let sqlite: Database.Database | null = null;
let databaseInitialization: Promise<void> | null = null;

const sqliteStatements: {
  insertSession?: Database.Statement;
  getState?: Database.Statement;
  upsertState?: Database.Statement;
  deleteState?: Database.Statement;
  sessionExists?: Database.Statement;
  getAllStates?: Database.Statement;
} = {};

async function setupDatabase(): Promise<void> {
  if (usesPostgres) {
    // O pacote pg é instalado automaticamente no Render. O import dinâmico
    // permite continuar usando SQLite localmente sem exigir um Postgres local.
    const postgresDriverName = 'pg';
    const { Pool } = await import(postgresDriverName) as any;
    if (!postgres) {
      postgres = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 15_000,
      }) as PostgresPool;
    }

    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
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
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        const retryDelay = Math.min(1_000 * (2 ** (attempt - 1)), 15_000);
        console.warn(`[Vida de CLT Backend] Banco indisponível (tentativa ${attempt}/${maxAttempts}). Nova tentativa em ${retryDelay / 1000}s.`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  if (!sqlite) {
    const { default: SqliteDatabase } = await import('better-sqlite3');
    const databasePath = path.join(__dirname, '../../game.db');
    sqlite = new SqliteDatabase(databasePath);
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
  }
}

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

function normalizeStats(stats: GameStats): GameStats {
  stats.unlockedTitles = Array.from(new Set(Array.isArray(stats.unlockedTitles) ? stats.unlockedTitles : []));
  if (!GOD_REQUIRED_TITLE_IDS.every(title => stats.unlockedTitles.includes(title))) {
    stats.unlockedTitles = stats.unlockedTitles.filter(title => title !== 'GOD');
    if (stats.equippedTitle === 'GOD') stats.equippedTitle = '';
  }
  stats.retirementCount = Math.max(0, Math.min(10, Math.floor(Number(stats.retirementCount) || 0)));
  const artifactDefinitions = new Map(ARTIFACT_DEFINITIONS.map(artifact => [artifact.id, artifact]));
  const knownArtifactIds = new Set(artifactDefinitions.keys());
  const legacyArtifactIds: Record<string, string> = {
    'cracha-dourado': 'holerite-rubi',
    'marmita-reforcada': 'cartao-beneficios',
    'machado-nordico': 'seguro-bolso',
    'cofrinho-vintage': 'cofre-dividendos',
    'capacete-seguranca': 'blindagem-patrimonial',
    'cafe-premium': 'medalha-desempenho',
    'trevo-rh': 'agenda-oportunidades',
    'pasta-executiva': 'pasta-contratos',
    'extintor-crise': 'extintor-corporativo',
    'relogio-ponto': 'selo-franquia',
    'agenda-equilibrio': 'manual-retencao',
    'coroa-empreendedor': 'holding-dourada',
  };
  const rawArtifactLevels = stats.artifactLevels && typeof stats.artifactLevels === 'object' ? stats.artifactLevels : {};
  stats.artifactLevels = Object.fromEntries(
    Object.entries(rawArtifactLevels)
      .map(([artifactId, level]) => [legacyArtifactIds[artifactId] ?? artifactId, level] as const)
      .filter(([artifactId]) => knownArtifactIds.has(artifactId))
      .map(([artifactId, level]) => {
        const maxLevel = artifactDefinitions.get(artifactId)?.rarity === 'Divinity' ? 1 : MAX_ARTIFACT_LEVEL;
        return [artifactId, Math.max(1, Math.min(maxLevel, Math.floor(Number(level) || 1)))];
      })
  );
  stats.equippedArtifacts = Array.from(new Set((Array.isArray(stats.equippedArtifacts) ? stats.equippedArtifacts : []).map(artifactId => legacyArtifactIds[artifactId] ?? artifactId)))
    .filter(artifactId => knownArtifactIds.has(artifactId) && stats.artifactLevels[artifactId] > 0)
    .slice(0, MAX_EQUIPPED_ARTIFACTS);
  const rawArtifactBoxes: unknown = stats.artifactBoxes;
  const legacyBasicBoxes = typeof rawArtifactBoxes === 'number' ? rawArtifactBoxes : 0;
  const boxRecord = rawArtifactBoxes && typeof rawArtifactBoxes === 'object' ? rawArtifactBoxes as Record<string, unknown> : {};
  stats.artifactBoxes = {
    basic: Math.max(0, Math.min(1_000, Math.floor(Number(boxRecord.basic ?? legacyBasicBoxes) || 0))),
    premium: Math.max(0, Math.min(1_000, Math.floor(Number(boxRecord.premium) || 0))),
    elite: Math.max(0, Math.min(1_000, Math.floor(Number(boxRecord.elite) || 0))),
  };
  stats.artifactBoxesOpened = Math.max(0, Math.floor(Number(stats.artifactBoxesOpened) || 0));
  const knownCompanyIds = new Set(COMPANY_DEFINITIONS.map(company => company.id));
  stats.companies = Array.isArray(stats.companies)
    ? stats.companies
        .filter(company => company && knownCompanyIds.has(company.id))
        .map(company => ({
          id: company.id,
          level: Math.max(1, Math.min(5, Math.floor(Number(company.level) || 1))),
          employees: Math.max(0, Math.floor(Number(company.employees) || 0)),
          strategy: ['safe', 'balanced', 'aggressive'].includes(company.strategy) ? company.strategy : 'balanced',
        }))
    : [];
  if (typeof stats.gameOver !== 'boolean') {
    let legacyDeathReason = '';
    if (stats.comida <= 0) {
      legacyDeathReason = 'FOME: Seu estoque de comida acabou.';
    } else if (stats.unlockedMechanics?.saude && stats.saudeValue <= 0) {
      legacyDeathReason = 'COLAPSO DE SAÚDE: Seu corpo não resistiu.';
    } else if (stats.mesesEmAtraso >= 15) {
      legacyDeathReason = 'COLAPSO FINANCEIRO: Seus juros atingiram 80%.';
    }
    stats.gameOver = legacyDeathReason !== '';
    stats.deathReason = legacyDeathReason;
  } else if (typeof stats.deathReason !== 'string') {
    stats.deathReason = '';
  }
  return stats;
}

export async function initializeDatabase(): Promise<void> {
  if (!databaseInitialization) {
    databaseInitialization = setupDatabase().catch(error => {
      databaseInitialization = null;
      throw error;
    });
  }
  await databaseInitialization;
}

export async function createSession(token: string): Promise<void> {
  await initializeDatabase();
  if (postgres) {
    await postgres.query('INSERT INTO sessions (token) VALUES ($1) ON CONFLICT (token) DO NOTHING', [token]);
    return;
  }
  sqliteStatements.insertSession!.run(token);
}

export async function sessionExists(token: string): Promise<boolean> {
  await initializeDatabase();
  if (postgres) {
    const result = await postgres.query('SELECT 1 FROM sessions WHERE token = $1', [token]);
    return result.rows.length > 0;
  }
  return Boolean(sqliteStatements.sessionExists!.get(token));
}

export async function loadState(token: string): Promise<StoredState | null> {
  await initializeDatabase();
  const row = postgres
    ? (await postgres.query(`
        SELECT stats,
          COALESCE((
            SELECT jsonb_agg(entry.item ORDER BY entry.ordinality)
            FROM jsonb_array_elements(game_states.events) WITH ORDINALITY AS entry(item, ordinality)
            WHERE entry.ordinality > GREATEST(jsonb_array_length(game_states.events) - $2, 0)
          ), '[]'::jsonb) AS events
        FROM game_states
        WHERE token = $1
      `, [token, MAX_STORED_EVENTS])).rows[0]
    : sqliteStatements.getState!.get(token) as { stats: string; events: string } | undefined;

  if (!row) return null;
  try {
    return {
      stats: normalizeStats(parseJson<GameStats>(row.stats)),
      events: parseJson<GameEvent[]>(row.events),
    };
  } catch {
    return null;
  }
}

export async function saveState(token: string, stats: GameStats, events: GameEvent[]): Promise<void> {
  await initializeDatabase();
  const statsJson = JSON.stringify(stats);
  const eventsJson = JSON.stringify(events.slice(-MAX_STORED_EVENTS));

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
  await initializeDatabase();
  if (postgres) {
    await postgres.query('DELETE FROM game_states WHERE token = $1', [token]);
    return;
  }
  sqliteStatements.deleteState!.run(token);
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  await initializeDatabase();
  const safeLimit = Math.max(0, Math.floor(limit));

  if (postgres) {
    const rows = (await postgres.query(`
      SELECT
        token,
        stats->>'playerNick' AS nick,
        (stats->>'saldo')::double precision AS saldo,
        COALESCE((stats->>'mes')::integer, 0) AS meses_jogados
      FROM game_states
      WHERE COALESCE((stats->>'devModeUsed')::boolean, false) = false
        AND stats ? 'playerNick'
        AND stats ? 'saldo'
        AND (stats->>'saldo')::double precision >= $2
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(events) AS event_item(item)
          WHERE event_item.item->>'message' LIKE '%ferramentas de desenvolvimento%'
        )
      ORDER BY
        (stats->>'saldo')::double precision DESC,
        COALESCE((stats->>'mes')::integer, 0) DESC,
        stats->>'playerNick' ASC
      LIMIT $1
    `, [safeLimit, MIN_LEADERBOARD_BALANCE])).rows;

    return rows.map(row => ({
      token: String(row.token),
      nick: String(row.nick),
      saldo: Number(row.saldo),
      mesesJogados: Number(row.meses_jogados),
    }));
  }

  const rows = sqliteStatements.getAllStates!.all() as Array<{ token: string; stats: string; events: string }>;
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
      if (stats.saldo < MIN_LEADERBOARD_BALANCE) continue;

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
    .slice(0, safeLimit);
}
