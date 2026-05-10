import type { CharacterData } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';

export type FaceLayout = { id: string; cx: number; cy: number; r: number };

export function getCharacterAtPosition(x: number, y: number, layout: FaceLayout[]): string | null {
  for (const f of layout) {
    const dx = x - f.cx;
    const dy = y - f.cy;
    const r = f.r;
    if (dx * dx + dy * dy <= r * r) {
      return f.id;
    }
  }
  return null;
}

export function isNextButtonEnabled(selectedId: string | null): boolean {
  return selectedId !== null;
}

const FACE_R = 60;
const TITLE_Y = 56;
const ROW_Y = 180;
const BTN_MARGIN = 24;

export class CharacterPicker {
  private selectedId: string | null = null;
  private layout: FaceLayout[] = [];
  private nextButton = { x: 0, y: 0, w: 0, h: 0, enabled: false };

  constructor(
    private readonly characters: CharacterData[],
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onConfirm: (id: string) => void
  ) {}

  getLayout(): FaceLayout[] {
    return this.layout;
  }

  private rebuildLayout(): void {
    const n = this.characters.length;
    const marginX = 32;
    const slot = (CANVAS_WIDTH - marginX * 2) / n;
    this.layout = this.characters.map((c, i) => ({
      id: c.id,
      cx: marginX + slot * (i + 0.5),
      cy: ROW_Y,
      r: FACE_R,
    }));
    this.nextButton = {
      x: CANVAS_WIDTH / 2 - 90,
      y: CANVAS_HEIGHT - BTN_MARGIN - 44,
      w: 180,
      h: 44,
      enabled: isNextButtonEnabled(this.selectedId),
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.rebuildLayout();
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¿Quién es el protagonista?', CANVAS_WIDTH / 2, TITLE_Y);

    for (let i = 0; i < this.characters.length; i++) {
      const ch = this.characters[i]!;
      const slot = this.layout[i]!;
      const img = this.getImage(ch.id);
      if (!img) continue;
      const { cx, cy, r } = slot;
      const selected = this.selectedId === ch.id;
      const borderW = selected ? 6 : 3;

      const diameter = r * 2;
      const scale = Math.max(diameter / img.naturalWidth, diameter / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = cx - dw / 2;
      const dy = cy - dh / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = ch.accentColor;
      ctx.lineWidth = borderW;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(ch.name, cx, cy + r + 8);
    }

    const btn = this.nextButton;
    ctx.fillStyle = btn.enabled ? '#22c55e' : '#475569';
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Siguiente →', btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();
  }

  handleClick(x: number, y: number): void {
    this.rebuildLayout();
    const hit = getCharacterAtPosition(x, y, this.layout);
    if (hit) {
      this.selectedId = hit;
      console.log(`[sonido placeholder] selección: ${hit}`);
      return;
    }
    const btn = this.nextButton;
    if (
      btn.enabled &&
      x >= btn.x &&
      x <= btn.x + btn.w &&
      y >= btn.y &&
      y <= btn.y + btn.h
    ) {
      if (this.selectedId) {
        this.onConfirm(this.selectedId);
      }
    }
  }

  reset(): void {
    this.selectedId = null;
  }

  /** Restaura selección desde `localStorage` u otra fuente. */
  restoreSelection(id: string | null): void {
    this.selectedId = id;
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }
}
