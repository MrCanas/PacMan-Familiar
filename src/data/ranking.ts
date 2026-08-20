import { PELLET_VALUE } from '@/game/constants';
import type { Difficulty } from '@/game/difficulty';

/**
 * Ranking compartido, contra Supabase por REST y con `fetch` pelado: el
 * proyecto no tiene ni una dependencia en tiempo de ejecución y esto no iba a
 * ser la primera.
 *
 * Sin las variables de entorno configuradas el ranking no existe: ni pantalla
 * ni botón. Ver `.env.example` y `supabase/schema.sql`.
 */

/** Puntos extra por completar el tablero. */
export const WIN_BONUS = 500;
/** Bonus máximo por rapidez, que se va gastando a 10 puntos por segundo. */
export const SPEED_BONUS_MAX = 2000;
const SPEED_BONUS_PER_SECOND = 10;

const OUTBOX_KEY = 'pacman-familiar.pendingResults';
const MAX_OUTBOX = 40;

export type MatchResult = {
  familyId: string;
  characterId: string;
  characterName: string;
  scenarioId: string;
  difficulty: Difficulty;
  pellets: number;
  score: number;
  won: boolean;
  durationMs: number;
};

export type RankingRow = {
  characterId: string;
  characterName: string;
  familyId: string;
  totalPellets: number;
  bestScore: number;
  matches: number;
  wins: number;
};

/**
 * Puntuación de una partida.
 *
 * Si los puntos fueran sólo `comidos × 10`, «quién más come» y «quién más
 * puntos saca» serían la misma lista y sobraría uno de los dos rankings. El
 * premio por ganar y el de rapidez son lo que los separa: se puede comer
 * muchísimo a lo largo de muchas partidas sin ganar ninguna.
 */
export function computeScore(match: { pellets: number; won: boolean; durationMs: number }): number {
  let score = Math.max(0, Math.round(match.pellets)) * PELLET_VALUE;
  if (match.won) {
    score += WIN_BONUS;
    const seconds = Math.max(0, match.durationMs) / 1000;
    score += Math.max(0, Math.round(SPEED_BONUS_MAX - seconds * SPEED_BONUS_PER_SECOND));
  }
  return score;
}

export type RankingConfig = { url: string; anonKey: string };

export function readConfig(env: ImportMetaEnv = import.meta.env): RankingConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  // El ejemplo de .env.example no vale como configuración real.
  if (url.includes('tu-proyecto') || anonKey.includes('tu-anon-key')) return null;
  return { url: url.replace(/\/+$/, ''), anonKey };
}

export function isRankingEnabled(env: ImportMetaEnv = import.meta.env): boolean {
  return readConfig(env) !== null;
}

/** Fila tal y como la devuelve la vista `ranking` de Supabase. */
type RemoteRow = {
  character_id: string;
  character_name: string;
  family_id: string;
  total_pellets: number;
  best_score: number;
  matches: number;
  wins: number;
};

function toRow(remote: RemoteRow): RankingRow {
  return {
    characterId: remote.character_id,
    characterName: remote.character_name,
    familyId: remote.family_id,
    totalPellets: Number(remote.total_pellets) || 0,
    bestScore: Number(remote.best_score) || 0,
    matches: Number(remote.matches) || 0,
    wins: Number(remote.wins) || 0,
  };
}

function toPayload(match: MatchResult): Record<string, unknown> {
  return {
    family_id: match.familyId,
    character_id: match.characterId,
    character_name: match.characterName,
    scenario_id: match.scenarioId,
    difficulty: match.difficulty,
    pellets: Math.round(match.pellets),
    score: Math.round(match.score),
    won: match.won,
    duration_ms: Math.round(match.durationMs),
  };
}

/** Quién es el que más come: puntos comidos sumando todas sus partidas. */
export function topEaters(rows: RankingRow[], limit = 5): RankingRow[] {
  return [...rows].sort((a, b) => b.totalPellets - a.totalPellets).slice(0, limit);
}

/** Quién saca más puntos: su mejor partida. */
export function topScorers(rows: RankingRow[], limit = 5): RankingRow[] {
  return [...rows].sort((a, b) => b.bestScore - a.bestScore).slice(0, limit);
}

export type RankingClientOptions = {
  config: RankingConfig;
  fetchImpl?: typeof fetch;
  storage?: Storage;
};

export class RankingClient {
  private readonly config: RankingConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly storage: Storage | null;

  constructor(options: RankingClientOptions) {
    this.config = options.config;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.storage = options.storage ?? (typeof localStorage === 'undefined' ? null : localStorage);
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.config.anonKey,
      Authorization: `Bearer ${this.config.anonKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  /** Partidas que no se pudieron enviar todavía (jardín sin cobertura). */
  readOutbox(): MatchResult[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(OUTBOX_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as MatchResult[]) : [];
    } catch {
      return [];
    }
  }

  private writeOutbox(items: MatchResult[]): void {
    if (!this.storage) return;
    try {
      if (items.length === 0) this.storage.removeItem(OUTBOX_KEY);
      // Se quedan las más recientes: mejor perder una partida vieja que
      // llenar el almacenamiento del móvil.
      else this.storage.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-MAX_OUTBOX)));
    } catch {
      /* sin almacenamiento se juega igual, sólo que sin cola */
    }
  }

  private enqueue(match: MatchResult): void {
    this.writeOutbox([...this.readOutbox(), match]);
  }

  private async post(matches: MatchResult[]): Promise<boolean> {
    if (matches.length === 0) return true;
    try {
      const response = await this.fetchImpl(`${this.config.url}/rest/v1/match_results`, {
        method: 'POST',
        headers: this.headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(matches.map(toPayload)),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Envía la partida. Si no hay red se guarda en la cola y se reintenta en el
   * siguiente envío o al arrancar. Devuelve si llegó al servidor.
   */
  async submit(match: MatchResult): Promise<boolean> {
    const pending = this.readOutbox();
    const ok = await this.post([...pending, match]);
    if (ok) {
      this.writeOutbox([]);
      return true;
    }
    this.enqueue(match);
    return false;
  }

  /** Reintenta lo que quedó pendiente. Se llama al arrancar. */
  async flushOutbox(): Promise<boolean> {
    const pending = this.readOutbox();
    if (pending.length === 0) return true;
    const ok = await this.post(pending);
    if (ok) this.writeOutbox([]);
    return ok;
  }

  async fetchRanking(): Promise<RankingRow[]> {
    const response = await this.fetchImpl(`${this.config.url}/rest/v1/ranking?select=*`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error(`El ranking respondió ${response.status}`);
    }
    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return [];
    return (rows as RemoteRow[]).map(toRow);
  }
}

/** Cliente del entorno, o `null` si no hay claves configuradas. */
export function createRankingClient(env: ImportMetaEnv = import.meta.env): RankingClient | null {
  const config = readConfig(env);
  return config ? new RankingClient({ config }) : null;
}
