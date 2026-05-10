import { describe, expect, it, vi } from 'vitest';

import { CHARACTERS } from '@/data/characters';
import { Protagonist } from '@/entities/Protagonist';
import { PELLET_VALUE, PROTAGONIST_SPEED } from '@/game/constants';
import type { Maze } from '@/game/Maze';

const stubData = CHARACTERS[0]!;
const stubImg = new Image();

describe('Protagonist', () => {
  it('come pellet y suma puntos', () => {
    let score = 0;
    const eat = vi.fn(() => true);
    const maze = {
      isWalkable: () => true,
      eatPellet: eat,
    } as unknown as Maze;

    const p = new Protagonist(stubData, stubImg, 5, 5, PROTAGONIST_SPEED, (pts) => {
      score += pts;
    });
    p.snapToCell(5, 5);
    p.update(maze);
    expect(eat).toHaveBeenCalled();
    expect(score).toBe(PELLET_VALUE);
  });

  it('aplica direcci�n deseada v�lida', () => {
    const maze = { isWalkable: () => true, eatPellet: () => false } as unknown as Maze;
    const p = new Protagonist(stubData, stubImg, 5, 5, PROTAGONIST_SPEED, () => {});
    p.snapToCell(5, 5);
    p.applyDesiredDirection('down');
    p.update(maze);
    expect(p.direction).toBe('down');
  });
});
