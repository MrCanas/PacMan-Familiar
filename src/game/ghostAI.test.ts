import { describe, expect, it, vi } from 'vitest';

import { chooseGhostMove, manhattanDistance } from '@/game/ghostAI';
import { GridMap } from '@/game/GridMap';

describe('ghostAI', () => {
  it('manhattanDistance', () => {
    expect(manhattanDistance({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(7);
  });

  it('con chaseProbability 1 elige dirección que acerca al jugador', () => {
    const dir = chooseGhostMove(
      {
        canEnter: (c: number, r: number) => r === 5 && c >= 3 && c <= 7,
      } as GridMap,
      5,
      5,
      'up',
      7,
      5,
      1,
      () => 0
    );
    expect(dir).toBe('right');
  });

  it('con chaseProbability 0 elige del pool válido', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const dir = chooseGhostMove(
      {
        canEnter: (col: number, row: number) => {
          if (row === 3 && col >= 2 && col <= 4) return true;
          if (col === 3 && row >= 2 && row <= 4) return true;
          return false;
        },
      } as GridMap,
      3,
      3,
      'right',
      3,
      1,
      0
    );
    expect(['up', 'down', 'left', 'right']).toContain(dir);
    vi.restoreAllMocks();
  });
});
