export type Direction = 'up' | 'down' | 'left' | 'right';

export function oppositeDirection(d: Direction): Direction {
  switch (d) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

export function directionDelta(d: Direction): { dx: number; dy: number } {
  switch (d) {
    case 'up':
      return { dx: 0, dy: -1 };
    case 'down':
      return { dx: 0, dy: 1 };
    case 'left':
      return { dx: -1, dy: 0 };
    case 'right':
      return { dx: 1, dy: 0 };
  }
}
