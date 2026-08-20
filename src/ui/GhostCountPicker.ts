import type { CharacterData } from '@/data/characters';
import { getCharacterById } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { drawFaceBadge } from '@/game/sprites';
import { DEFAULT_DIFFICULTY, type Difficulty } from '@/game/difficulty';
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

export function getGhostCandidates(
  protagonistId: string,
  allCharacters: CharacterData[]
): CharacterData[] {
  return allCharacters.filter((c) => c.id !== protagonistId);
}

export function isCharacterActiveAsGhost(index: number, ghostCount: number): boolean {
  return index < ghostCount;
}

export function isStartButtonEnabled(ghostCount: number | null): boolean {
  if (ghostCount === null) return false;
  return ghostCount >= 1 && ghostCount <= 4;
}

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Fácil' },
  { id: 'medium', label: 'Medio' },
  { id: 'hard', label: 'Difícil' },
];

export class GhostCountPicker {
  private ghostCount: number | null = null;
  private difficulty: Difficulty = DEFAULT_DIFFICULTY;
  private countButtons: (Rect & { n: number })[] = [];
  private difficultyButtons: (Rect & { id: Difficulty })[] = [];
  private backButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private startButton: Rect & { enabled: boolean } = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    enabled: false,
  };

  constructor(
    private readonly allCharacters: CharacterData[],
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onBack: () => void,
    private readonly onStart: (ghostCount: number, difficulty: Difficulty) => void
  ) {}

  resetSelection(): void {
    this.ghostCount = null;
    this.difficulty = DEFAULT_DIFFICULTY;
  }

  restoreCount(n: number | null): void {
    this.ghostCount = n;
  }

  private rebuildButtons(): void {
    const countY = 142;
    const countW = 78;
    const countH = 64;
    const countGap = 14;
    const countStartX = CANVAS_WIDTH / 2 - (4 * countW + 3 * countGap) / 2;
    this.countButtons = [1, 2, 3, 4].map((n, i) => ({
      n,
      x: countStartX + i * (countW + countGap),
      y: countY,
      w: countW,
      h: countH,
    }));

    const diffY = 250;
    const diffW = 150;
    const diffH = 58;
    const diffGap = 14;
    const diffTotal = DIFFICULTY_OPTIONS.length * diffW + (DIFFICULTY_OPTIONS.length - 1) * diffGap;
    const diffStartX = CANVAS_WIDTH / 2 - diffTotal / 2;
    this.difficultyButtons = DIFFICULTY_OPTIONS.map((opt, i) => ({
      id: opt.id,
      x: diffStartX + i * (diffW + diffGap),
      y: diffY,
      w: diffW,
      h: diffH,
    }));

    const bottomY = CANVAS_HEIGHT - 28 - TOUCH_TARGET;
    this.backButton = { x: 28, y: bottomY, w: 170, h: TOUCH_TARGET };
    this.startButton = {
      x: CANVAS_WIDTH - 28 - 240,
      y: bottomY,
      w: 240,
      h: TOUCH_TARGET,
      enabled: isStartButtonEnabled(this.ghostCount),
    };
  }

  render(ctx: CanvasRenderingContext2D, protagonistId: string | null): void {
    this.rebuildButtons();
    drawBackdrop(ctx);

    const hero = protagonistId ? getCharacterById(protagonistId) : undefined;
    const imgHero = protagonistId ? this.getImage(protagonistId) : undefined;

    drawTitle(ctx, '¿Cuántos fantasmas?', 44);

    if (hero && imgHero) {
      const r = 24;
      const label = `Protagonista: ${hero.name}`;
      ctx.save();
      ctx.font = '600 18px system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.restore();

      const totalWidth = r * 2 + 12 + textWidth;
      const cx = CANVAS_WIDTH / 2 - totalWidth / 2 + r;
      const cy = 98;
      drawFaceBadge(ctx, hero.id, imgHero, cx, cy, r, hero.accentColor, { ringWidth: 3 });

      ctx.save();
      ctx.fillStyle = PALETTE.textMuted;
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx + r + 12, cy);
      ctx.restore();
    }

    for (const b of this.countButtons) {
      const on = this.ghostCount === b.n;
      drawButton(ctx, b, {
        label: String(b.n),
        color: PALETTE.accent,
        variant: on ? 'solid' : 'muted',
        selected: on,
        fontSize: 26,
      });
    }

    drawSubtitle(ctx, 'Dificultad', 228);
    for (const b of this.difficultyButtons) {
      const on = this.difficulty === b.id;
      drawButton(ctx, b, {
        label: DIFFICULTY_OPTIONS.find((o) => o.id === b.id)?.label ?? b.id,
        color: PALETTE.primary,
        variant: on ? 'solid' : 'muted',
        selected: on,
        fontSize: 19,
      });
    }

    const candidates = protagonistId ? getGhostCandidates(protagonistId, this.allCharacters) : [];
    const ghostN = this.ghostCount ?? 0;
    const rowY = 372;
    const slot = candidates.length > 0 ? (CANVAS_WIDTH - 56) / candidates.length : 0;

    candidates.forEach((ch, index) => {
      const img = this.getImage(ch.id);
      if (!img) return;
      const cx = 28 + slot * (index + 0.5);
      const r = 48;
      const active = isCharacterActiveAsGhost(index, ghostN);

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.32;
      drawFaceBadge(ctx, ch.id, img, cx, rowY, r, ch.accentColor, {
        ringWidth: active ? 6 : 3,
        glow: active,
      });
      ctx.restore();
      drawCaption(ctx, ch.name, cx, rowY + r + 14, active ? PALETTE.text : PALETTE.textMuted);
    });

    drawButton(ctx, this.backButton, {
      label: '← Atrás',
      variant: 'muted',
      fontSize: 19,
    });
    drawButton(ctx, this.startButton, {
      label: '¡Empezar! 🎮',
      color: PALETTE.warm,
      enabled: this.startButton.enabled,
      fontSize: 21,
    });
  }

  handleClick(x: number, y: number, protagonistId: string | null): void {
    if (!protagonistId) return;
    this.rebuildButtons();
    for (const b of this.difficultyButtons) {
      if (hitTest(b, x, y)) {
        this.difficulty = b.id;
        return;
      }
    }
    for (const b of this.countButtons) {
      if (hitTest(b, x, y)) {
        this.ghostCount = b.n;
        return;
      }
    }
    if (hitTest(this.backButton, x, y)) {
      this.onBack();
      return;
    }
    if (this.startButton.enabled && hitTest(this.startButton, x, y) && this.ghostCount !== null) {
      this.onStart(this.ghostCount, this.difficulty);
    }
  }
}
