import { describe, expect, it } from 'vitest';

import {
  loadPrefs,
  saveDifficulty,
  saveFamilyId,
  saveGhostIds,
  saveHighScore,
  saveProtagonistId,
  saveScenarioId,
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
  it('guardar y leer última selección', () => {
    const s = memoryStorage();
    saveFamilyId(s, 'valverde');
    saveProtagonistId(s, 'abuela');
    saveGhostIds(s, ['papa', 'mateo']);
    saveScenarioId(s, 'patio');
    saveDifficulty(s, 'hard');

    const prefs = loadPrefs(s);
    expect(prefs.familyId).toBe('valverde');
    expect(prefs.protagonistId).toBe('abuela');
    expect(prefs.ghostIds).toEqual(['papa', 'mateo']);
    expect(prefs.scenarioId).toBe('patio');
    expect(prefs.difficulty).toBe('hard');
  });

  it('high score solo sube si el candidato es mayor', () => {
    const s = memoryStorage();
    saveHighScore(s, 100);
    expect(updateHighScoreIfNeeded(s, 50, 100)).toBe(100);
    expect(updateHighScoreIfNeeded(s, 200, 100)).toBe(200);
  });

  it('datos corruptos no rompen loadPrefs', () => {
    const s = memoryStorage();
    s.setItem('pacman-familiar.highScore', 'no-es-numero');
    s.setItem('pacman-familiar.ghostIds', '{esto no es json}');
    s.setItem('pacman-familiar.difficulty', 'imposible');
    const prefs = loadPrefs(s);
    expect(prefs.highScore).toBe(0);
    expect(prefs.ghostIds).toBeNull();
    expect(prefs.difficulty).toBeNull();
  });

  it('rechaza listas de fantasmas fuera de rango', () => {
    const s = memoryStorage();
    s.setItem('pacman-familiar.ghostIds', '[]');
    expect(loadPrefs(s).ghostIds).toBeNull();
    s.setItem('pacman-familiar.ghostIds', '["a","b","c","d","e"]');
    expect(loadPrefs(s).ghostIds).toBeNull();
  });

  it('lee la clave antigua ghostCount para poder migrarla', () => {
    const s = memoryStorage();
    s.setItem('pacman-familiar.ghostCount', '3');
    expect(loadPrefs(s).legacyGhostCount).toBe(3);
    expect(loadPrefs(s).ghostIds).toBeNull();
  });

  it('guardar ghostIds borra la clave antigua', () => {
    const s = memoryStorage();
    s.setItem('pacman-familiar.ghostCount', '3');
    saveGhostIds(s, ['papa']);
    expect(s.getItem('pacman-familiar.ghostCount')).toBeNull();
    expect(loadPrefs(s).legacyGhostCount).toBeNull();
  });
});
