/**
 * Un escenario se guarda en capas paralelas en vez de en una sola matriz de
 * celdas: el terreno dice por dónde se puede pasar y a qué velocidad, el
 * decorado sólo dice cómo se dibuja, y los puntos son lo único que cambia
 * durante la partida. Meterlo todo en un único número obligaría a inventar
 * valores como «agua con punto» o «silla», que se multiplican entre sí.
 */

/** Por dónde se puede pasar y a qué velocidad. */
export const Terrain = {
  /** Suelo normal: pasillo del laberinto o césped del patio. */
  GROUND: 0,
  /** Piscina: se puede nadar, pero más despacio. */
  WATER: 1,
  /** Muro, seto, silla o mesa: no se pasa. */
  SOLID: 2,
} as const;

export type TerrainValue = (typeof Terrain)[keyof typeof Terrain];

/** Cómo se dibuja cada celda. No afecta al juego, sólo al pincel. */
export const Decor = {
  NONE: 0,
  /** Muro de neón del laberinto clásico. */
  WALL: 1,
  /** Seto del patio. */
  HEDGE: 2,
  CHAIR: 3,
  TABLE: 4,
} as const;

export type DecorValue = (typeof Decor)[keyof typeof Decor];

/**
 * Multiplicador de velocidad por terreno. Menor que 1 significa ir más lento:
 * en la piscina se avanza a 0,8x, así que cada paso tarda 1/0,8 = 1,25 veces
 * más. Vale igual para el protagonista y para los fantasmas.
 */
export const TERRAIN_SPEED: Record<TerrainValue, number> = {
  [Terrain.GROUND]: 1,
  [Terrain.WATER]: 0.8,
  // Nunca se pisa; el valor neutro evita divisiones raras si algo falla.
  [Terrain.SOLID]: 1,
};

export type Vec = { col: number; row: number };

/** Un escenario ya interpretado y listo para jugar. */
export type LevelLayers = {
  terrain: TerrainValue[][];
  decor: DecorValue[][];
  /** Mutable: se vacía según se van comiendo. */
  pellets: boolean[][];
  /** 0 = nada, 3 = salida del jugador, 4 = salida de fantasma. */
  spawnMarks: number[][];
  /** Contador vivo, para no rebarrer el tablero en cada paso. */
  pelletCount: number;
  playerSpawn: Vec;
  ghostSpawns: Vec[];
};
