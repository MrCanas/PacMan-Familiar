import type { CharacterData } from '@/data/characters';
import { getCharacterById } from '@/data/characters';
import { MAX_GHOSTS, MIN_GHOSTS } from '@/data/storage';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { DEFAULT_DIFFICULTY, type Difficulty } from '@/game/difficulty';
import { DEFAULT_SCENARIO_ID, SCENARIOS } from '@/game/scenarios';
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

/** Todos los de la familia menos el protagonista, en el orden del elenco. */
export function getGhostCandidates(
  protagonistId: string,
  familyCharacters: CharacterData[]
): CharacterData[] {
  return familyCharacters.filter((c) => c.id !== protagonistId);
}

/**
 * Añade o quita un fantasma. Al llegar al tope se ignora el nuevo en vez de
 * echar a otro: así nadie desaparece del equipo sin que el niño lo vea.
 */
export function toggleGhost(selected: string[], id: string, max = MAX_GHOSTS): string[] {
  if (selected.includes(id)) {
    return selected.filter((s) => s !== id);
  }
  if (selected.length >= max) {
    return selected;
  }
  return [...selected, id];
}

export function isStartButtonEnabled(selected: string[]): boolean {
  return selected.length >= MIN_GHOSTS && selected.length <= MAX_GHOSTS;
}

const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Fácil' },
  { id: 'medium', label: 'Medio' },
  { id: 'hard', label: 'Difícil' },
];

const GRID: Rect = { x: 24, y: 134, w: CANVAS_WIDTH - 48, h: 180 };
const SCENARIO_LABEL_Y = 330;
const SCENARIO_Y = 344;
const SCENARIO_H = 46;
const DIFF_LABEL_Y = 406;
const DIFF_Y = 418;
const DIFF_H = 44;

export class GhostPicker {
  private selected: string[] = [];
  private difficulty: Difficulty = DEFAULT_DIFFICULTY;
  private layout: FaceSlot[] = [];
  private difficultyButtons: (Rect & { id: Difficulty })[] = [];
  private scenarioButtons: (Rect & { id: string })[] = [];
  private scenarioId: string = DEFAULT_SCENARIO_ID;
  private backButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private startButton: Rect & { enabled: boolean } = { x: 0, y: 0, w: 0, h: 0, enabled: false };

  constructor(
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onBack: () => void,
    private readonly onStart: (
      ghostIds: string[],
      difficulty: Difficulty,
      scenarioId: string
    ) => void
  ) {}

  resetSelection(): void {
    this.selected = [];
    this.difficulty = DEFAULT_DIFFICULTY;
    this.scenarioId = DEFAULT_SCENARIO_ID;
  }

  restoreSelection(
    ids: string[] | null,
    difficulty: Difficulty | null,
    scenarioId: string | null = null
  ): void {
    this.selected = ids ? ids.slice(0, MAX_GHOSTS) : [];
    this.difficulty = difficulty ?? DEFAULT_DIFFICULTY;
    this.scenarioId = scenarioId ?? DEFAULT_SCENARIO_ID;
  }

  getScenarioId(): string {
    return this.scenarioId;
  }

