import { describe, expect, it } from 'vitest';

import { CHARACTERS } from '@/data/characters';
import { Protagonist } from '@/entities/Protagonist';
import { directionDelta } from '@/entities/direction';
import { PROTAGONIST_SPEED } from '@/game/constants';
import { Maze } from '@/game/Maze';

describe('spawn walkability', () => {
  it('P tiene al menos una salida', () => {
    const maze = new Maze();
    const { protagonist } = maze.getSpawnPositions();
    const dirs = ['up', 'down', 'left', 'right'] as const;
    const open = dirs.filter((d) => {
      const { dx, dy } = directionDelta(d);
      return maze.isWalkable(protagonist.col + dx, protagonist.row + dy);
    });
    expect(open.length).toBeGreaterThan(0);
  });

  it('protagonist se mueve en laberinto real sin tecla (dirección inicial)', () => {
    const maze = new Maze();
    const { protagonist: spawn } = maze.getSpawnPositions();
    const data = CHARACTERS[0]!;
    const img = new Image();
    let moved = false;
    const p = new Protagonist(data, img, spawn.col, spawn.row, PROTAGONIST_SPEED, () => {
      moved = true;
    });
    const x0 = p.pixelX;
    for (let i = 0; i < 60; i++) {
      p.update(maze);
    }
    expect(p.pixelX !== x0 || p.pixelY !== x0).toBe(true);
    void moved;
  });

  it('protagonist responde a ArrowLeft en laberinto real', () => {
    const maze = new Maze();
    const { protagonist: spawn } = maze.getSpawnPositions();
    const data = CHARACTERS[0]!;
    const img = new Image();
    const p = new Protagonist(data, img, spawn.col, spawn.row, PROTAGONIST_SPEED, () => {});
    p.snapToCell(spawn.col, spawn.row);
    p.applyDesiredDirection('left');
    for (let i = 0; i < 40; i++) {
      p.update(maze);
    }
    expect(p.direction).toBe('left');
    expect(p.pixelX).toBeLessThan(spawn.col * 32 + 32);
  });
});
