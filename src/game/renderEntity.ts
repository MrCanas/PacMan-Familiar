import { CELL_SIZE, HUD_HEIGHT } from '@/game/constants';

export function drawCharacterFace(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  col: number,
  row: number,
  accentColor: string
): void {
  const pixelX = col * CELL_SIZE + CELL_SIZE / 2;
  const pixelY = HUD_HEIGHT + row * CELL_SIZE + CELL_SIZE / 2;
  const r = CELL_SIZE * 0.38;
  const diameter = r * 2;
  const scale = Math.max(diameter / image.naturalWidth, diameter / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  const dx = pixelX - dw / 2;
  const dy = pixelY - dh / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, r, 0, Math.PI * 2);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}