  getSelected(): string[] {
    return [...this.selected];
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  /** Quita a los que ya no están en el elenco (cambio de familia o de héroe). */
  keepOnly(candidates: CharacterData[]): void {
    const valid = new Set(candidates.map((c) => c.id));
    this.selected = this.selected.filter((id) => valid.has(id));
  }

  private rebuild(candidates: CharacterData[]): void {
    this.layout = layoutFaceGrid(
      candidates.map((c) => c.id),
      GRID,
      { maxPerRow: candidates.length <= 5 ? candidates.length : 4, maxRadius: 36, captionGap: 24 }
    );

    const scenarioW = 268;
    const scenarioGap = 16;
    const scenarioTotal = SCENARIOS.length * scenarioW + (SCENARIOS.length - 1) * scenarioGap;
    const scenarioStartX = CANVAS_WIDTH / 2 - scenarioTotal / 2;
    this.scenarioButtons = SCENARIOS.map((sc, i) => ({
      id: sc.id,
      x: scenarioStartX + i * (scenarioW + scenarioGap),
      y: SCENARIO_Y,
      w: scenarioW,
      h: SCENARIO_H,
    }));

    const total = DIFFICULTY_OPTIONS.length;
    const w = 150;
    const gap = 14;
    const startX = CANVAS_WIDTH / 2 - (total * w + (total - 1) * gap) / 2;
    this.difficultyButtons = DIFFICULTY_OPTIONS.map((opt, i) => ({
      id: opt.id,
      x: startX + i * (w + gap),
      y: DIFF_Y,
      w,
      h: DIFF_H,
    }));

    const bottomY = CANVAS_HEIGHT - 20 - TOUCH_TARGET;
    this.backButton = { x: 24, y: bottomY, w: 160, h: TOUCH_TARGET };
    this.startButton = {
      x: CANVAS_WIDTH - 24 - 240,
      y: bottomY,
      w: 240,
      h: TOUCH_TARGET,
      enabled: isStartButtonEnabled(this.selected),
    };
  }

  render(
    ctx: CanvasRenderingContext2D,
    protagonistId: string | null,
    candidates: CharacterData[]
  ): void {
    this.rebuild(candidates);
    drawBackdrop(ctx);
    drawTitle(ctx, '¿Quiénes te persiguen?', 38);

    const hero = protagonistId ? getCharacterById(protagonistId) : undefined;
    const heroImg = protagonistId ? this.getImage(protagonistId) : undefined;
    if (hero && heroImg) {
      const r = 20;
      const label = `Protagonista: ${hero.name}`;
      ctx.save();
      ctx.font = '600 17px system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.restore();

      const cx = CANVAS_WIDTH / 2 - (r * 2 + 12 + textWidth) / 2 + r;
      const cy = 76;
      drawFaceBadge(ctx, hero.id, heroImg, cx, cy, r, hero.accentColor, { ringWidth: 3 });
      ctx.save();
      ctx.fillStyle = PALETTE.textMuted;
      ctx.font = '600 17px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx + r + 12, cy);
      ctx.restore();
    }

    const atMax = this.selected.length >= MAX_GHOSTS;
    drawSubtitle(
      ctx,
      atMax ? `Ya son ${MAX_GHOSTS}: quita a alguien para cambiarlo` : 'Toca de 1 a 4 caras',
      112,
      atMax ? PALETTE.warm : PALETTE.textMuted
    );

    candidates.forEach((ch, i) => {
      const slot = this.layout[i];
      const img = this.getImage(ch.id);
      if (!slot || !img) return;
      const active = this.selected.includes(ch.id);
      const order = this.selected.indexOf(ch.id);

      ctx.save();
      ctx.globalAlpha = active ? 1 : 0.34;
      drawFaceBadge(ctx, ch.id, img, slot.cx, slot.cy, slot.r, ch.accentColor, {
        ringWidth: active ? 6 : 3,
        glow: active,
      });
      ctx.restore();

      if (active) {
        // Numerito de orden: los niños quieren saber quién sale primero.
        const bx = slot.cx + slot.r * 0.72;
        const by = slot.cy - slot.r * 0.72;
        ctx.save();
        ctx.fillStyle = ch.accentColor;
        ctx.beginPath();
        ctx.arc(bx, by, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.onSolid;
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(order + 1), bx, by);
        ctx.restore();
      }

      drawCaption(
        ctx,
        ch.name,
        slot.cx,
        slot.cy + slot.r + 6,
        active ? PALETTE.text : PALETTE.textMuted
      );
    });

    drawSubtitle(ctx, '¿Dónde jugáis?', SCENARIO_LABEL_Y);
    for (const b of this.scenarioButtons) {
      const on = this.scenarioId === b.id;
      drawButton(ctx, b, {
        label: SCENARIOS.find((sc) => sc.id === b.id)?.name ?? b.id,
        color: PALETTE.accent,
        variant: on ? 'solid' : 'muted',
        selected: on,
        fontSize: 18,
      });
    }

    drawSubtitle(ctx, 'Dificultad', DIFF_LABEL_Y);
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

    drawButton(ctx, this.backButton, { label: '← Atrás', variant: 'muted', fontSize: 19 });
    drawButton(ctx, this.startButton, {
      label: '¡Empezar! 🎮',
      color: PALETTE.warm,
      enabled: this.startButton.enabled,
      fontSize: 21,
    });
  }

  handleClick(x: number, y: number, candidates: CharacterData[]): void {
    this.rebuild(candidates);

    const face = faceAtPosition(x, y, this.layout);
    if (face) {
      this.selected = toggleGhost(this.selected, face);
      return;
    }
    for (const b of this.scenarioButtons) {
      if (hitTest(b, x, y)) {
        this.scenarioId = b.id;
        return;
      }
    }
    for (const b of this.difficultyButtons) {
      if (hitTest(b, x, y)) {
        this.difficulty = b.id;
        return;
      }
    }
    if (hitTest(this.backButton, x, y)) {
      this.onBack();
      return;
    }
    if (this.startButton.enabled && hitTest(this.startButton, x, y)) {
      this.onStart(this.getSelected(), this.difficulty, this.scenarioId);
    }
  }
}
