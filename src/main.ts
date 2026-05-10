import '@/styles/main.css';

import { CHARACTERS, type CharacterData } from '@/data/characters';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
  throw new Error('No se encontró el canvas #game');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('No se pudo obtener el contexto 2D del canvas');
}

/** Referencias locales para que el narrowing sobreviva tras `await` en `main`. */
const gameCanvas = canvas;
const gameCtx = ctx;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

function drawImageCoverCircle(
  context: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
): void {
  const diameter = radius * 2;
  const scale = Math.max(diameter / img.naturalWidth, diameter / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = cx - dw / 2;
  const dy = cy - dh / 2;

  context.save();
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(img, dx, dy, dw, dh);
  context.restore();
}

function drawCharacterPortrait(
  context: CanvasRenderingContext2D,
  character: CharacterData,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
): void {
  drawImageCoverCircle(context, img, cx, cy, radius);

  context.save();
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.strokeStyle = character.accentColor;
  context.lineWidth = 4;
  context.stroke();
  context.restore();

  context.save();
  context.fillStyle = '#e2e8f0';
  context.font = '600 14px system-ui, -apple-system, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillText(character.name, cx, cy + radius + 10);
  context.restore();
}

async function main(): Promise<void> {
  const images = await Promise.all(CHARACTERS.map((c) => loadImage(c.imagePath)));

  gameCtx.fillStyle = '#1e293b';
  gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  gameCtx.fillStyle = '#fbbf24';
  gameCtx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  gameCtx.textAlign = 'center';
  gameCtx.textBaseline = 'top';
  gameCtx.fillText('Pac-Man Familiar', gameCanvas.width / 2, 24);

  const marginX = 40;
  const rowY = 200;
  const slotWidth = (gameCanvas.width - marginX * 2) / CHARACTERS.length;
  const faceRadius = Math.min(52, slotWidth / 2 - 8);

  CHARACTERS.forEach((character, i) => {
    const img = images[i];
    if (!img) return;
    const cx = marginX + slotWidth * (i + 0.5);
    const cy = rowY;
    drawCharacterPortrait(gameCtx, character, img, cx, cy, faceRadius);
  });
}

void main().catch((err) => {
  console.error(err);
  gameCtx.fillStyle = '#1e293b';
  gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  gameCtx.fillStyle = '#f87171';
  gameCtx.font = '16px system-ui, sans-serif';
  gameCtx.textAlign = 'center';
  gameCtx.fillText(
    err instanceof Error ? err.message : 'Error al cargar personajes',
    gameCanvas.width / 2,
    gameCanvas.height / 2
  );
});
