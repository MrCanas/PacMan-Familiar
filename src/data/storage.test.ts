import { describe, expect, it } from 'vitest';

import {
  loadPrefs,
  saveGhostCount,
  saveHighScore,
  saveProtagonistId,
  updateHighScoreIfNeeded,
} from '@/data/storage';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  } as Storage;
}

describe('storage', () => {
  it('guardar y leer �ltima selecci�n', () => {
    const s = memoryStorage();
    saveProtagonistId(s, 'maria');
    saveGhostCount(s, 2);
    const prefs = loadPrefs(s);
    expect(prefs.protagonistId).toBe('maria');
    expect(prefs.ghostCount).toBe(2);
  });

  it('high score solo sube si el candidato es mayor', () => {
    const s = memoryStorage();
    saveHighScore(s, 100);
    const next = updateHighScoreIfNeeded(s, 50, 100);
    expect(next).toBe(100);
    const next2 = updateHighScoreIfNeeded(s, 200, 100);
    expect(next2).toBe(200);
  });

  it('datos corruptos no rompen loadPrefs', () => {
    const s = memoryStorage();
    s.setItem('pacman-familiar.highScore', 'no-es-numero');
    const prefs = loadPrefs(s);
    expect(prefs.highScore).toBe(0);
  });
});
