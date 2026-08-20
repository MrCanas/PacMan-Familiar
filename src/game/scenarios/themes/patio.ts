import { Decor } from '@/game/terrain';
import type { ScenarioTheme, TerrainDrawContext } from '@/game/scenarios/types';

const GRASS_DARK = '#166534';
const GRASS_LIGHT = '#1c8043';
const WATER_DEEP = '#0369a1';
const WATER_SHALLOW = '#38bdf8';
const COPING = '#e2e8f0';
// El seto tiene que leerse como pared, no como cesped un poco distinto: por eso
// es verde casi negro con la copa clara encima.
const HEDGE = '#052e16';
const HEDGE_EDGE = '#22c55e';
const WOOD = '#b45309';
const WOOD_DARK = '#78350f';

/** Césped a cuadros, como el corte del cortacésped. */
function drawGrass(c: TerrainDrawContext): void {
  const { ctx, cols, rows, cellSize } = c;
  ctx.save();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = (col + row) % 2 === 0 ? GRASS_DARK : GRASS_LIGHT;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
  ctx.restore();
}

/**
 * La piscina se fusiona en una sola figura y se le pinta el bordillo por
 * fuera, para que se lea como un vaso de agua y no como celdas azules sueltas.
 */
function drawPool(c: TerrainDrawContext): void {
  const { ctx, cols, rows, cellSize, timeMs } = c;
  const water = new Path2D();
  const coping = new Path2D();
  let any = false;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!c.isWater(col, row)) continue;
      any = true;
      const x = col * cellSize;
      const y = row * cellSize;
      water.rect(x, y, cellSize, cellSize);

      if (!c.isWater(col - 1, row)) {
        coping.moveTo(x, y);
        coping.lineTo(x, y + cellSize);
      }
      if (!c.isWater(col + 1, row)) {
        coping.moveTo(x + cellSize, y);
        coping.lineTo(x + cellSize, y + cellSize);
      }
      if (!c.isWater(col, row - 1)) {
        coping.moveTo(x, y);
        coping.lineTo(x + cellSize, y);
      }
      if (!c.isWater(col, row + 1)) {
        coping.moveTo(x, y + cellSize);
        coping.lineTo(x + cellSize, y + cellSize);
      }
    }
  }
  if (!any) return;

  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, rows * cellSize);
  gradient.addColorStop(0, WATER_SHALLOW);
  gradient.addColorStop(1, WATER_DEEP);
  ctx.fillStyle = gradient;
  ctx.fill(water);

  // Olas: líneas claras que se desplazan despacio dentro del vaso.
  ctx.clip(water);
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#f0f9ff';
  ctx.lineWidth = Math.max(1.5, cellSize * 0.09);
  const phase = (timeMs / 1400) % 1;
  for (let i = -1; i < rows; i++) {
    const y = (i + phase) * cellSize * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= cols * cellSize; x += cellSize / 2) {
      ctx.lineTo(x, y + Math.sin((x / cellSize + timeMs / 700) * 1.2) * cellSize * 0.12);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = COPING;
  ctx.lineWidth = Math.max(2, cellSize * 0.11);
  ctx.lineCap = 'square';
  ctx.stroke(coping);
  ctx.restore();
}

/** Setos: bloque verde con el borde superior más claro, como recortado. */
function drawHedges(c: TerrainDrawContext): void {
  const { ctx, cols, rows, cellSize } = c;
  const body = new Path2D();
  const top = new Path2D();
  const inset = cellSize * 0.06;
  let any = false;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!c.isSolidOf(col, row, Decor.HEDGE)) continue;
      any = true;
      const openLeft = !c.isSolidOf(col - 1, row, Decor.HEDGE);
      const openRight = !c.isSolidOf(col + 1, row, Decor.HEDGE);
      const openUp = !c.isSolidOf(col, row - 1, Decor.HEDGE);
      const openDown = !c.isSolidOf(col, row + 1, Decor.HEDGE);

      const x0 = col * cellSize + (openLeft ? inset : 0);
      const x1 = (col + 1) * cellSize - (openRight ? inset : 0);
      const y0 = row * cellSize + (openUp ? inset : 0);
      const y1 = (row + 1) * cellSize - (openDown ? inset : 0);
      body.rect(x0, y0, x1 - x0, y1 - y0);
      if (openUp) {
        top.rect(x0, y0, x1 - x0, cellSize * 0.22);
      }
    }
  }
  if (!any) return;

  ctx.save();
  ctx.fillStyle = HEDGE;
  ctx.shadowColor = 'rgba(2, 20, 8, 0.6)';
  ctx.shadowBlur = cellSize * 0.2;
  ctx.shadowOffsetY = cellSize * 0.08;
  ctx.fill(body);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = HEDGE_EDGE;
  ctx.globalAlpha = 0.75;
  ctx.fill(top);
  ctx.restore();
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // Tumbona vista desde arriba: respaldo, asiento y dos patas.
  ctx.save();
  ctx.fillStyle = WOOD;
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  ctx.roundRect(x + s * 0.22, y + s * 0.12, s * 0.56, s * 0.26, s * 0.08);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x + s * 0.16, y + s * 0.44, s * 0.68, s * 0.42, s * 0.1);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.save();
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = Math.max(1, s * 0.06);
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2, s * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Sombrilla plegada en el centro.
  ctx.fillStyle = WOOD_DARK;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s / 2, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFurniture(c: TerrainDrawContext): void {
  const { ctx, cols, rows, cellSize } = c;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const decor = c.decorAt(col, row);
      const x = col * cellSize;
      const y = row * cellSize;
      if (decor === Decor.CHAIR) drawChair(ctx, x, y, cellSize);
      else if (decor === Decor.TABLE) drawTable(ctx, x, y, cellSize);
    }
  }
}

export const patioTheme: ScenarioTheme = {
  background: GRASS_DARK,
  // Dentro del agua los puntos son flotadores: se ven mejor en blanco cálido.
  pellet: { fill: '#fff7ed', glow: 'rgba(255, 237, 213, 0.85)', radiusFactor: 0.12 },
  drawTerrain(c) {
    drawGrass(c);
    drawPool(c);
    drawHedges(c);
    drawFurniture(c);
  },
};
