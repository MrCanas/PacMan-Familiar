import { describe, expect, it } from 'vitest';

import { DIFFICULTY_SETTINGS, getDifficultySettings } from '@/game/difficulty';

describe('difficulty', () => {
  it('fácil es más lento y persigue menos que difícil', () => {
    const easy = getDifficultySettings('easy');
    const hard = getDifficultySettings('hard');
    expect(easy.ghostSpeed).toBeLessThan(hard.ghostSpeed);
    expect(easy.chaseProbability).toBeLessThan(hard.chaseProbability);
    expect(easy.ghostMoveInterval).toBeGreaterThan(hard.ghostMoveInterval);
  });

  it('tiene tres niveles configurados', () => {
    expect(Object.keys(DIFFICULTY_SETTINGS)).toEqual(['easy', 'medium', 'hard']);
  });
});
