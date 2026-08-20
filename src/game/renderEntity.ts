import type { Direction } from '@/entities/direction';
import { CELL_SIZE, HUD_HEIGHT } from '@/game/constants';
import { drawFace } from '@/game/sprites';

export type EntityRender = {
  id: string;
  image: HTMLImageElement;
  col: number;
  row: number;
  direction: Direction;
  accentColor: string;
};

const DIRECTION_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

function cellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: HUD_HEIGHT + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

/** Sombra ovalada para despegar al personaje del suelo del laberinto. */
function drawGroundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.88, r * 0.78, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Protagonista: la cara dentro de un aro amarillo tipo Pac-Man que abre y
 * cierra la boca en la dirección de avance.
 */
export function drawHero(
  ctx: CanvasRenderingContext2D,
  entity: EntityRender,
  timeMs: number
): void {
  const { x, y } = cellCenter(entity.col, entity.row);
  const outerR = CELL_SIZE * 0.49;
  const ringW = CELL_SIZE * 0.17;
  const faceR = outerR - ringW;
  const ringR = outerR - ringW / 2;

  // La boca se abre entre 6° y 46° a unos 5 ciclos por segundo.
  const chomp = (Math.sin(timeMs / 95) + 1) / 2;
  const mouth = (6 + chomp * 40) * (Math.PI / 180);
  const angle = DIRECTION_ANGLE[entity.direction];
  const from = angle + mouth;
  const to = angle - mouth + Math.PI * 2;

  drawGroundShadow(ctx, x, y, outerR);

  ctx.save();
  ctx.lineCap = 'butt';

  // Filo oscuro bajo el aro: lo despega de las paredes azules.
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
  ctx.lineWidth = ringW + CELL_SIZE * 0.08;
  ctx.beginPath();
  ctx.arc(x, y, ringR, from, to);
  ctx.stroke();

  ctx.shadowColor = 'rgba(250, 204, 21, 0.9)';
  ctx.shadowBlur = CELL_SIZE * 0.45;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = ringW;
  ctx.beginPath();
  ctx.arc(x, y, ringR, from, to);
  ctx.stroke();
  ctx.restore();

  drawFace(ctx, entity.id, entity.image, x, y, faceR);

  ctx.save();
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
  ctx.lineWidth = Math.max(1, CELL_SIZE * 0.04);
  ctx.beginPath();
  ctx.arc(x, y, faceR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Silueta clásica de fantasma (cúpula + faldón ondulado) con la cara dentro. */
function ghostBodyPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  wavePhase: number
): void {
  const left = x - w / 2;
  const right = x + w / 2;
  const top = y - h / 2;
  const bottom = y + h / 2;
  const domeR = w / 2;

  ctx.beginPath();
  ctx.arc(x, top + domeR, domeR, Math.PI, 0);
  ctx.lineTo(right, bottom - domeR * 0.28);

  // Faldón: tres ondas que se desplazan para simular flotación.
  const feet = 3;
  const step = w / feet;
  for (let i = 0; i < feet; i++) {
    const startX = right - i * step;
    const endX = startX - step;
    const dip = i % 2 === 0 ? 1 : -1;
    const wave = Math.sin(wavePhase + i) * h * 0.05;
    ctx.quadraticCurveTo(
      startX - step / 2,
      bottom + dip * h * 0.16 + wave,
      endX,
      bottom - domeR * 0.28
    );
  }

  ctx.lineTo(left, top + domeR);
  ctx.closePath();
}

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  entity: EntityRender,
  timeMs: number
): void {
  const { x, y } = cellCenter(entity.col, entity.row);
  // El cuerpo desborda un poco la celda: así queda sitio para que la cara
  // siga siendo reconocible sin comerse la silueta de fantasma.
  const w = CELL_SIZE * 1.06;
  const h = CELL_SIZE * 1.14;
  const wavePhase = timeMs / 140;
  // Flotación suave para que se note que están vivos.
  const bob = Math.sin(timeMs / 260 + entity.col + entity.row) * CELL_SIZE * 0.04;
  const cy = y + bob;
  const faceR = w * 0.33;
  const faceY = cy - h * 0.08;

  drawGroundShadow(ctx, x, y, w / 2);

  ctx.save();
  ctx.shadowColor = entity.accentColor;
  ctx.shadowBlur = CELL_SIZE * 0.35;
  ctx.fillStyle = entity.accentColor;
  ghostBodyPath(ctx, x, cy, w, h, wavePhase);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
  ctx.lineWidth = Math.max(1, CELL_SIZE * 0.05);
  ghostBodyPath(ctx, x, cy, w, h, wavePhase);
  ctx.stroke();
  ctx.restore();

  drawFace(ctx, entity.id, entity.image, x, faceY, faceR);

  // Filo oscuro fino: separa la foto del color del cuerpo sin taparlo.
  ctx.save();
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
  ctx.lineWidth = Math.max(1, CELL_SIZE * 0.04);
  ctx.beginPath();
  ctx.arc(x, faceY, faceR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
