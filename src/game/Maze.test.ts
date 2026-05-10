import { describe, expect, it } from 'vitest';

import { Maze, buildMazeGridFromTemplate, mirrorRow } from '@/game/Maze';
import { MAZE_COLS, MAZE_ROWS } from '@/game/constants';

describe('Maze', () => {
  it('isWall devuelve true en # y false en pasillos y pellets', () => {
    const maze = new Maze();
    expect(maze.isWall(0, 0)).toBe(true);
    expect(maze.isWall(1, 1)).toBe(false);
    const pelletCell = findFirstCell(maze, '.');
    expect(pelletCell).not.toBeNull();
    expect(maze.isWall(pelletCell!.col, pelletCell!.row)).toBe(false);
  });

  it('eatPellet: primera vez true, segunda false', () => {
    const maze = new Maze();
    const cell = findFirstCell(maze, '.');
    expect(cell).not.toBeNull();
    expect(maze.eatPellet(cell!.col, cell!.row)).toBe(true);
    expect(maze.eatPellet(cell!.col, cell!.row)).toBe(false);
  });

  it('eatPellet en pared o vacío sin pellet: false', () => {
    const maze = new Maze();
    expect(maze.eatPellet(0, 0)).toBe(false);
    const cell = findFirstCell(maze, ' ');
    if (cell) {
      expect(maze.eatPellet(cell.col, cell.row)).toBe(false);
    }
  });

  it('BFS desde spawn P alcanza todas las celdas no muro', () => {
    const maze = new Maze();
    const { protagonist } = maze.getSpawnPositions();
    const reachable = bfsReachable(maze, protagonist.col, protagonist.row);
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (!maze.isWall(col, row)) {
          const key = `${col},${row}`;
          expect(reachable.has(key)).toBe(true);
        }
      }
    }
  });

  it('simetría horizontal: cell(c) === cell(width-1-c)', () => {
    const grid = buildMazeGridFromTemplate();
    for (let row = 0; row < MAZE_ROWS; row++) {
      const line = grid[row]!;
      for (let col = 0; col < MAZE_COLS; col++) {
        expect(line[col]).toBe(line[MAZE_COLS - 1 - col]!);
      }
    }
  });

  it('pelletsRemaining decrece tras eatPellet exitoso', () => {
    const maze = new Maze();
    const before = maze.pelletsRemaining();
    const cell = findFirstCell(maze, '.');
    expect(maze.eatPellet(cell!.col, cell!.row)).toBe(true);
    expect(maze.pelletsRemaining()).toBe(before - 1);
  });

  it('getSpawnPositions: al menos 1 P y 4 G', () => {
    const maze = new Maze();
    const { protagonist, ghosts } = maze.getSpawnPositions();
    expect(protagonist).toBeDefined();
    expect(ghosts.length).toBeGreaterThanOrEqual(4);
  });
});

describe('mirrorRow', () => {
  it('expande 10 pares simétricos a 20 columnas', () => {
    const half = '#..##.....';
    const full = mirrorRow(half);
    expect(full.length).toBe(20);
    for (let c = 0; c < 20; c++) {
      expect(full[c]).toBe(full[19 - c]!);
    }
  });
});

function findFirstCell(maze: Maze, ch: string): { col: number; row: number } | null {
  for (let row = 0; row < MAZE_ROWS; row++) {
    for (let col = 0; col < MAZE_COLS; col++) {
      if (maze.cell(col, row) === ch) {
        return { col, row };
      }
    }
  }
  return null;
}

function bfsReachable(maze: Maze, startCol: number, startRow: number): Set<string> {
  const seen = new Set<string>();
  const q: { col: number; row: number }[] = [{ col: startCol, row: startRow }];
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  while (q.length) {
    const cur = q.shift()!;
    const key = `${cur.col},${cur.row}`;
    if (seen.has(key)) continue;
    if (maze.isWall(cur.col, cur.row)) continue;
    seen.add(key);
    for (const [dc, dr] of dirs) {
      q.push({ col: cur.col + dc, row: cur.row + dr });
    }
  }
  return seen;
}
