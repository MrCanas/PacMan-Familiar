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

    ctx.fillStyle = '#050b1c';
    ctx.fillRect(0, 0, MAZE_COLS * CELL_SIZE, MAZE_ROWS * CELL_SIZE);

    this.drawWalls(ctx);
    this.drawPellets(ctx);

    ctx.restore();
  }

  /**
   * Los muros se dibujan como un bloque continuo: cada celda se expande hacia
   * los vecinos que también son muro y se recorta contra los pasillos, de modo
   * que el contorno queda como un tubo de neón en lugar de un mosaico.
   */
  /**
   * Muro *dentro* del tablero. A diferencia de `isWall`, lo de fuera del
   * tablero no cuenta como muro: así el borde exterior también recibe su
   * línea de neón en lugar de quedar como una banda oscura.
   */
  private isSolid(col: number, row: number): boolean {
    if (col < 0 || col >= MAZE_COLS || row < 0 || row >= MAZE_ROWS) {
      return false;
    }
    return this.isWall(col, row);
  }

  private drawWalls(ctx: CanvasRenderingContext2D): void {
    const pad = CELL_SIZE * 0.12;
    const fill = new Path2D();
    const outline = new Path2D();

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (!this.isWall(col, row)) {
          continue;
        }
        const openLeft = !this.isSolid(col - 1, row);
        const openRight = !this.isSolid(col + 1, row);
        const openUp = !this.isSolid(col, row - 1);
        const openDown = !this.isSolid(col, row + 1);

        const x0 = col * CELL_SIZE + (openLeft ? pad : 0);
        const x1 = (col + 1) * CELL_SIZE - (openRight ? pad : 0);
        const y0 = row * CELL_SIZE + (openUp ? pad : 0);
        const y1 = (row + 1) * CELL_SIZE - (openDown ? pad : 0);
        fill.rect(x0, y0, x1 - x0, y1 - y0);

        if (openLeft) {
          outline.moveTo(x0, y0);
          outline.lineTo(x0, y1);
        }
        if (openRight) {
          outline.moveTo(x1, y0);
          outline.lineTo(x1, y1);
        }
        if (openUp) {
          outline.moveTo(x0, y0);
          outline.lineTo(x1, y0);
        }
        if (openDown) {
          outline.moveTo(x0, y1);
          outline.lineTo(x1, y1);
        }
      }
    }

    ctx.save();
    ctx.fillStyle = '#111f4d';
    ctx.fill(fill);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = Math.max(1.5, CELL_SIZE * 0.075);
    ctx.lineCap = 'square';
    ctx.shadowColor = 'rgba(96, 165, 250, 0.85)';
    ctx.shadowBlur = CELL_SIZE * 0.3;
    ctx.stroke(outline);
    ctx.restore();
  }

  private drawPellets(ctx: CanvasRenderingContext2D): void {
    const path = new Path2D();
    const r = Math.max(1.5, CELL_SIZE * 0.1);
    let any = false;

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (this.getCell(col, row) !== Cell.PELLET) {
          continue;
        }
        any = true;
        path.moveTo(col * CELL_SIZE + CELL_SIZE / 2 + r, row * CELL_SIZE + CELL_SIZE / 2);
        path.arc(
          col * CELL_SIZE + CELL_SIZE / 2,
          row * CELL_SIZE + CELL_SIZE / 2,
          r,
          0,
          Math.PI * 2
        );
      }
    }

    if (!any) {
      return;
    }

    ctx.save();
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = 'rgba(253, 224, 71, 0.7)';
    ctx.shadowBlur = CELL_SIZE * 0.22;
    ctx.fill(path);
    ctx.restore();
  }
}
