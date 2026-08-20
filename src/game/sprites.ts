/**
 * Caché de caras recortadas en círculo.
 *
 * Las fotos de origen son mucho más grandes que el tamaño al que se dibujan.
 * Reescalarlas en cada frame es caro y produce bordes sucios, así que aquí se
 * pre-renderizan una sola vez por (personaje, diámetro) sobre un canvas
 * offscreen y después solo queda un `drawImage` 1:1.
 */

const cache = new Map<string, HTMLCanvasElement>();

/** Las fotos de origen son cuadrados de 384 px; pasarse no aporta nitidez. */
const MAX_SPRITE_SIZE = 384;

/** Escala actual del contexto (DPR × ajuste al viewport). */
function contextScale(ctx: CanvasRenderingContext2D): number {
  if (typeof ctx.getTransform !== 'function') {
    return 1;
  }
  const { a, b } = ctx.getTransform();
  return Math.hypot(a, b) || 1;
}

/** Redondea al alza en pasos para no generar un sprite por cada píxel de zoom. */
function quantize(size: number): number {
  return Math.min(MAX_SPRITE_SIZE, Math.max(16, Math.ceil(size / 16) * 16));
}

function createCanvas(size: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

/**
 * Devuelve la cara recortada en círculo con el diámetro pedido, o `null` en
 * entornos sin DOM (tests). El resultado se cachea.
 */
export function getFaceSprite(
  id: string,
  image: HTMLImageElement,
  diameter: number
): HTMLCanvasElement | null {
  const size = quantize(diameter);
  const key = `${id}@${size}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const source = { w: image.naturalWidth, h: image.naturalHeight };
  if (!source.w || !source.h) {
    return null;
  }

  const canvas = createCanvas(size);
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    return null;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  const scale = Math.max(size / source.w, size / source.h);
  const dw = source.w * scale;
  const dh = source.h * scale;
  ctx.drawImage(image, (size - dw) / 2, (size - dh) / 2, dw, dh);

  cache.set(key, canvas);
  return canvas;
}

/**
 * Dibuja la cara centrada en (cx, cy). El sprite se rasteriza al tamaño que
 * ocupará en píxeles reales —no en unidades lógicas— para que no se vea
 * borroso en pantallas de alta densidad. Si no hay DOM cae en el recorte
 * directo, visualmente equivalente.
 */
export function drawFace(
  ctx: CanvasRenderingContext2D,
  id: string,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
): void {
  const diameter = radius * 2;
  const sprite = getFaceSprite(id, image, diameter * contextScale(ctx));

  if (sprite) {
    ctx.drawImage(sprite, cx - radius, cy - radius, diameter, diameter);
    return;
  }

  const w = image.naturalWidth || diameter;
  const h = image.naturalHeight || diameter;
  const scale = Math.max(diameter / w, diameter / h);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, cx - (w * scale) / 2, cy - (h * scale) / 2, w * scale, h * scale);
  ctx.restore();
}

/** Cara con aro de color y borde oscuro exterior: legible sobre cualquier fondo. */
export function drawFaceBadge(
  ctx: CanvasRenderingContext2D,
  id: string,
  image: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  accentColor: string,
  options: { ringWidth?: number; glow?: boolean } = {}
): void {
  const ringWidth = options.ringWidth ?? Math.max(2, radius * 0.14);

  ctx.save();
  if (options.glow) {
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = radius * 0.7;
  }
  ctx.fillStyle = '#0b1220';
  ctx.beginPath();
  ctx.arc(cx, cy, radius + ringWidth / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawFace(ctx, id, image, cx, cy, radius);

  ctx.save();
  ctx.lineWidth = ringWidth;
  ctx.strokeStyle = accentColor;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - ringWidth / 2 + 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Solo para tests: vacía la caché de sprites. */
export function clearSpriteCache(): void {
  cache.clear();
}
