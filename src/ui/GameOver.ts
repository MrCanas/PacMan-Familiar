import { getCharacterById } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';

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

export type GameOverAction = 'play-again' | 'same-team';

export type GameOverButtonsLayout = {
  again: { x: number; y: number; w: number; h: number };
  same: { x: number; y: number; w: number; h: number };
};

export function layoutGameOverButtons(): GameOverButtonsLayout {
  const w = 220;
  const h = 48;
  const y = CANVAS_HEIGHT - 120;
  return {
    again: { x: CANVAS_WIDTH / 2 - w - 16, y, w, h },
    same: { x: CANVAS_WIDTH / 2 + 16, y, w, h },
  };
}

export function getGameOverButtonChoice(
  x: number,
  y: number,
  buttons: GameOverButtonsLayout
): GameOverAction | null {
  const { again, same } = buttons;
  if (x >= again.x && x <= again.x + again.w && y >= again.y && y <= again.y + again.h) {
    return 'play-again';
  }
  if (x >= same.x && x <= same.x + same.w && y >= same.y && y <= same.y + same.h) {
    return 'same-team';
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
    }
  ): void {
    const hero = getCharacterById(opts.protagonistId);
    const ghost = opts.ghostId ? getCharacterById(opts.ghostId) : undefined;
    const msg = getGameOverMessage(
      opts.reason,
      hero?.name ?? 'Protagonista',
      ghost?.name
    );

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(msg, CANVAS_WIDTH / 2, 48);

    const imgHero = opts.getImage(opts.protagonistId);
    if (imgHero && hero) {
      const cx = opts.reason === 'caught' ? CANVAS_WIDTH / 2 - 90 : CANVAS_WIDTH / 2;
      const cy = 160;
      const r = 72;
      this.drawFace(ctx, imgHero, cx, cy, r, hero.accentColor);
    }

    if (opts.reason === 'caught' && opts.ghostId) {
      const imgG = opts.getImage(opts.ghostId);
      if (imgG && ghost) {
        this.drawFace(ctx, imgG, CANVAS_WIDTH / 2 + 90, 160, 72, ghost.accentColor);
      }
    }

    ctx.fillStyle = '#cbd5f5';
    ctx.font = '600 18px system-ui, sans-serif';
    ctx.fillText(`Puntaje final: ${opts.score}`, CANVAS_WIDTH / 2, 280);

    const buttons = layoutGameOverButtons();
    const drawBtn = (b: typeof buttons.again, label: string, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 12);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 15px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2);
    };

    drawBtn(buttons.again, 'Jugar otra vez', '#22c55e');
    drawBtn(buttons.same, 'Mismo equipo', '#38bdf8');

    ctx.restore();
  }

  private drawFace(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cx: number,
    cy: number,
    r: number,
    accent: string
  ): void {
    const diameter = r * 2;
    const scale = Math.max(diameter / img.naturalWidth, diameter / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  handleClick(x: number, y: number): GameOverAction | null {
    return getGameOverButtonChoice(x, y, layoutGameOverButtons());
  }
}
