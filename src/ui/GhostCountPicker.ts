import type { CharacterData } from '@/data/characters';
import { getCharacterById } from '@/data/characters';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';

export function getGhostCandidates(protagonistId: string, allCharacters: CharacterData[]): CharacterData[] {
  return allCharacters.filter((c) => c.id !== protagonistId);
}

export function isCharacterActiveAsGhost(index: number, ghostCount: number): boolean {
  return index < ghostCount;
}

export function isStartButtonEnabled(ghostCount: number | null): boolean {
  if (ghostCount === null) return false;
  return ghostCount >= 1 && ghostCount <= 4;
}

export class GhostCountPicker {
  private ghostCount: number | null = null;
  private countButtons: { n: number; x: number; y: number; w: number; h: number }[] = [];
  private backButton = { x: 0, y: 0, w: 0, h: 0 };
  private startButton = { x: 0, y: 0, w: 0, h: 0, enabled: false };

  constructor(
    private readonly allCharacters: CharacterData[],
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onBack: () => void,
    private readonly onStart: (ghostCount: number) => void
  ) {}

  resetSelection(): void {
    this.ghostCount = null;
  }

  restoreCount(n: number | null): void {
    this.ghostCount = n;
  }

  private rebuildButtons(): void {
    const y = 120;
    const w = 56;
    const h = 44;
    const gap = 12;
    const startX = CANVAS_WIDTH / 2 - (4 * w + 3 * gap) / 2;
    this.countButtons = [1, 2, 3, 4].map((n, i) => ({
      n,
      x: startX + i * (w + gap),
      y,
      w,
      h,
    }));
    this.backButton = { x: 32, y: CANVAS_HEIGHT - 60, w: 140, h: 44 };
    this.startButton = {
      x: CANVAS_WIDTH - 32 - 200,
      y: CANVAS_HEIGHT - 60,
      w: 200,
      h: 44,
      enabled: isStartButtonEnabled(this.ghostCount),
    };
  }

  render(ctx: CanvasRenderingContext2D, protagonistId: string | null): void {
    this.rebuildButtons();
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const hero = protagonistId ? getCharacterById(protagonistId) : undefined;
    const imgHero = protagonistId ? this.getImage(protagonistId) : undefined;

    if (hero && imgHero) {
      const cx = 96;
      const cy = 56;
      const r = 28;
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
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 18px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Protagonista: ${hero.name}`, cx + r + 16, cy);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('¿Cuántos fantasmas?', CANVAS_WIDTH / 2, 100);

    for (const b of this.countButtons) {
      const on = this.ghostCount === b.n;
      ctx.fillStyle = on ? '#38bdf8' : '#334155';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 8);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.n), b.x + b.w / 2, b.y + b.h / 2);
    }

    const candidates = protagonistId ? getGhostCandidates(protagonistId, this.allCharacters) : [];
    const ghostN = this.ghostCount ?? 0;
    const rowY = 220;
    const slot = (CANVAS_WIDTH - 64) / candidates.length;

    candidates.forEach((ch, index) => {
      const img = this.getImage(ch.id);
      if (!img) return;
      const cx = 32 + slot * (index + 0.5);
      const cy = rowY;
      const r = 52;
      const active = isCharacterActiveAsGhost(index, ghostN);
      ctx.save();
      ctx.filter = active ? 'none' : 'grayscale(1) brightness(0.7)';
      const diameter = r * 2;
      const scale = Math.max(diameter / img.naturalWidth, diameter / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();
      ctx.filter = 'none';
      ctx.strokeStyle = ch.accentColor;
      ctx.lineWidth = active ? 4 : 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ch.name, cx, cy + r + 8);
    });

    const bb = this.backButton;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(bb.x, bb.y, bb.w, bb.h, 10);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('← Atrás', bb.x + bb.w / 2, bb.y + bb.h / 2);

    const sb = this.startButton;
    ctx.fillStyle = sb.enabled ? '#f97316' : '#475569';
    ctx.beginPath();
    ctx.roundRect(sb.x, sb.y, sb.w, sb.h, 10);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText('¡Empezar! 🎮', sb.x + sb.w / 2, sb.y + sb.h / 2);

    ctx.restore();
  }

  handleClick(x: number, y: number, protagonistId: string | null): void {
    if (!protagonistId) return;
    this.rebuildButtons();
    for (const b of this.countButtons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.ghostCount = b.n;
        return;
      }
    }
    const bb = this.backButton;
    if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
      this.onBack();
      return;
    }
    const sb = this.startButton;
    if (
      sb.enabled &&
      x >= sb.x &&
      x <= sb.x + sb.w &&
      y >= sb.y &&
      y <= sb.y + sb.h &&
      this.ghostCount !== null
    ) {
      this.onStart(this.ghostCount);
    }
  }
}
