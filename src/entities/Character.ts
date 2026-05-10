import type { CharacterData } from '@/data/characters';
import { CELL_SIZE, HUD_HEIGHT } from '@/game/constants';
import type { Maze } from '@/game/Maze';
import { directionDelta, type Direction } from '@/entities/direction';

export class Character {
  data: CharacterData;
  image: HTMLImageElement;
  col: number;
  row: number;
  pixelX: number;
  pixelY: number;
  direction: Direction;
  speed: number;
  protected queuedDirection: Direction | null = null;

  constructor(
    data: CharacterData,
    image: HTMLImageElement,
    spawnCol: number,
    spawnRow: number,
    speed: number,
    initialDirection: Direction = 'right'
  ) {
    this.data = data;
    this.image = image;
    this.col = spawnCol;
    this.row = spawnRow;
    this.speed = speed;
    this.direction = initialDirection;
    this.pixelX = spawnCol * CELL_SIZE + CELL_SIZE / 2;
    this.pixelY = HUD_HEIGHT + spawnRow * CELL_SIZE + CELL_SIZE / 2;
  }

  setQueuedDirection(dir: Direction | null): void {
    this.queuedDirection = dir;
  }

  cellCenterX(c: number): number {
    return c * CELL_SIZE + CELL_SIZE / 2;
  }

  cellCenterY(r: number): number {
    return HUD_HEIGHT + r * CELL_SIZE + CELL_SIZE / 2;
  }

  /** Celda que contiene el centro del personaje (para lógica de giro). */
  getLogicalCell(): { col: number; row: number } {
    const col = Math.floor(this.pixelX / CELL_SIZE);
    const row = Math.floor((this.pixelY - HUD_HEIGHT) / CELL_SIZE);
    return { col, row };
  }

  isNearCenterOfCell(col: number, row: number, eps: number): boolean {
    const cx = this.cellCenterX(col);
    const cy = this.cellCenterY(row);
    return Math.abs(this.pixelX - cx) <= eps && Math.abs(this.pixelY - cy) <= eps;
  }

  snapToCell(col: number, row: number): void {
    this.pixelX = this.cellCenterX(col);
    this.pixelY = this.cellCenterY(row);
    this.col = col;
    this.row = row;
  }

  update(maze: Maze): void {
    const eps = Math.max(1.5, this.speed);
    const { col, row } = this.getLogicalCell();

    if (this.isNearCenterOfCell(col, row, eps)) {
      this.snapToCell(col, row);

      if (this.queuedDirection) {
        const { dx, dy } = directionDelta(this.queuedDirection);
        if (maze.isWalkable(col + dx, row + dy)) {
          this.direction = this.queuedDirection;
          this.queuedDirection = null;
        }
      }

      const { dx, dy } = directionDelta(this.direction);
      if (!maze.isWalkable(col + dx, row + dy)) {
        return;
      }
    }

    const { dx, dy } = directionDelta(this.direction);
    const nx = this.pixelX + dx * this.speed;
    const ny = this.pixelY + dy * this.speed;

    const cellAtNext = {
      col: Math.floor(nx / CELL_SIZE),
      row: Math.floor((ny - HUD_HEIGHT) / CELL_SIZE),
    };

    if (!maze.isWalkable(cellAtNext.col, cellAtNext.row)) {
      this.snapToCell(col, row);
      return;
    }

    this.pixelX = nx;
    this.pixelY = ny;
    this.col = cellAtNext.col;
    this.row = cellAtNext.row;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const r = CELL_SIZE * 0.38;
    const { pixelX, pixelY } = this;
    const img = this.image;
    const diameter = r * 2;
    const scale = Math.max(diameter / img.naturalWidth, diameter / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = pixelX - dw / 2;
    const dy = pixelY - dh / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.data.accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}
