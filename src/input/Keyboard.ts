import type { Direction } from '@/entities/direction';

const keyToDir = (key: string): Direction | null => {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    default:
      return null;
  }
};

export class Keyboard {
  private desired: Direction | null = null;

  private readonly onKeyDown = (e: Event): void => {
    const ke = e as KeyboardEvent;
    const dir = keyToDir(ke.key);
    if (dir) {
      ke.preventDefault();
      this.desired = dir;
    }
  };

  attach(target: Window | Document = window): void {
    target.addEventListener('keydown', this.onKeyDown);
  }

  detach(target: Window | Document = window): void {
    target.removeEventListener('keydown', this.onKeyDown);
  }

  getDesiredDirection(): Direction | null {
    return this.desired;
  }

  /** Expuesto para tests: simula tecla sin listener. */
  simulateKey(key: string): void {
    this.desired = keyToDir(key);
  }
}
