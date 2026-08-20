import type { CharacterData } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { drawFaceBadge } from '@/game/sprites';
import {
  drawBackdrop,
  drawButton,
  drawCaption,
  drawSubtitle,
  drawTitle,
  hitTest,
  PALETTE,
  TOUCH_TARGET,
  type Rect,
} from '@/ui/theme';

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

const FACE_R = 58;
const TITLE_Y = 62;
const SUBTITLE_Y = 100;
const ROW_Y = 236;
const BTN_MARGIN = 28;

export class CharacterPicker {
  private selectedId: string | null = null;
  private layout: FaceLayout[] = [];
  private nextButton: Rect & { enabled: boolean } = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    enabled: false,
  };

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
    const marginX = 24;
    const slot = (CANVAS_WIDTH - marginX * 2) / n;
    this.layout = this.characters.map((c, i) => ({
      id: c.id,
      cx: marginX + slot * (i + 0.5),
      cy: ROW_Y,
      r: FACE_R,
    }));

    const w = 260;
    this.nextButton = {
      x: CANVAS_WIDTH / 2 - w / 2,
      y: CANVAS_HEIGHT - BTN_MARGIN - TOUCH_TARGET,
      w,
      h: TOUCH_TARGET,
      enabled: isNextButtonEnabled(this.selectedId),
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.rebuildLayout();
    drawBackdrop(ctx);
    drawTitle(ctx, '¿Quién es el protagonista?', TITLE_Y);
    drawSubtitle(ctx, 'Toca una cara para elegirla', SUBTITLE_Y);

    for (let i = 0; i < this.characters.length; i++) {
      const ch = this.characters[i]!;
      const slot = this.layout[i]!;
      const img = this.getImage(ch.id);
      if (!img) continue;
      const { cx, cy, r } = slot;
      const selected = this.selectedId === ch.id;

      if (selected) {
        // Halo para que la selección se vea también a plena luz del sol.
        ctx.save();
        ctx.strokeStyle = ch.accentColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawFaceBadge(ctx, ch.id, img, cx, cy, r, ch.accentColor, {
        ringWidth: selected ? 8 : 4,
        glow: selected,
      });
      drawCaption(ctx, ch.name, cx, cy + r + 26, selected ? PALETTE.text : PALETTE.textMuted);
    }

    const selectedName = this.characters.find((c) => c.id === this.selectedId)?.name;
    if (selectedName) {
      drawSubtitle(ctx, `Protagonista: ${selectedName}`, ROW_Y + FACE_R + 84, PALETTE.text);
    }

    drawButton(ctx, this.nextButton, {
      label: 'Siguiente →',
      color: PALETTE.primary,
      enabled: this.nextButton.enabled,
      fontSize: 22,
    });
  }

  handleClick(x: number, y: number): void {
    this.rebuildLayout();
    const hit = getCharacterAtPosition(x, y, this.layout);
    if (hit) {
      this.selectedId = hit;
      return;
    }
    if (this.nextButton.enabled && hitTest(this.nextButton, x, y) && this.selectedId) {
      this.onConfirm(this.selectedId);
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
