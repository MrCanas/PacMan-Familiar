import { Cell } from '@/game/cells';
import { CELL_SIZE, HUD_HEIGHT, MAZE_COLS, MAZE_ROWS } from '@/game/constants';
import { CLASSIC_MAZE } from '@/game/scenarios/classicMaze';
import { parseScenario } from '@/game/scenarios/legend';
import type { ScenarioDefinition, TerrainDrawContext } from '@/game/scenarios/types';
import {
  Decor,
  Terrain,
  TERRAIN_SPEED,
  type DecorValue,
  type LevelLayers,
  type TerrainValue,
  type Vec,
} from '@/game/terrain';

export class GridMap {
  readonly scenario: ScenarioDefinition;
  private readonly layers: LevelLayers;

  constructor(scenario: ScenarioDefinition = CLASSIC_MAZE) {
    this.scenario = scenario;
    this.layers = parseScenario(scenario);
  }

  static fromScenario(scenario: ScenarioDefinition): GridMap {
    return new GridMap(scenario);
  }

  /** Copia lista para jugar: las salidas dejan de marcarse en el tablero. */
  static createForPlay(scenario: ScenarioDefinition = CLASSIC_MAZE): GridMap {
    const map = new GridMap(scenario);
    map.prepareForPlay();
    return map;
  }

  prepareForPlay(): void {
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        this.layers.spawnMarks[row]![col] = 0;
      }
    }
  }

  private inside(col: number, row: number): boolean {
    return col >= 0 && col < MAZE_COLS && row >= 0 && row < MAZE_ROWS;
  }

  terrainAt(col: number, row: number): TerrainValue {
    if (!this.inside(col, row)) return Terrain.SOLID;
    return this.layers.terrain[row]![col]!;
  }

  decorAt(col: number, row: number): DecorValue {
    if (!this.inside(col, row)) return Decor.NONE;
    return this.layers.decor[row]![col]!;
  }

  /**
   * Cuánto de rápido se anda por esa celda. En la piscina es 0,8: cada paso
   * tarda 1/0,8 veces más. Igual para el protagonista que para los fantasmas.
   */
  speedFactorAt(col: number, row: number): number {
    return TERRAIN_SPEED[this.terrainAt(col, row)];
  }

  isWall(col: number, row: number): boolean {
    return this.terrainAt(col, row) === Terrain.SOLID;
  }

  /** Sólido que no es muro: seto, tumbona o mesa. Para el tema, no para el juego. */
  isObstacle(col: number, row: number): boolean {
    return this.isWall(col, row) && this.decorAt(col, row) !== Decor.WALL;
  }

  canEnter(col: number, row: number): boolean {
    return !this.isWall(col, row);
  }

  isWalkable(col: number, row: number): boolean {
    return this.canEnter(col, row);
  }

  hasPellet(col: number, row: number): boolean {
    if (!this.inside(col, row)) return false;
    return this.layers.pellets[row]![col]!;
  }

  /** Compatibilidad con la API anterior basada en caracteres. */
  cell(col: number, row: number): string {
    if (!this.inside(col, row)) return '#';
    const spawn = this.layers.spawnMarks[row]![col]!;
    if (spawn === Cell.PLAYER_SPAWN) return 'P';
    if (spawn === Cell.GHOST_SPAWN) return 'G';
    if (this.isWall(col, row)) return '#';
    if (this.hasPellet(col, row)) return '.';
    return ' ';
  }

  eatPellet(col: number, row: number): boolean {
    if (!this.hasPellet(col, row)) {
      return false;
    }
    this.layers.pellets[row]![col] = false;
    this.layers.pelletCount -= 1;
    return true;
  }

  /** Contador vivo: antes esto rebarría las 300 celdas en cada paso. */
  pelletsRemaining(): number {
    return this.layers.pelletCount;
  }

  getSpawnPositions(): { protagonist: Vec; ghosts: Vec[] } {
    return {
      protagonist: { ...this.layers.playerSpawn },
      ghosts: this.layers.ghostSpawns.map((g) => ({ ...g })),
    };
  }

  private drawContext(ctx: CanvasRenderingContext2D, timeMs: number): TerrainDrawContext {
    return {
      ctx,
      cols: MAZE_COLS,
      rows: MAZE_ROWS,
      cellSize: CELL_SIZE,
      timeMs,
      terrainAt: (col, row) => this.terrainAt(col, row),
      decorAt: (col, row) => this.decorAt(col, row),
      // Lo de fuera del tablero no cuenta como sólido: así el borde exterior
      // también recibe su línea de neón en lugar de quedar como banda oscura.
      isSolid: (col, row) => this.inside(col, row) && this.isWall(col, row),
      isSolidOf: (col, row, decor) =>
        this.inside(col, row) && this.isWall(col, row) && this.decorAt(col, row) === decor,
      isWater: (col, row) => this.inside(col, row) && this.terrainAt(col, row) === Terrain.WATER,
    };
  }

  draw(ctx: CanvasRenderingContext2D, timeMs = 0): void {
    const { theme } = this.scenario;
    ctx.save();
    ctx.translate(0, HUD_HEIGHT);

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, MAZE_COLS * CELL_SIZE, MAZE_ROWS * CELL_SIZE);

    theme.drawTerrain(this.drawContext(ctx, timeMs));
    this.drawPellets(ctx);

    ctx.restore();
  }

  private drawPellets(ctx: CanvasRenderingContext2D): void {
    const { pellet } = this.scenario.theme;
    const path = new Path2D();
    const r = Math.max(1.5, CELL_SIZE * (pellet.radiusFactor ?? 0.1));
    let any = false;

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (!this.hasPellet(col, row)) {
          continue;
        }
        any = true;
        const cx = col * CELL_SIZE + CELL_SIZE / 2;
        const cy = row * CELL_SIZE + CELL_SIZE / 2;
        path.moveTo(cx + r, cy);
        path.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }

    if (!any) {
      return;
    }

    ctx.save();
    ctx.fillStyle = pellet.fill;
    ctx.shadowColor = pellet.glow;
    ctx.shadowBlur = CELL_SIZE * 0.22;
    ctx.fill(path);
    ctx.restore();
  }
}
