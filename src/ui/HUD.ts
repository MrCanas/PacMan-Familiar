import { getCharacterById } from '@/data/characters';
import { CANVAS_WIDTH, HUD_HEIGHT } from '@/game/constants';

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
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, HUD_HEIGHT - 1);
    ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT - 1);
    ctx.stroke();

    const hero = getCharacterById(opts.protagonistId);
    const imgHero = opts.getImage(opts.protagonistId);
    if (hero && imgHero) {
      const cx = 36;
      const cy = HUD_HEIGHT / 2;
      const r = 26;
      const diameter = r * 2;
      const scale = Math.max(diameter / imgHero.naturalWidth, diameter / imgHero.naturalHeight);
      const dw = imgHero.naturalWidth * scale;
      const dh = imgHero.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(imgHero, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();
      ctx.strokeStyle = hero.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Puntos: ${opts.score}`, 92, HUD_HEIGHT / 2 - 10);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px system-ui, sans-serif';
    ctx.fillText(`Récord: ${opts.highScore}`, 92, HUD_HEIGHT / 2 + 12);

    const startX = CANVAS_WIDTH - 32 - opts.ghostIds.length * 52;
    opts.ghostIds.forEach((gid, i) => {
      const ch = getCharacterById(gid);
      const img = opts.getImage(gid);
      if (!ch || !img) return;
      const cx = startX + i * 52 + 22;
      const cy = HUD_HEIGHT / 2;
      const r = 20;
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
      ctx.strokeStyle = ch.accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }
}
