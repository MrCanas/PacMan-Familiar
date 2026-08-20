import { describe, expect, it } from 'vitest';

import { MAZE_COLS, MAZE_ROWS } from '@/game/constants';
import { GridMap } from '@/game/GridMap';
import { expandRows, parseScenario, ScenarioParseError } from '@/game/scenarios/legend';
import { CLASSIC_MAZE, PATIO_PISCINA, SCENARIOS } from '@/game/scenarios';
import { neonTheme } from '@/game/scenarios/themes/neon';
import type { ScenarioDefinition } from '@/game/scenarios/types';
import { Decor, Terrain } from '@/game/terrain';

function key(v: { col: number; row: number }): string {
  return `${v.col},${v.row}`;
}

/** Todo lo que se puede pisar partiendo de la salida del jugador. */
function reachableFrom(map: GridMap, start: { col: number; row: number }): Set<string> {
  const seen = new Set<string>([key(start)]);
  const queue = [start];
  const deltas = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const [dc, dr] of deltas) {
      const next = { col: cur.col + dc!, row: cur.row + dr! };
      if (!map.canEnter(next.col, next.row) || seen.has(key(next))) continue;
      seen.add(key(next));
      queue.push(next);
    }
  }
  return seen;
}

describe.each(SCENARIOS.map((s) => [s.name, s] as const))('escenario %s', (_name, scenario) => {
  const map = GridMap.fromScenario(scenario);
  const { protagonist, ghosts } = map.getSpawnPositions();
  const reachable = reachableFrom(map, protagonist);

  it('mide exactamente lo que mide el tablero', () => {
    expect(expandRows(scenario.rows)).toHaveLength(MAZE_ROWS);
    for (const line of expandRows(scenario.rows)) {
      expect(line).toHaveLength(MAZE_COLS);
    }
  });

  it('tiene salida de jugador pisable y al menos cuatro de fantasma', () => {
    expect(map.canEnter(protagonist.col, protagonist.row)).toBe(true);
    expect(ghosts.length).toBeGreaterThanOrEqual(4);
    for (const g of ghosts) {
      expect(map.canEnter(g.col, g.row)).toBe(true);
    }
  });

  it('tiene puntos que comer', () => {
    expect(map.pelletsRemaining()).toBeGreaterThan(0);
  });

  it('todos los puntos se pueden alcanzar desde la salida del jugador', () => {
    const inalcanzables: string[] = [];
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (map.hasPellet(col, row) && !reachable.has(key({ col, row }))) {
          inalcanzables.push(key({ col, row }));
        }
      }
    }
    // Si esto falla, el nivel es imposible de ganar: no se puede vaciar.
    expect(inalcanzables).toEqual([]);
  });

  it('todos los fantasmas pueden llegar al jugador', () => {
    const encerrados = ghosts.filter((g) => !reachable.has(key(g))).map(key);
    expect(encerrados).toEqual([]);
  });

  it('no deja bolsas de suelo aisladas', () => {
    const aisladas: string[] = [];
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (map.canEnter(col, row) && !reachable.has(key({ col, row }))) {
          aisladas.push(key({ col, row }));
        }
      }
    }
    expect(aisladas).toEqual([]);
  });

  it('nadie empieza encima de un punto', () => {
    expect(map.hasPellet(protagonist.col, protagonist.row)).toBe(false);
    for (const g of ghosts) {
      expect(map.hasPellet(g.col, g.row)).toBe(false);
    }
  });

  it('trae tema con fondo, color de punto y pincel de terreno', () => {
    expect(typeof scenario.theme.drawTerrain).toBe('function');
    expect(scenario.theme.background).toMatch(/^#/);
    expect(scenario.theme.pellet.fill).toMatch(/^#/);
  });
});

