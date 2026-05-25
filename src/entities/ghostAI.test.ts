import { describe, expect, it, vi } from 'vitest';

import { manhattanDistance, pickGhostDirection } from '@/entities/ghostAI';
import type { Maze } from '@/game/Maze';

describe('ghostAI', () => {
  it('manhattanDistance', () => {
    expect(manhattanDistance({ col: 0, row: 0 }, { col: 3, row: 4 })).toBe(7);
  });

  it('con chaseProbability 1 elige dirección que acerca al jugador', () => {
    const maze = {
      isWalkable: (col: number, row: number) => row === 5 && col >= 3 && col <= 7,
    } as unknown as Maze;

    const dir = pickGhostDirection(maze, 5, 5, 'up', 7, 5, 1, () => 0);
    expect(dir).toBe('right');
  });

  it('con chaseProbability 0 elige aleatorio del pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const maze = {
      isWalkable: (col: number, row: number) => {
        if (row === 3 && col >= 2 && col <= 4) return true;
        if (col === 3 && row >= 2 && row <= 4) return true;
        return false;
      },
    } as unknown as Maze;

    const dir = pickGhostDirection(maze, 3, 3, 'right', 3, 1, 0);
    expect(['up', 'down', 'left', 'right']).toContain(dir);
    vi.restoreAllMocks();
  });
});
