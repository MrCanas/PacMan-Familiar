import { directionDelta, oppositeDirection, type Direction } from '@/entities/direction';
import type { GridMap } from '@/game/GridMap';

const ALL_DIRS: Direction[] = ['up', 'down', 'left', 'right'];

export function manhattanDistance(
  a: { col: number; row: number },
  b: { col: number; row: number }
): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

export function getValidMoves(map: GridMap, col: number, row: number): Direction[] {
  return ALL_DIRS.filter((d) => {
    const { dx, dy } = directionDelta(d);
    return map.canEnter(col + dx, row + dy);
  });
}

/** Elige el siguiente movimiento del fantasma (persecución imperfecta + aleatoriedad). */
export function chooseGhostMove(
  map: GridMap,
  ghostCol: number,
  ghostRow: number,
  currentDirection: Direction,
  playerCol: number,
  playerRow: number,
  chaseProbability: number,
  rng: () => number = Math.random
): Direction {
  const open = getValidMoves(map, ghostCol, ghostRow);
  if (open.length === 0) {
    return currentDirection;
  }

  const opp = oppositeDirection(currentDirection);
  const notBack = open.length > 1 ? open.filter((d) => d !== opp) : open;
  const pool = notBack.length > 0 ? notBack : open;

  if (pool.length === 1) {
    return pool[0]!;
  }

  if (rng() < chaseProbability) {
    let bestDist = Infinity;
    const ties: Direction[] = [];
    for (const d of pool) {
      const { dx, dy } = directionDelta(d);
      const dist = manhattanDistance(
        { col: ghostCol + dx, row: ghostRow + dy },
        { col: playerCol, row: playerRow }
      );
      if (dist < bestDist) {
        bestDist = dist;
        ties.length = 0;
        ties.push(d);
      } else if (dist === bestDist) {
        ties.push(d);
      }
    }
    return ties[Math.floor(rng() * ties.length)]!;
  }

  return pool[Math.floor(rng() * pool.length)]!;
}