describe('patio con piscina', () => {
  const map = GridMap.fromScenario(PATIO_PISCINA);

  it('tiene piscina, y en ella se va a 0,8x', () => {
    let agua = 0;
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (map.terrainAt(col, row) === Terrain.WATER) {
          agua += 1;
          expect(map.speedFactorAt(col, row)).toBeCloseTo(0.8);
          expect(map.canEnter(col, row)).toBe(true);
        }
      }
    }
    expect(agua).toBeGreaterThan(40);
  });

  it('hay puntos flotando dentro del agua', () => {
    let flotadores = 0;
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (map.terrainAt(col, row) === Terrain.WATER && map.hasPellet(col, row)) flotadores += 1;
      }
    }
    expect(flotadores).toBeGreaterThan(0);
  });

  it('las tumbonas y las mesas bloquean igual que un seto', () => {
    const sillas: { col: number; row: number }[] = [];
    const mesas: { col: number; row: number }[] = [];
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (map.decorAt(col, row) === Decor.CHAIR) sillas.push({ col, row });
        if (map.decorAt(col, row) === Decor.TABLE) mesas.push({ col, row });
      }
    }
    expect(sillas.length).toBeGreaterThan(0);
    expect(mesas.length).toBeGreaterThan(0);
    for (const p of [...sillas, ...mesas]) {
      expect(map.canEnter(p.col, p.row)).toBe(false);
      expect(map.isObstacle(p.col, p.row)).toBe(true);
    }
  });

  it('en el césped se va a velocidad normal', () => {
    const { protagonist } = map.getSpawnPositions();
    expect(map.terrainAt(protagonist.col, protagonist.row)).toBe(Terrain.GROUND);
    expect(map.speedFactorAt(protagonist.col, protagonist.row)).toBe(1);
  });
});

describe('laberinto clásico', () => {
  const map = GridMap.fromScenario(CLASSIC_MAZE);

  it('no tiene agua: todo es suelo o muro', () => {
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        expect(map.terrainAt(col, row)).not.toBe(Terrain.WATER);
        expect(map.speedFactorAt(col, row)).toBe(1);
      }
    }
  });

  it('sus sólidos son muros de neón, no muebles', () => {
    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let col = 0; col < MAZE_COLS; col++) {
        if (map.isWall(col, row)) {
          expect(map.decorAt(col, row)).toBe(Decor.WALL);
          expect(map.isObstacle(col, row)).toBe(false);
        }
      }
    }
  });
});

describe('parseScenario rechaza escenarios rotos', () => {
  function withRows(rows: string[]): ScenarioDefinition {
    return {
      id: 'patio',
      name: 'prueba',
      description: 'prueba',
      rows: { kind: 'full', rows },
      theme: neonTheme,
    };
  }
  const good = expandRows(PATIO_PISCINA.rows);

  it('número de filas incorrecto', () => {
    expect(() => parseScenario(withRows(good.slice(0, 5)))).toThrow(ScenarioParseError);
  });

  it('fila con ancho incorrecto', () => {
    const rows = [...good];
    rows[1] = 'HH';
    expect(() => parseScenario(withRows(rows))).toThrow(/columnas/);
  });

  it('símbolo desconocido', () => {
    const rows = [...good];
    rows[1] = 'H........?.........H';
    expect(() => parseScenario(withRows(rows))).toThrow(/Símbolo desconocido/);
  });

  it('sin salida de jugador', () => {
    const rows = good.map((r) => r.replace('P', '.'));
    expect(() => parseScenario(withRows(rows))).toThrow(/salida P/);
  });

  it('dos salidas de jugador en un escenario no simétrico', () => {
    const rows = [...good];
    rows[1] = 'HP................PH';
    expect(() => parseScenario(withRows(rows))).toThrow(/salidas P/);
  });

  it('sin salidas de fantasma', () => {
    const rows = good.map((r) => r.replace(/G/g, '.'));
    expect(() => parseScenario(withRows(rows))).toThrow(/salidas G/);
  });
});

describe('el laberinto reflejado sigue siendo simétrico', () => {
  it('cada columna es igual que su espejo', () => {
    for (const line of expandRows(CLASSIC_MAZE.rows)) {
      for (let col = 0; col < MAZE_COLS; col++) {
        expect(line[col]).toBe(line[MAZE_COLS - 1 - col]!);
      }
    }
  });
});
