import type { Difficulty } from '@/game/difficulty';

const PREFIX = 'pacman-familiar.';

const K_FAMILY = `${PREFIX}familyId`;
const K_PROTAGONIST = `${PREFIX}protagonistId`;
const K_GHOST_IDS = `${PREFIX}ghostIds`;
/** Clave de versiones anteriores: solo guardaba *cuantos* fantasmas. */
const K_GHOST_COUNT = `${PREFIX}ghostCount`;
const K_SCENARIO = `${PREFIX}scenarioId`;
const K_DIFFICULTY = `${PREFIX}difficulty`;
const K_HIGH_SCORE = `${PREFIX}highScore`;

export const MIN_GHOSTS = 1;
export const MAX_GHOSTS = 4;

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export type StoredPrefs = {
  familyId: string | null;
  protagonistId: string | null;
  ghostIds: string[] | null;
  /** Solo presente al migrar desde una version antigua; ver `Game`. */
  legacyGhostCount: number | null;
  scenarioId: string | null;
  difficulty: Difficulty | null;
  highScore: number;
};

function readNumber(raw: string | null, fallback: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function readString(raw: string | null): string | null {
  return raw && raw.length ? raw : null;
}

function readGhostIds(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (ids.length < MIN_GHOSTS || ids.length > MAX_GHOSTS) return null;
    return ids;
  } catch {
    return null;
  }
}

function readGhostCount(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= MIN_GHOSTS && n <= MAX_GHOSTS ? n : null;
}

function readDifficulty(raw: string | null): Difficulty | null {
  return DIFFICULTIES.find((d) => d === raw) ?? null;
}

export function loadPrefs(storage: Storage = localStorage): StoredPrefs {
  try {
    return {
      familyId: readString(storage.getItem(K_FAMILY)),
      protagonistId: readString(storage.getItem(K_PROTAGONIST)),
      ghostIds: readGhostIds(storage.getItem(K_GHOST_IDS)),
      legacyGhostCount: readGhostCount(storage.getItem(K_GHOST_COUNT)),
      scenarioId: readString(storage.getItem(K_SCENARIO)),
      difficulty: readDifficulty(storage.getItem(K_DIFFICULTY)),
      highScore: readNumber(storage.getItem(K_HIGH_SCORE), 0),
    };
  } catch {
    return {
      familyId: null,
      protagonistId: null,
      ghostIds: null,
      legacyGhostCount: null,
      scenarioId: null,
      difficulty: null,
      highScore: 0,
    };
  }
}

function write(storage: Storage, key: string, value: string | null): void {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    /* modo privado de Safari y similares: preferimos jugar sin recordar */
  }
}

export function saveFamilyId(storage: Storage, id: string | null): void {
  write(storage, K_FAMILY, id);
}

export function saveProtagonistId(storage: Storage, id: string | null): void {
  write(storage, K_PROTAGONIST, id);
}

export function saveGhostIds(storage: Storage, ids: string[] | null): void {
  write(storage, K_GHOST_IDS, ids && ids.length ? JSON.stringify(ids) : null);
  // Una vez guardados los ids concretos, la clave antigua ya no dice nada.
  write(storage, K_GHOST_COUNT, null);
}

export function saveScenarioId(storage: Storage, id: string | null): void {
  write(storage, K_SCENARIO, id);
}

export function saveDifficulty(storage: Storage, difficulty: Difficulty | null): void {
  write(storage, K_DIFFICULTY, difficulty);
}

export function saveHighScore(storage: Storage, score: number): void {
  write(storage, K_HIGH_SCORE, String(score));
}

export function updateHighScoreIfNeeded(
  storage: Storage,
  candidate: number,
  currentHigh: number
): number {
  if (candidate > currentHigh) {
    saveHighScore(storage, candidate);
    return candidate;
  }
  return currentHigh;
}
