/** Celdas del laberinto (matriz numérica centralizada). */
export const Cell = {
  PATH: 0,
  WALL: 1,
  PELLET: 2,
  PLAYER_SPAWN: 3,
  GHOST_SPAWN: 4,
} as const;

export type CellValue = (typeof Cell)[keyof typeof Cell];
