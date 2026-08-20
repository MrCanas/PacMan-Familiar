import { MAZE_COLS } from '@/game/constants';

/** 10 símbolos por fila: `half[k]` aplica al par de columnas `(k, 19-k)`. */
export const LEFT_HALF_ROWS: string[] = [
  '##########',
  '#........#',
  '#.##.###.#',
  '#.##.###.#',
  '#........#',
  '##.##.##.#',
  '#.....#..G',
  '#.###.#.##',
  '#.....#..G',
  '##.##.##.#',
  '#........#',
  '#.##.###.#',
  '#.##.###.#',
  '#........P',
  '##########',
];

export function mirrorRow(half: string): string {
  if (half.length !== 10) {
    throw new Error('Cada fila debe tener 10 caracteres (pares simétricos)');
  }
  let row = '';
  for (let c = 0; c < MAZE_COLS; c++) {
    const k = c <= 9 ? c : MAZE_COLS - 1 - c;
    row += half[k]!;
  }
  return row;
}

export function buildCharGrid(): string[] {
  return LEFT_HALF_ROWS.map(mirrorRow);
}

function charToCell(ch: string): number {
  switch (ch) {
    case '#':
      return 1;
    case '.':
      return 2;
    case 'P':
      return 3;
    case 'G':
      return 4;
    default:
      return 0;
  }
}

export function buildNumericGrid(): number[][] {
  return buildCharGrid().map((row) => [...row].map(charToCell));
}
