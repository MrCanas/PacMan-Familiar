import type { Direction } from '@/entities/direction';

const codeToDir = (code: string): Direction | null => {
  switch (code) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
};

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
  private attached = false;

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    const dir = codeToDir(e.code) ?? keyToDir(e.key);
    if (dir) {
      e.preventDefault();
      this.desired = dir;
    }
  };

  attach(): void {
    if (this.attached) {
      return;
    }
    window.addEventListener('keydown', this.handleKeyDown);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) {
      return;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    this.attached = false;
    this.desired = null;
  }

  getDesiredDirection(): Direction | null {
    return this.desired;
  }

  /** Expuesto para tests: simula tecla sin listener. */
  simulateKey(key: string): void {
    this.desired = codeToDir(key) ?? keyToDir(key);
  }
}
