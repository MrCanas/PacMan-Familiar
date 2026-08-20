import { getCharacterById } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { drawFaceBadge } from '@/game/sprites';
import {
  drawButton,
  drawCaption,
  drawSubtitle,
  drawTitle,
  hitTest,
  PALETTE,
  TOUCH_TARGET,
  type Rect,
} from '@/ui/theme';

export function getGameOverMessage(
  reason: 'won' | 'caught',
  protagonistName: string,
  ghostName?: string
): string {
  if (reason === 'won') {
    return `¡${protagonistName} ganó! 🎉`;
  }
  return `¡${ghostName ?? 'Un fantasma'} atrapó a ${protagonistName}!`;
}

export type GameOverAction = 'play-again' | 'same-team' | 'ranking';

export type GameOverButtonsLayout = {
  again: Rect;
  same: Rect;
  /** Sólo existe si el ranking está configurado; ver `isRankingEnabled`. */
  ranking: Rect | null;
};

export function layoutGameOverButtons(withRanking = false): GameOverButtonsLayout {
  const w = 250;
  const h = TOUCH_TARGET;
  const gap = 20;
  const y = CANVAS_HEIGHT - 40 - h;
  const rankingH = 50;
  return {
    again: { x: CANVAS_WIDTH / 2 - w - gap / 2, y, w, h },
    same: { x: CANVAS_WIDTH / 2 + gap / 2, y, w, h },
    ranking: withRanking
      ? { x: CANVAS_WIDTH / 2 - 120, y: y - 14 - rankingH, w: 240, h: rankingH }
      : null,
  };
}

export function getGameOverButtonChoice(
  x: number,
  y: number,
  buttons: GameOverButtonsLayout
): GameOverAction | null {
  if (hitTest(buttons.again, x, y)) {
    return 'play-again';
  }
  if (hitTest(buttons.same, x, y)) {
    return 'same-team';
  }
  if (buttons.ranking && hitTest(buttons.ranking, x, y)) {
    return 'ranking';
  }
  return null;
}

export class GameOverScreen {
  render(
    ctx: CanvasRenderingContext2D,
    opts: {
      reason: 'won' | 'caught';
      protagonistId: string;
      ghostId?: string;
      score: number;
      getImage: (id: string) => HTMLImageElement | undefined;
      showRanking?: boolean;
    }
  ): void {
    const hero = getCharacterById(opts.protagonistId);
    const ghost = opts.ghostId ? getCharacterById(opts.ghostId) : undefined;
    const won = opts.reason === 'won';
    const msg = getGameOverMessage(opts.reason, hero?.name ?? 'Protagonista', ghost?.name);

    ctx.save();
    // Velo sobre el tablero: se intuye la partida detrás.
    ctx.fillStyle = 'rgba(3, 8, 24, 0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    drawTitle(ctx, msg, 74);

    const faceR = 76;
    const faceY = 220;
    const imgHero = opts.getImage(opts.protagonistId);
    const imgGhost = opts.ghostId ? opts.getImage(opts.ghostId) : undefined;
    const showGhost = !won && !!ghost && !!imgGhost;

    if (imgHero && hero) {
      const cx = showGhost ? CANVAS_WIDTH / 2 - 100 : CANVAS_WIDTH / 2;
      drawFaceBadge(ctx, hero.id, imgHero, cx, faceY, faceR, hero.accentColor, {
        ringWidth: 8,
        glow: true,
      });
      drawCaption(ctx, hero.name, cx, faceY + faceR + 16);
    }

    if (showGhost && ghost && imgGhost) {
      const cx = CANVAS_WIDTH / 2 + 100;
      drawFaceBadge(ctx, ghost.id, imgGhost, cx, faceY, faceR, ghost.accentColor, {
        ringWidth: 8,
        glow: true,
      });
      drawCaption(ctx, ghost.name, cx, faceY + faceR + 16);
    }

    drawSubtitle(
      ctx,
      `Puntaje final: ${opts.score}`,
      faceY + faceR + 66,
      won ? PALETTE.primary : PALETTE.text
    );

    const buttons = layoutGameOverButtons(opts.showRanking ?? false);
    if (buttons.ranking) {
      drawButton(ctx, buttons.ranking, {
        label: '🏆 Ver ranking',
        variant: 'muted',
        fontSize: 18,
      });
    }
    drawButton(ctx, buttons.again, {
      label: 'Jugar otra vez',
      color: PALETTE.primary,
      fontSize: 20,
    });
    drawButton(ctx, buttons.same, {
      label: 'Mismo equipo',
      color: PALETTE.accent,
      fontSize: 20,
    });
  }

  handleClick(x: number, y: number, showRanking = false): GameOverAction | null {
    return getGameOverButtonChoice(x, y, layoutGameOverButtons(showRanking));
  }
}
