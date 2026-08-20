import { describe, expect, it, vi } from 'vitest';

import type { RankingRow } from '@/data/ranking';
import { columnRows, columnValue, COLUMNS, RankingScreen } from '@/ui/RankingScreen';

function row(over: Partial<RankingRow> = {}): RankingRow {
  return {
    characterId: 'abuela',
    characterName: 'Abuela',
    familyId: 'valverde',
    totalPellets: 100,
    bestScore: 1000,
    matches: 3,
    wins: 1,
    ...over,
  };
}

const ROWS = [
  row({ characterId: 'a', totalPellets: 10, bestScore: 5000 }),
  row({ characterId: 'b', totalPellets: 999, bestScore: 100 }),
  row({ characterId: 'c', totalPellets: 500, bestScore: 2000 }),
];

describe('RankingScreen', () => {
  it('tiene las dos columnas que pidió la familia', () => {
    expect(COLUMNS.map((c) => c.key)).toEqual(['eaters', 'scorers']);
  });

  it('la columna de comer ordena por total comido', () => {
    expect(columnRows(ROWS, 'eaters').map((r) => r.characterId)).toEqual(['b', 'c', 'a']);
    expect(columnValue(ROWS[1]!, 'eaters')).toBe(999);
  });

  it('la columna de puntos ordena por la mejor partida', () => {
    expect(columnRows(ROWS, 'scorers').map((r) => r.characterId)).toEqual(['a', 'c', 'b']);
    expect(columnValue(ROWS[0]!, 'scorers')).toBe(5000);
  });

  it('las dos columnas pueden tener líderes distintos', () => {
    const primerComilon = columnRows(ROWS, 'eaters')[0]!;
    const primerPuntuador = columnRows(ROWS, 'scorers')[0]!;
    expect(primerComilon.characterId).not.toBe(primerPuntuador.characterId);
  });

  it('sólo muestra cinco por columna', () => {
    const muchos = Array.from({ length: 12 }, (_, i) =>
      row({ characterId: `p${i}`, totalPellets: i, bestScore: i })
    );
    expect(columnRows(muchos, 'eaters')).toHaveLength(5);
  });

  it('el botón de volver avisa a quien lo abrió', () => {
    const onBack = vi.fn();
    const screen = new RankingScreen(() => undefined, onBack);
    screen.handleClick(320, 560 - 24 - 36);
    expect(onBack).toHaveBeenCalled();
  });

  it('tocar fuera del botón no vuelve', () => {
    const onBack = vi.fn();
    const screen = new RankingScreen(() => undefined, onBack);
    screen.handleClick(10, 10);
    expect(onBack).not.toHaveBeenCalled();
  });
});
