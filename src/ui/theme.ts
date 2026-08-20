import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';

export const PALETTE = {
  backdropTop: '#16224f',
  backdropBottom: '#050b1c',
  panel: 'rgba(15, 23, 42, 0.82)',
  panelBorder: 'rgba(96, 165, 250, 0.35)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#22c55e',
  accent: '#38bdf8',
  warm: '#f97316',
  disabled: '#334155',
  onSolid: '#04121f',
} as const;

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Alto mínimo de un control. Con el canvas escalado al ancho de un móvil
 * (~0,6×) esto equivale a los 44 px CSS recomendados para el dedo.
 */
export const TOUCH_TARGET = 72;

export function hitTest(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Fondo común de las pantallas de menú. */
export function drawBackdrop(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, PALETTE.backdropTop);
  gradient.addColorStop(1, PALETTE.backdropBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

export function drawPanel(ctx: CanvasRenderingContext2D, rect: Rect, radius = 20): void {
  ctx.save();
  ctx.fillStyle = PALETTE.panel;
  ctx.strokeStyle = PALETTE.panelBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawTitle(ctx: CanvasRenderingContext2D, text: string, y: number): void {
  ctx.save();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
  ctx.shadowBlur = 18;
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
  ctx.restore();
}

export function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  color: string = PALETTE.textMuted
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
  ctx.restore();
}

export type ButtonStyle = {
  label: string;
  /** Color de relleno cuando la variante es sólida. */
  color?: string;
  /** `muted` = fondo neutro con texto claro (opción no elegida). */
  variant?: 'solid' | 'muted';
  enabled?: boolean;
  selected?: boolean;
  fontSize?: number;
};

/** Botón redondeado con relieve; los deshabilitados quedan apagados. */
export function drawButton(ctx: CanvasRenderingContext2D, rect: Rect, style: ButtonStyle): void {
  const enabled = style.enabled ?? true;
  const muted = style.variant === 'muted';
  const radius = Math.min(16, rect.h / 2);

  let background: string;
  let label: string;
  if (!enabled) {
    background = PALETTE.disabled;
    label = PALETTE.textMuted;
  } else if (muted) {
    background = PALETTE.disabled;
    label = PALETTE.text;
  } else {
    background = style.color ?? PALETTE.accent;
    label = PALETTE.onSolid;
  }

  ctx.save();
  if (enabled) {
    ctx.shadowColor = 'rgba(2, 6, 23, 0.55)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  ctx.fill();
  ctx.restore();

  if (style.selected) {
    ctx.save();
    ctx.strokeStyle = PALETTE.text;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, Math.max(2, radius - 2));
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = label;
  ctx.font = `700 ${style.fontSize ?? 20}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.label, rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.restore();
}

/** Etiqueta bajo un retrato, con sombra para que se lea sobre cualquier fondo. */
export function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  color: string = PALETTE.text
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(2, 6, 23, 0.9)';
  ctx.shadowBlur = 6;
  ctx.fillText(text, cx, y);
  ctx.restore();
}
