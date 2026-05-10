import { CELL_SIZE, HUD_HEIGHT, MAZE_COLS, MAZE_ROWS } from '@/game/constants';

/** 10 símbolos por fila: `half[k]` aplica al par de columnas `(k, 19-k)`. */
const LEFT_HALF_ROWS: string[] = [
  '##########',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.........',
  '#.G....G..',
  '#....P....',
  '##########',
];

/**
 * `half[k]` es el carácter compartido por las columnas simétricas `k` y `19-k`
 * (incluye el par central 9–10 en `half[9]`).
 */
export function mirrorRow(half: string): string {
  if (half.length !== 10) {
    throw new Error('Cada fila debe tener 10 caracteres (pares simétricos)');
  }
  let row = '';
  for (let c = 0; c < MAZE_COLS; c++) {
    const k = c <= 9 ? c : MAZE_COLS - 1 - c;
    row += half[k]!;
  }
  return row;
}

export class Maze {
  private grid: string[];

  constructor() {
    this.grid = LEFT_HALF_ROWS.map(mirrorRow);
  }

  cell(col: number, row: number): string {
    if (col < 0 || col >= MAZE_COLS || row < 0 || row >= MAZE_ROWS) {
      return '#';
    }
    return this.grid[row]![col]!;
  }

  isWall(col: number, row: number): boolean {
    return this.cell(col, row) === '#';
  }

  /** Celda transitable (no pared). */
  isWalkable(col: number, row: number): boolean {
    return !this.isWall(col, row);
  }

  eatPellet(col: number, row: number): boolean {
    const ch = this.cell(col, row);
    if (ch !== '.') {
      return false;
    }
    const line = this.grid[row]!;
    this.grid[row] = line.slice(0, col) + ' ' + line.slice(col + 1);
    return true;
  }

  pelletsRemaining(): number {
    let n = 0;
    for (const row of this.grid) {
      for (const ch of row) {
        if (ch === '.') n += 1;
      }
    }
    return n;
  }

  getSpawnPositions(): { protagonist: { col: number; row: number }; ghosts: { col: number; row: number }[] } {
    const ghosts: { col: number; row: number }[] = [];
    let protagonist: { col: number; row: number } | null = null;

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        const ch = this.cell(col, row);
        if (ch === 'P') {
          protagonist = { col, row };
        }
        if (ch === 'G') {
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
        const ch = this.cell(col, row);

        if (ch === '#') {
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
        } else if (ch === '.') {
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

/** Expuesto para tests de simetría / BFS sin instanciar draw. */
export function buildMazeGridFromTemplate(): string[] {
  return LEFT_HALF_ROWS.map(mirrorRow);
}
