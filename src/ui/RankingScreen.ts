import { getCharacterById } from '@/data/characters';
import { topEaters, topScorers, type RankingRow } from '@/data/ranking';
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

export type RankingState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; rows: RankingRow[] };

const COLUMN_Y = 92;
const COLUMN_H = 322;
const ROW_H = 56;
const ROWS = 5;

/** Las dos columnas del ranking, con su métrica. */
export const COLUMNS = [
  { key: 'eaters', title: '🍒 Los que más comen', unit: 'comidos' },
  { key: 'scorers', title: '🏆 Los que más puntos', unit: 'puntos' },
] as const;

export function columnRows(rows: RankingRow[], key: (typeof COLUMNS)[number]['key']): RankingRow[] {
  return key === 'eaters' ? topEaters(rows, ROWS) : topScorers(rows, ROWS);
}

export function columnValue(row: RankingRow, key: (typeof COLUMNS)[number]['key']): number {
  return key === 'eaters' ? row.totalPellets : row.bestScore;
}

export class RankingScreen {
  private backButton: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private readonly getImage: (id: string) => HTMLImageElement | undefined,
    private readonly onBack: () => void
  ) {}

  private rebuild(): void {
    const w = 240;
    this.backButton = {
      x: CANVAS_WIDTH / 2 - w / 2,
      y: CANVAS_HEIGHT - 24 - TOUCH_TARGET,
      w,
      h: TOUCH_TARGET,
    };
  }

  render(ctx: CanvasRenderingContext2D, state: RankingState): void {
    this.rebuild();
    drawBackdrop(ctx);
    drawTitle(ctx, 'Ranking de la familia', 50);

    if (state.status === 'loading') {
      drawSubtitle(ctx, 'Cargando el ranking…', CANVAS_HEIGHT / 2);
    } else if (state.status === 'error') {
      drawSubtitle(ctx, 'No se pudo cargar el ranking', CANVAS_HEIGHT / 2 - 16, PALETTE.warm);
      drawSubtitle(ctx, state.message, CANVAS_HEIGHT / 2 + 16);
    } else if (state.rows.length === 0) {
      drawSubtitle(ctx, 'Todavía no hay partidas.', CANVAS_HEIGHT / 2 - 16);
      drawSubtitle(ctx, '¡Jugad una y volved a mirar!', CANVAS_HEIGHT / 2 + 16);
    } else {
      this.renderColumns(ctx, state.rows);
    }

    drawButton(ctx, this.backButton, { label: '← Volver', variant: 'muted', fontSize: 20 });
  }

  private renderColumns(ctx: CanvasRenderingContext2D, rows: RankingRow[]): void {
    const margin = 18;
    const gap = 16;
    const width = (CANVAS_WIDTH - margin * 2 - gap) / 2;

    COLUMNS.forEach((column, index) => {
      const x = margin + index * (width + gap);
      drawPanel(ctx, { x, y: COLUMN_Y, w: width, h: COLUMN_H }, 16);

      ctx.save();
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(column.title, x + width / 2, COLUMN_Y + 26);
      ctx.restore();

      const list = columnRows(rows, column.key);
      if (list.length === 0) {
        drawSubtitle(ctx, 'Sin datos', COLUMN_Y + 90);
        return;
      }

      list.forEach((row, i) => {
        const cy = COLUMN_Y + 62 + i * ROW_H + ROW_H / 2 - 6;
        const character = getCharacterById(row.characterId);
        const image = this.getImage(row.characterId);
        const accent = character?.accentColor ?? PALETTE.accent;

        ctx.save();
        ctx.fillStyle = i === 0 ? PALETTE.text : PALETTE.textMuted;
        ctx.font = `bold ${i === 0 ? 18 : 16}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, x + 12, cy);
        ctx.restore();

        if (image) {
          drawFaceBadge(ctx, row.characterId, image, x + 52, cy, 19, accent, {
            ringWidth: i === 0 ? 4 : 2,
            glow: i === 0,
          });
        }

        ctx.save();
        ctx.fillStyle = i === 0 ? PALETTE.text : PALETTE.textMuted;
        ctx.font = '600 15px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        // El nombre del ranking, no el del elenco: puede venir de un móvil
        // con un manifiesto más viejo.
        ctx.fillText(character?.name ?? row.characterName, x + 78, cy);
        ctx.textAlign = 'right';
        ctx.fillStyle = accent;
        ctx.font = 'bold 17px system-ui, sans-serif';
        ctx.fillText(String(columnValue(row, column.key)), x + width - 12, cy);
        ctx.restore();
      });
    });
  }

  handleClick(x: number, y: number): void {
    this.rebuild();
    if (hitTest(this.backButton, x, y)) {
      this.onBack();
    }
  }
}
