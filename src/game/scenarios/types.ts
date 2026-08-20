import type { DecorValue, TerrainValue } from '@/game/terrain';

export type ScenarioId = 'classic' | 'patio';

/**
 * El laberinto clásico se escribe a medias (diez símbolos que se reflejan) para
 * garantizar la simetría; el patio no es simétrico y se escribe entero.
 */
export type ScenarioRows =
  | { kind: 'mirrored'; halfRows: string[] }
  | { kind: 'full'; rows: string[] };

/** Lo que el tema necesita para pintar el tablero, sin acceso al resto. */
export type TerrainDrawContext = {
  /** Ya trasladado bajo el HUD: el origen es la esquina del tablero. */
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  cellSize: number;
  timeMs: number;
  terrainAt: (col: number, row: number) => TerrainValue;
  decorAt: (col: number, row: number) => DecorValue;
  /** Sólido *dentro* del tablero; fuera del tablero cuenta como aire. */
  isSolid: (col: number, row: number) => boolean;
  /** Sólido y además de ese material: permite fusionar por tipo, no por dureza. */
  isSolidOf: (col: number, row: number, decor: DecorValue) => boolean;
  isWater: (col: number, row: number) => boolean;
};

export type ScenarioTheme = {
  background: string;
  pellet: { fill: string; glow: string; radiusFactor?: number };
  /** Agua y sólidos. Los puntos los pinta `GridMap`, iguales en todos lados. */
  drawTerrain(context: TerrainDrawContext): void;
};

export type ScenarioDefinition = {
  id: ScenarioId;
  name: string;
  /** Frase corta para el selector. */
  description: string;
  rows: ScenarioRows;
  theme: ScenarioTheme;
};
