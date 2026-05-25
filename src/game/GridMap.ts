import { Cell } from '@/game/cells';
import { CELL_SIZE, HUD_HEIGHT, MAZE_COLS, MAZE_ROWS } from '@/game/constants';
import { buildNumericGrid } from '@/game/mazeTemplate';

export class GridMap {
  private grid: number[][];

  constructor(grid?: number[][]) {
    this.grid = grid ?? buildNumericGrid().map((row) => [...row]);
  }

  /** Copia lista para jugar: convierte spawns en camino. */
  static createForPlay(): GridMap {
    const map = new GridMap();
    map.prepareForPlay();
    return map;
  }

  prepareForPlay(): void {
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const v = this.grid[row]![col]!;
        if (v === Cell.PLAYER_SPAWN || v === Cell.GHOST_SPAWN) {
          this.grid[row]![col] = Cell.PATH;
        }
      }
    }
  }

  getCell(col: number, row: number): number {
    if (col < 0 || col >= MAZE_COLS || row < 0 || row >= MAZE_ROWS) {
      return Cell.WALL;
    }
    return this.grid[row]![col]!;
  }

  setCell(col: number, row: number, value: number): void {
    if (col < 0 || col >= MAZE_COLS || row < 0 || row >= MAZE_ROWS) {
      return;
    }
    this.grid[row]![col] = value;
  }

  isWall(col: number, row: number): boolean {
    return this.getCell(col, row) === Cell.WALL;
  }

  canEnter(col: number, row: number): boolean {
    return !this.isWall(col, row);
  }

  /** Compatibilidad con API anterior basada en caracteres. */
  cell(col: number, row: number): string {
    const v = this.getCell(col, row);
    switch (v) {
      case Cell.WALL:
        return '#';
      case Cell.PELLET:
        return '.';
      case Cell.PLAYER_SPAWN:
        return 'P';
      case Cell.GHOST_SPAWN:
        return 'G';
      default:
        return ' ';
    }
  }

  isWalkable(col: number, row: number): boolean {
    return this.canEnter(col, row);
  }

  eatPellet(col: number, row: number): boolean {
    if (this.getCell(col, row) !== Cell.PELLET) {
      return false;
    }
    this.setCell(col, row, Cell.PATH);
    return true;
  }

  pelletsRemaining(): number {
    let n = 0;
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (this.getCell(col, row) === Cell.PELLET) {
          n += 1;
        }
      }
    }
    return n;
  }

  getSpawnPositions(): {
    protagonist: { col: number; row: number };
    ghosts: { col: number; row: number }[];
  } {
    const ghosts: { col: number; row: number }[] = [];
    let protagonist: { col: number; row: number } | null = null;
    const source = buildNumericGrid();

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const v = source[row]![col]!;
        if (v === Cell.PLAYER_SPAWN) {
          protagonist = { col, row };
        }
        if (v === Cell.GHOST_SPAWN) {
          ghosts.push({ col, row });
        }
      }
    }

    if (!protagonist) {
      throw new Error('No hay celda P de protagonista');
    }

    return { protagonist, ghosts };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(0, HUD_HEIGHT);

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        const v = this.getCell(col, row);

        if (v === Cell.WALL) {
          ctx.fillStyle = '#1d4ed8';
          const r = 6;
          ctx.beginPath();
          const px = x + 2;
          const py = y + 2;
          const w = CELL_SIZE - 4;
          const h = CELL_SIZE - 4;
          ctx.roundRect(px, py, w, h, r);
          ctx.fill();
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (v === Cell.PELLET) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }
}
