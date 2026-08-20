import { Decor } from '@/game/terrain';
import type { ScenarioTheme, TerrainDrawContext } from '@/game/scenarios/types';

/**
 * Los muros se dibujan como un bloque continuo: cada celda se expande hacia
 * los vecinos que también son muro y se recorta contra los pasillos, de modo
 * que el contorno queda como un tubo de neón en lugar de un mosaico.
 */
function drawWalls(c: TerrainDrawContext): void {
  const { ctx, cols, rows, cellSize } = c;
  const pad = cellSize * 0.12;
  const fill = new Path2D();
  const outline = new Path2D();
  const solid = (col: number, row: number): boolean => c.isSolidOf(col, row, Decor.WALL);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!solid(col, row)) {
        continue;
      }
      const openLeft = !solid(col - 1, row);
      const openRight = !solid(col + 1, row);
      const openUp = !solid(col, row - 1);
      const openDown = !solid(col, row + 1);

      const x0 = col * cellSize + (openLeft ? pad : 0);
      const x1 = (col + 1) * cellSize - (openRight ? pad : 0);
      const y0 = row * cellSize + (openUp ? pad : 0);
      const y1 = (row + 1) * cellSize - (openDown ? pad : 0);
      fill.rect(x0, y0, x1 - x0, y1 - y0);

      if (openLeft) {
        outline.moveTo(x0, y0);
        outline.lineTo(x0, y1);
      }
      if (openRight) {
        outline.moveTo(x1, y0);
        outline.lineTo(x1, y1);
      }
      if (openUp) {
        outline.moveTo(x0, y0);
        outline.lineTo(x1, y0);
      }
      if (openDown) {
        outline.moveTo(x0, y1);
        outline.lineTo(x1, y1);
      }
    }
  }

  ctx.save();
  ctx.fillStyle = '#111f4d';
  ctx.fill(fill);
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = Math.max(1.5, cellSize * 0.075);
  ctx.lineCap = 'square';
  ctx.shadowColor = 'rgba(96, 165, 250, 0.85)';
  ctx.shadowBlur = cellSize * 0.3;
  ctx.stroke(outline);
  ctx.restore();
}

export const neonTheme: ScenarioTheme = {
  background: '#050b1c',
  pellet: { fill: '#fde68a', glow: 'rgba(253, 224, 71, 0.7)' },
  drawTerrain: drawWalls,
};
