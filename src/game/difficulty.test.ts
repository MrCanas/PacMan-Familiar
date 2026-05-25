import { describe, expect, it } from 'vitest';

import { DIFFICULTY_SETTINGS, getDifficultySettings } from '@/game/difficulty';

describe('difficulty', () => {
  it('fácil tiene intervalos más lentos que difícil', () => {
    const easy = getDifficultySettings('easy');
    const hard = getDifficultySettings('hard');
    expect(easy.playerMoveInterval).toBeGreaterThan(hard.playerMoveInterval);
    expect(easy.ghostMoveInterval).toBeGreaterThan(hard.ghostMoveInterval);
    expect(easy.chaseProbability).toBeLessThan(hard.chaseProbability);
  });

  it('tiene tres niveles', () => {
    expect(Object.keys(DIFFICULTY_SETTINGS)).toEqual(['easy', 'medium', 'hard']);
  });
});
