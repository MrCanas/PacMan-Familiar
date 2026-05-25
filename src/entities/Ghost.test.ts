import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHARACTERS } from '@/data/characters';
import { Ghost } from '@/entities/Ghost';
import { oppositeDirection } from '@/entities/direction';
import { getDifficultySettings } from '@/game/difficulty';
import type { Maze } from '@/game/Maze';

const stubData = CHARACTERS[1]!;
const stubImg = new Image();

describe('Ghost', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('acepta velocidad según dificultad', () => {
    const speed = getDifficultySettings('medium').ghostSpeed;
    const g = new Ghost(stubData, stubImg, 3, 3, speed, 'right');
    expect(g.speed).toBeCloseTo(speed);
  });

  it('en cruce no elige la dirección opuesta a la actual (random fijado)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const maze = {
      isWalkable: (col: number, row: number) => {
        if (row === 3 && col >= 2 && col <= 4) return true;
        if (col === 3 && row >= 2 && row <= 4) return true;
        return false;
      },
    } as unknown as Maze;

    const speed = getDifficultySettings('easy').ghostSpeed;
    const g = new Ghost(stubData, stubImg, 3, 3, speed, 'right', {
      chaseProbability: 0,
      ghostMoveInterval: 1,
    });
    g.snapToCell(3, 3);
    g.direction = 'right';
    g.update(maze, { col: 3, row: 1 });
    expect(g.direction).not.toBe(oppositeDirection('right'));
  });

  it('en pasillo mantiene dirección si sigue libre', () => {
    const maze = {
      isWalkable: (col: number, row: number) => row === 3 && col >= 1 && col <= 8,
    } as unknown as Maze;
    const speed = getDifficultySettings('medium').ghostSpeed;
    const g = new Ghost(stubData, stubImg, 3, 3, speed, 'right');
    g.snapToCell(3, 3);
    g.direction = 'right';
    g.update(maze, { col: 8, row: 3 });
    expect(g.direction).toBe('right');
  });

  it('persigue al jugador en cruce con alta probabilidad', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const maze = {
      isWalkable: (col: number, row: number) => {
        if (row === 3 && col >= 2 && col <= 4) return true;
        if (col === 3 && row >= 2 && row <= 4) return true;
        return false;
      },
    } as unknown as Maze;
    const speed = getDifficultySettings('hard').ghostSpeed;
    const g = new Ghost(stubData, stubImg, 3, 3, speed, 'left', {
      chaseProbability: 1,
      ghostMoveInterval: 1,
    });
    g.snapToCell(3, 3);
    g.direction = 'left';
    g.update(maze, { col: 3, row: 1 });
    expect(g.direction).toBe('up');
  });
});
