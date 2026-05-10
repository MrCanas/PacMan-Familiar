import { CELL_SIZE } from '@/game/constants';

export interface CircleEntity {
  pixelX: number;
  pixelY: number;
  data: { id: string };
}

export function checkProtagonistGhostCollision(
  protagonist: CircleEntity,
  ghosts: CircleEntity[],
  cellSize: number = CELL_SIZE
): CircleEntity | null {
  const threshold = cellSize * 0.7;
  for (const g of ghosts) {
    const dx = protagonist.pixelX - g.pixelX;
    const dy = protagonist.pixelY - g.pixelY;
    if (Math.hypot(dx, dy) < threshold) {
      return g;
    }
  }
  return null;
}
