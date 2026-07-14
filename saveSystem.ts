import { GameStats, GameEvent } from './types';

// ============================================================
// SISTEMA DE SALVAMENTO LOCAL — "Vida de CLT"
// ============================================================
// - Salva no localStorage do navegador (persiste entre sessões)
// - Checksum simples para detectar corrupção/adulteração de dados
// - Versionamento de schema para permitir migrações futuras
// - Merge defensivo com defaults: saves antigos nunca quebram o jogo
//   quando novos campos são adicionados em atualizações futuras
// - Export/Import em arquivo .json como backup manual de segurança
// ============================================================

const SAVE_KEY = 'vidadeclt_save';
const SAVE_VERSION = 1;

export interface SavePayload {
  version: number;
  savedAt: number;
  checksum: string;
  stats: GameStats;
  events: GameEvent[];
}

// Checksum simples (não-criptográfico) só para detectar corrupção acidental,
// como uma gravação interrompida ou edição manual malformada do localStorage.
function computeChecksum(body: string): string {
  let hash = 0;
  for (let i = 0; i < body.length; i++) {
    const char = body.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // força 32-bit
  }
  return Math.abs(hash).toString(36);
}

function buildPayload(stats: GameStats, events: GameEvent[]): SavePayload {
  const savedAt = Date.now();
  const body = JSON.stringify({ version: SAVE_VERSION, savedAt, stats, events });
  const checksum = computeChecksum(body);
  return { version: SAVE_VERSION, savedAt, checksum, stats, events };
}

function verifyPayload(parsed: any): parsed is SavePayload {
  if (!parsed || typeof parsed !== 'object') return false;
  if (!parsed.stats || typeof parsed.checksum !== 'string') return false;
  const body = JSON.stringify({ version: parsed.version, savedAt: parsed.savedAt, stats: parsed.stats, events: parsed.events });
  const expected = computeChecksum(body);
  return expected === parsed.checksum;
}

// Mescla profunda com defaults: garante que saves antigos (de versões
// anteriores do jogo) nunca quebrem por falta de um campo novo.
function mergeWithDefaults(loaded: any, defaults: GameStats): GameStats {
  const merged: any = { ...defaults, ...loaded };
  merged.roomUpgrades = { ...defaults.roomUpgrades, ...(loaded.roomUpgrades || {}) };
  merged.unlockedMechanics = { ...defaults.unlockedMechanics, ...(loaded.unlockedMechanics || {}) };
  merged.cursoBenefits = { ...defaults.cursoBenefits, ...(loaded.cursoBenefits || {}) };
  merged.perHouseUpgrades = loaded.perHouseUpgrades && typeof loaded.perHouseUpgrades === 'object' ? loaded.perHouseUpgrades : defaults.perHouseUpgrades;
  merged.portfolio = loaded.portfolio && typeof loaded.portfolio === 'object' ? loaded.portfolio : defaults.portfolio;
  merged.stocks = Array.isArray(loaded.stocks) && loaded.stocks.length > 0 ? loaded.stocks : defaults.stocks;
  merged.cryptos = Array.isArray(loaded.cryptos) && loaded.cryptos.length > 0 ? loaded.cryptos : defaults.cryptos;
  merged.unlockedTitles = Array.isArray(loaded.unlockedTitles) ? loaded.unlockedTitles : defaults.unlockedTitles;
  merged.ownedHousesIds = Array.isArray(loaded.ownedHousesIds) ? loaded.ownedHousesIds : defaults.ownedHousesIds;
  merged.cursosCompletos = Array.isArray(loaded.cursosCompletos) ? loaded.cursosCompletos : defaults.cursosCompletos;
  merged.emails = Array.isArray(loaded.emails) ? loaded.emails : defaults.emails;
  merged.vagas = Array.isArray(loaded.vagas) ? loaded.vagas : defaults.vagas;
  if (typeof merged.saudeValue !== 'number') merged.saudeValue = defaults.saudeValue;
  if (typeof merged.morale !== 'number') merged.morale = defaults.morale;
  if (typeof merged.workPerformance !== 'number') merged.workPerformance = defaults.workPerformance;
  return merged as GameStats;
}

/** Salva o estado atual no localStorage. Retorna true se bem-sucedido. */
export function saveGame(stats: GameStats, events: GameEvent[]): boolean {
  try {
    const payload = buildPayload(stats, events);
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('[saveSystem] Falha ao salvar:', err);
    return false;
  }
}

/** Verifica rapidamente se existe um save salvo, sem carregá-lo por completo. */
export function hasSaveGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

/** Remove o save local permanentemente. */
export function deleteSaveGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error('[saveSystem] Falha ao apagar save:', err);
  }
}

export type LoadResult =
  | { status: 'ok'; stats: GameStats; events: GameEvent[]; savedAt: number }
  | { status: 'empty' }
  | { status: 'corrupted' };

/** Carrega o save do localStorage, validando integridade e migrando campos faltantes. */
export function loadGame(defaults: GameStats): LoadResult {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { status: 'empty' };

    const parsed = JSON.parse(raw);
    if (!verifyPayload(parsed)) {
      console.warn('[saveSystem] Save corrompido ou adulterado — ignorando.');
      return { status: 'corrupted' };
    }

    const stats = mergeWithDefaults(parsed.stats, defaults);
    const events = Array.isArray(parsed.events) ? parsed.events : [];
    return { status: 'ok', stats, events, savedAt: parsed.savedAt };
  } catch (err) {
    console.error('[saveSystem] Falha ao carregar save:', err);
    return { status: 'corrupted' };
  }
}

/** Exporta o save atual como um arquivo .json para download (backup manual). */
export function exportSaveToFile(stats: GameStats, events: GameEvent[]): void {
  const payload = buildPayload(stats, events);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const nick = (stats.playerNick || 'jogador').replace(/[^a-zA-Z0-9]/g, '');
  a.href = url;
  a.download = `vida-de-clt-${nick}-mes${stats.mes}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Lê e valida um arquivo .json de save exportado anteriormente. */
export function importSaveFromFile(file: File, defaults: GameStats): Promise<{ stats: GameStats; events: GameEvent[] }> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('O arquivo precisa ser um .json exportado pelo jogo.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!verifyPayload(parsed)) {
          reject(new Error('Arquivo de save inválido ou corrompido.'));
          return;
        }
        const stats = mergeWithDefaults(parsed.stats, defaults);
        const events = Array.isArray(parsed.events) ? parsed.events : [];
        resolve({ stats, events });
      } catch {
        reject(new Error('Não foi possível ler este arquivo como um save válido.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo selecionado.'));
    reader.readAsText(file);
  });
}
