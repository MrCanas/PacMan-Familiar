import { getCharacterById } from '@/data/characters';
import { CANVAS_WIDTH, HUD_HEIGHT } from '@/game/constants';
import { drawFaceBadge } from '@/game/sprites';
import { PALETTE } from '@/ui/theme';

export class HUD {
  render(
    ctx: CanvasRenderingContext2D,
    opts: {
      score: number;
      highScore: number;
      protagonistId: string;
      ghostIds: string[];
      getImage: (id: string) => HTMLImageElement | undefined;
    }
  ): void {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, HUD_HEIGHT);
    gradient.addColorStop(0, '#101c42');
    gradient.addColorStop(1, '#050b1c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HUD_HEIGHT - 1);
    ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT - 1);
    ctx.stroke();

    const centerY = HUD_HEIGHT / 2;
    const hero = getCharacterById(opts.protagonistId);
    const imgHero = opts.getImage(opts.protagonistId);
    if (hero && imgHero) {
      drawFaceBadge(ctx, hero.id, imgHero, 40, centerY, 26, hero.accentColor, { ringWidth: 4 });
    }

    ctx.fillStyle = PALETTE.text;
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(opts.score), 78, centerY + 2);

    ctx.fillStyle = PALETTE.textMuted;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText('PUNTOS', 78, centerY - 18);
    ctx.fillText(`RÉCORD ${opts.highScore}`, 78, centerY + 22);

    // Perseguidores, alineados a la derecha.
    const r = 22;
    const gap = 12;
    const step = r * 2 + gap;
    const startX = CANVAS_WIDTH - 24 - opts.ghostIds.length * step + r;

    opts.ghostIds.forEach((gid, i) => {
      const ch = getCharacterById(gid);
      const img = opts.getImage(gid);
      if (!ch || !img) return;
      drawFaceBadge(ctx, ch.id, img, startX + i * step, centerY, r, ch.accentColor, {
        ringWidth: 4,
      });
    });

    ctx.restore();
  }
}
