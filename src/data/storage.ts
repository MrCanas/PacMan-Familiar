const PREFIX = 'pacman-familiar.';

const K_PROTAGONIST = `${PREFIX}protagonistId`;
const K_GHOST_COUNT = `${PREFIX}ghostCount`;
const K_HIGH_SCORE = `${PREFIX}highScore`;

export type StoredPrefs = {
  protagonistId: string | null;
  ghostCount: number | null;
  highScore: number;
};

function readNumber(raw: string | null, fallback: number): number {
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function loadPrefs(storage: Storage = localStorage): StoredPrefs {
  try {
    const protagonistId = storage.getItem(K_PROTAGONIST);
    const ghostRaw = storage.getItem(K_GHOST_COUNT);
    const highRaw = storage.getItem(K_HIGH_SCORE);
    let ghostCount: number | null = null;
    if (ghostRaw !== null) {
      const n = Number(ghostRaw);
      ghostCount = Number.isFinite(n) && n >= 1 && n <= 4 ? n : null;
    }
    return {
      protagonistId: protagonistId && protagonistId.length ? protagonistId : null,
      ghostCount,
      highScore: readNumber(highRaw, 0),
    };
  } catch {
    return { protagonistId: null, ghostCount: null, highScore: 0 };
  }
}

export function saveProtagonistId(storage: Storage, id: string | null): void {
  try {
    if (id) storage.setItem(K_PROTAGONIST, id);
    else storage.removeItem(K_PROTAGONIST);
  } catch {
    /* ignore */
  }
}

export function saveGhostCount(storage: Storage, count: number | null): void {
  try {
    if (count !== null) storage.setItem(K_GHOST_COUNT, String(count));
    else storage.removeItem(K_GHOST_COUNT);
  } catch {
    /* ignore */
  }
}

export function saveHighScore(storage: Storage, score: number): void {
  try {
    storage.setItem(K_HIGH_SCORE, String(score));
  } catch {
    /* ignore */
  }
}

export function updateHighScoreIfNeeded(storage: Storage, candidate: number, currentHigh: number): number {
  if (candidate > currentHigh) {
    saveHighScore(storage, candidate);
    return candidate;
  }
  return currentHigh;
}
