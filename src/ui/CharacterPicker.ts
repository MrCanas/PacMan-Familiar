import type { CharacterData } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { drawFaceBadge } from '@/game/sprites';
import {
  drawBackdrop,
  drawButton,
  drawCaption,
  drawSubtitle,
  drawTitle,
  faceAtPosition,
  hitTest,
  layoutFaceGrid,
  PALETTE,
  TOUCH_TARGET,
  type FaceSlot,
  type Rect,
} from '@/ui/theme';

/** Alias historico: un retrato colocado en pantalla. */
export type FaceLayout = FaceSlot;

export const getCharacterAtPosition = faceAtPosition;

export function isNextButtonEnabled(selectedId: string | null): boolean {
  return selectedId !== null;
}

const TITLE_Y = 56;
const SUBTITLE_Y = 92;
const GRID: Rect = { x: 24, y: 118, w: CANVAS_WIDTH - 48, h: 288 };
const BTN_MARGIN = 24;

export class CharacterPicker {
  private selectedId: string | null = null;
  private layout: FaceSlot[] = [];
  private backButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private nextButton: Rect & { enabled: boolean } = { x: 0, y: 0, w: 0, h: 0, enabled: false };

  constructor(
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onBack: () => void,
    private readonly onConfirm: (id: string) => void
  ) {}

  getLayout(): FaceSlot[] {
    return this.layout;
  }

  private rebuildLayout(characters: CharacterData[]): void {
    this.layout = layoutFaceGrid(
      characters.map((c) => c.id),
      GRID,
      { maxPerRow: characters.length <= 5 ? characters.length : 4 }
    );

    const y = CANVAS_HEIGHT - BTN_MARGIN - TOUCH_TARGET;
    this.backButton = { x: 24, y, w: 150, h: TOUCH_TARGET };
    this.nextButton = {
      x: CANVAS_WIDTH - 24 - 240,
      y,
      w: 240,
      h: TOUCH_TARGET,
      enabled: isNextButtonEnabled(this.selectedId),
    };
  }

  render(ctx: CanvasRenderingContext2D, characters: CharacterData[]): void {
    this.rebuildLayout(characters);
    drawBackdrop(ctx);
    drawTitle(ctx, '¿Quién es el protagonista?', TITLE_Y);
    drawSubtitle(ctx, 'Toca una cara para elegirla', SUBTITLE_Y);

    characters.forEach((ch, i) => {
      const slot = this.layout[i];
      const img = this.getImage(ch.id);
      if (!slot || !img) return;
      const { cx, cy, r } = slot;
      const selected = this.selectedId === ch.id;

      if (selected) {
        // Halo para que la selección se vea también a plena luz del sol.
        ctx.save();
        ctx.strokeStyle = ch.accentColor;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      drawFaceBadge(ctx, ch.id, img, cx, cy, r, ch.accentColor, {
        ringWidth: selected ? 8 : 4,
        glow: selected,
      });
      drawCaption(ctx, ch.name, cx, cy + r + 8, selected ? PALETTE.text : PALETTE.textMuted);
    });

    drawButton(ctx, this.backButton, { label: '← Familia', variant: 'muted', fontSize: 18 });
    drawButton(ctx, this.nextButton, {
      label: 'Siguiente →',
      color: PALETTE.primary,
      enabled: this.nextButton.enabled,
      fontSize: 22,
    });
  }

  handleClick(x: number, y: number, characters: CharacterData[]): void {
    this.rebuildLayout(characters);
    const hit = faceAtPosition(x, y, this.layout);
    if (hit) {
      this.selectedId = hit;
      return;
    }
    if (hitTest(this.backButton, x, y)) {
      this.onBack();
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
