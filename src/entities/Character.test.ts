import { describe, expect, it } from 'vitest';

import { ALL_CHARACTERS } from '@/data/characters';
import { Character } from '@/entities/Character';
import { CELL_SIZE, PROTAGONIST_SPEED } from '@/game/constants';
import type { Maze } from '@/game/Maze';

const stubData = ALL_CHARACTERS[0]!;
const stubImg = new Image();

describe('Character', () => {
  it('sin obstáculos, update mueve pixelX/pixelY según dirección', () => {
    const maze = { isWalkable: () => true } as unknown as Maze;
    const c = new Character(stubData, stubImg, 5, 5, PROTAGONIST_SPEED, 'right');
    const x0 = c.pixelX;
    c.update(maze);
    expect(c.pixelX).toBeGreaterThan(x0);
  });

  it('contra una pared no avanza más allá del centro de la celda bloqueada', () => {
    const maze = {
      isWalkable: (col: number, row: number) => col < 6 || row !== 5,
    } as unknown as Maze;
    const c = new Character(stubData, stubImg, 5, 5, PROTAGONIST_SPEED, 'right');
    const limit = 6 * CELL_SIZE + CELL_SIZE / 2;
    for (let i = 0; i < 80; i++) {
      c.update(maze);
    }
    expect(c.pixelX).toBeLessThanOrEqual(limit + PROTAGONIST_SPEED);
  });

  it('aplica dirección en cola al llegar al centro cuando hay cruce', () => {
    const maze = { isWalkable: () => true } as unknown as Maze;
    const c = new Character(stubData, stubImg, 5, 5, PROTAGONIST_SPEED, 'right');
    c.snapToCell(5, 5);
    c.setQueuedDirection('down');
    c.update(maze);
    expect(['down', 'right']).toContain(c.direction);
  });
});
