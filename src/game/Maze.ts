import { GridMap } from '@/game/GridMap';
import { buildCharGrid, LEFT_HALF_ROWS, mirrorRow } from '@/game/mazeTemplate';

/** Fachada sobre GridMap para compatibilidad con tests y código legado. */
export class Maze {
  private readonly gridMap: GridMap;

  constructor() {
    this.gridMap = new GridMap();
  }

  get grid(): GridMap {
    return this.gridMap;
  }

  cell(col: number, row: number): string {
    return this.gridMap.cell(col, row);
  }

  isWall(col: number, row: number): boolean {
    return this.gridMap.isWall(col, row);
  }

  isWalkable(col: number, row: number): boolean {
    return this.gridMap.isWalkable(col, row);
  }

  eatPellet(col: number, row: number): boolean {
    return this.gridMap.eatPellet(col, row);
  }

  pelletsRemaining(): number {
    return this.gridMap.pelletsRemaining();
  }

  getSpawnPositions(): { protagonist: { col: number; row: number }; ghosts: { col: number; row: number }[] } {
    return this.gridMap.getSpawnPositions();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.gridMap.draw(ctx);
  }
}

export { LEFT_HALF_ROWS, mirrorRow, buildCharGrid as buildMazeGridFromTemplate };
