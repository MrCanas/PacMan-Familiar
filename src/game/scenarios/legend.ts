import { MAZE_COLS, MAZE_ROWS } from '@/game/constants';
import { mirrorRow } from '@/game/mazeTemplate';
import {
  Decor,
  Terrain,
  type DecorValue,
  type LevelLayers,
  type TerrainValue,
  type Vec,
} from '@/game/terrain';
import type { ScenarioDefinition, ScenarioRows } from '@/game/scenarios/types';

type Tile = {
  terrain: TerrainValue;
  decor: DecorValue;
  pellet: boolean;
  /** 0 = nada, 3 = jugador, 4 = fantasma. */
  spawn: 0 | 3 | 4;
};

/**
 * Alfabeto con el que se escriben los escenarios. Es lo que se ve al abrir
 * `classicMaze.ts` o `patioPiscina.ts`, así que conviene que se lea solo.
 */
export const CHAR_LEGEND: Record<string, Tile> = {
  '#': { terrain: Terrain.SOLID, decor: Decor.WALL, pellet: false, spawn: 0 },
  H: { terrain: Terrain.SOLID, decor: Decor.HEDGE, pellet: false, spawn: 0 },
  C: { terrain: Terrain.SOLID, decor: Decor.CHAIR, pellet: false, spawn: 0 },
  T: { terrain: Terrain.SOLID, decor: Decor.TABLE, pellet: false, spawn: 0 },
  '.': { terrain: Terrain.GROUND, decor: Decor.NONE, pellet: true, spawn: 0 },
  ' ': { terrain: Terrain.GROUND, decor: Decor.NONE, pellet: false, spawn: 0 },
  '~': { terrain: Terrain.WATER, decor: Decor.NONE, pellet: false, spawn: 0 },
  o: { terrain: Terrain.WATER, decor: Decor.NONE, pellet: true, spawn: 0 },
  // Las salidas son suelo limpio: nadie empieza encima de un punto.
  P: { terrain: Terrain.GROUND, decor: Decor.NONE, pellet: false, spawn: 3 },
  G: { terrain: Terrain.GROUND, decor: Decor.NONE, pellet: false, spawn: 4 },
};

export class ScenarioParseError extends Error {}

/** Expande las filas del escenario a `MAZE_ROWS` líneas de `MAZE_COLS` caracteres. */
export function expandRows(rows: ScenarioRows): string[] {
  const lines = rows.kind === 'mirrored' ? rows.halfRows.map(mirrorRow) : rows.rows;

  if (lines.length !== MAZE_ROWS) {
    throw new ScenarioParseError(
      `El escenario debe tener ${MAZE_ROWS} filas, tiene ${lines.length}`
    );
  }
  lines.forEach((line, row) => {
    if (line.length !== MAZE_COLS) {
      throw new ScenarioParseError(
        `La fila ${row} debe tener ${MAZE_COLS} columnas, tiene ${line.length}`
      );
    }
  });
  return lines;
}

export function parseScenario(definition: ScenarioDefinition): LevelLayers {
  const lines = expandRows(definition.rows);

  const terrain: TerrainValue[][] = [];
  const decor: DecorValue[][] = [];
  const pellets: boolean[][] = [];
  const spawnMarks: number[][] = [];
  const ghostSpawns: Vec[] = [];
  let playerSpawn: Vec | null = null;
  let playerSpawnCount = 0;
  let pelletCount = 0;

  for (let row = 0; row < MAZE_ROWS; row++) {
    const line = lines[row]!;
    terrain[row] = [];
    decor[row] = [];
    pellets[row] = [];
    spawnMarks[row] = [];

    for (let col = 0; col < MAZE_COLS; col++) {
      const ch = line[col]!;
      const tile = CHAR_LEGEND[ch];
      if (!tile) {
        throw new ScenarioParseError(
          `Símbolo desconocido "${ch}" en la fila ${row}, columna ${col} de "${definition.id}"`
        );
      }

      terrain[row]![col] = tile.terrain;
      decor[row]![col] = tile.decor;
      pellets[row]![col] = tile.pellet;
      spawnMarks[row]![col] = tile.spawn;
      if (tile.pellet) pelletCount += 1;
      if (tile.spawn === 4) ghostSpawns.push({ col, row });
      if (tile.spawn === 3) {
        playerSpawnCount += 1;
        // Al reflejar, la P del centro sale duplicada; nos quedamos con una.
        playerSpawn = { col, row };
      }
    }
  }

  if (!playerSpawn) {
    throw new ScenarioParseError(`El escenario "${definition.id}" no tiene salida P del jugador`);
  }
  if (definition.rows.kind === 'full' && playerSpawnCount > 1) {
    throw new ScenarioParseError(
      `El escenario "${definition.id}" tiene ${playerSpawnCount} salidas P; debe haber una`
    );
  }
  if (ghostSpawns.length === 0) {
    throw new ScenarioParseError(`El escenario "${definition.id}" no tiene salidas G de fantasma`);
  }

  return { terrain, decor, pellets, spawnMarks, pelletCount, playerSpawn, ghostSpawns };
}
