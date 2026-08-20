import type { FamilyData } from '@/data/families';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { drawFaceBadge } from '@/game/sprites';
import {
  drawBackdrop,
  drawButton,
  drawPanel,
  drawSubtitle,
  drawTitle,
  hitTest,
  PALETTE,
  TOUCH_TARGET,
  type Rect,
} from '@/ui/theme';

const CARD_X = 36;
const CARD_W = CANVAS_WIDTH - CARD_X * 2;
const CARD_H = 132;
const CARD_GAP = 20;
const FIRST_CARD_Y = 132;
/** Cuantas caras se asoman en la tarjeta a modo de anticipo. */
const PREVIEW_FACES = 5;

export function isFamilyNextEnabled(selectedId: string | null): boolean {
  return selectedId !== null;
}

export class FamilyPicker {
  private selectedId: string | null = null;
  private cards: (Rect & { id: string })[] = [];
  private nextButton: Rect & { enabled: boolean } = { x: 0, y: 0, w: 0, h: 0, enabled: false };
  private rankingButton: Rect | null = null;

  constructor(
    private readonly families: FamilyData[],
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onConfirm: (familyId: string) => void,
    /** Sólo se pasa si el ranking está configurado; si no, no hay botón. */
    private readonly onRanking?: () => void
  ) {}

  restoreSelection(id: string | null): void {
    this.selectedId = id;
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  reset(): void {
    this.selectedId = null;
  }

  private rebuild(): void {
    this.cards = this.families.map((family, i) => ({
      id: family.id,
      x: CARD_X,
      y: FIRST_CARD_Y + i * (CARD_H + CARD_GAP),
      w: CARD_W,
      h: CARD_H,
    }));

    const w = 260;
    this.nextButton = {
      x: CANVAS_WIDTH / 2 - w / 2,
      y: CANVAS_HEIGHT - 28 - TOUCH_TARGET,
      w,
      h: TOUCH_TARGET,
      enabled: isFamilyNextEnabled(this.selectedId),
    };
    this.rankingButton = this.onRanking
      ? { x: 24, y: this.nextButton.y, w: 150, h: TOUCH_TARGET }
      : null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.rebuild();
    drawBackdrop(ctx);
    drawTitle(ctx, '¿Con qué familia juegas?', 58);
    drawSubtitle(ctx, 'Toca una tarjeta para elegirla', 96);

    this.families.forEach((family, i) => {
      const card = this.cards[i]!;
      const selected = this.selectedId === family.id;
      drawPanel(ctx, card);

      if (selected) {
        ctx.save();
        ctx.strokeStyle = PALETTE.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(card.x + 2, card.y + 2, card.w - 4, card.h - 4, 18);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = selected ? PALETTE.text : PALETTE.textMuted;
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(family.name, card.x + 22, card.y + 18);
      ctx.font = '600 15px system-ui, sans-serif';
      ctx.fillStyle = PALETTE.textMuted;
      ctx.fillText(family.tagline, card.x + 22, card.y + 48);
      ctx.restore();

      const faces = family.characters.slice(0, PREVIEW_FACES);
      const r = 26;
      const step = r * 1.7;
      const startX = card.x + card.w - 22 - r - step * (faces.length - 1);
      faces.forEach((character, index) => {
        const img = this.getImage(character.id);
        if (!img) return;
        drawFaceBadge(
          ctx,
          character.id,
          img,
          startX + step * index,
          card.y + card.h / 2,
          r,
          character.accentColor,
          { ringWidth: selected ? 4 : 2, glow: selected }
        );
      });

      ctx.save();
      ctx.fillStyle = PALETTE.textMuted;
      ctx.font = '700 15px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${family.characters.length} personajes`, card.x + 22, card.y + card.h - 22);
      ctx.restore();
    });

    if (this.rankingButton) {
      drawButton(ctx, this.rankingButton, {
        label: '🏆',
        variant: 'muted',
        fontSize: 26,
      });
    }

    drawButton(ctx, this.nextButton, {
      label: 'Siguiente →',
      color: PALETTE.primary,
      enabled: this.nextButton.enabled,
      fontSize: 22,
    });
  }

  handleClick(x: number, y: number): void {
    this.rebuild();
    for (const card of this.cards) {
      if (hitTest(card, x, y)) {
        this.selectedId = card.id;
        return;
      }
    }
    if (this.rankingButton && this.onRanking && hitTest(this.rankingButton, x, y)) {
      this.onRanking();
      return;
    }
    if (this.nextButton.enabled && hitTest(this.nextButton, x, y) && this.selectedId) {
      this.onConfirm(this.selectedId);
    }
  }
}
