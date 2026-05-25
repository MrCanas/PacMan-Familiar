import { afterEach, describe, expect, it, vi } from 'vitest';

import { CHARACTERS } from '@/data/characters';
import { Ghost } from '@/entities/Ghost';
import { GHOST_SPEED_FACTOR, PROTAGONIST_SPEED } from '@/game/constants';
import type { Maze } from '@/game/Maze';
import { oppositeDirection } from '@/entities/direction';

const stubData = CHARACTERS[1]!;
const stubImg = new Image();

describe('Ghost (legacy entity)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('velocidad configurable en constructor', () => {
    const speed = PROTAGONIST_SPEED * GHOST_SPEED_FACTOR;
    const g = new Ghost(stubData, stubImg, 3, 3, speed, 'right');
    expect(g.speed).toBeCloseTo(speed);
  });

  it('en cruce no elige la dirección opuesta a la actual (random fijado)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const maze = {
      isWalkable: (col: number, row: number) => {
        if (row === 3 && col >= 2 && col <= 4) return true;
        if (col === 3 && row >= 2 && row <= 4) return true;
        return false;
      },
    } as unknown as Maze;

    const g = new Ghost(stubData, stubImg, 3, 3, PROTAGONIST_SPEED * GHOST_SPEED_FACTOR, 'right');
    g.snapToCell(3, 3);
    g.direction = 'right';
    g.update(maze);
    expect(g.direction).not.toBe(oppositeDirection('right'));
  });

  it('en pasillo mantiene dirección si sigue libre', () => {
    const maze = {
      isWalkable: (col: number, row: number) => row === 3 && col >= 1 && col <= 8,
    } as unknown as Maze;
    const g = new Ghost(stubData, stubImg, 3, 3, PROTAGONIST_SPEED * GHOST_SPEED_FACTOR, 'right');
    g.snapToCell(3, 3);
    g.direction = 'right';
    g.update(maze);
    expect(g.direction).toBe('right');
  });
});
