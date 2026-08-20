import type { Direction } from '@/entities/direction';
import { nextInputSequence } from '@/input/sequence';

/** Píxeles CSS que hay que arrastrar antes de considerarlo un gesto. */
export const SWIPE_THRESHOLD = 22;

/** Traduce un desplazamiento a dirección, o `null` si es demasiado corto. */
export function swipeToDirection(
  dx: number,
  dy: number,
  threshold = SWIPE_THRESHOLD
): Direction | null {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    return null;
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  }
  return dy > 0 ? 'down' : 'up';
}

function isDirection(value: string | null | undefined): value is Direction {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right';
}

/**
 * Entrada táctil: deslizar sobre el tablero o pulsar la cruceta.
 *
 * El deslizamiento es encadenable: al superar el umbral se emite la dirección
 * y el origen se reinicia, así se puede trazar un recorrido sin levantar el
 * dedo.
 */
export class TouchInput {
  private desired: Direction | null = null;
  private updatedAt = 0;
  private origin: { x: number; y: number } | null = null;
  private readonly cleanups: (() => void)[] = [];

  getDesiredDirection(): Direction | null {
    return this.desired;
  }

  getUpdatedAt(): number {
    return this.updatedAt;
  }

  private set(direction: Direction): void {
    this.desired = direction;
    this.updatedAt = nextInputSequence();
  }

  /** Gestos de deslizamiento sobre el tablero. */
  attachSwipe(target: HTMLElement): void {
    const onDown = (e: PointerEvent): void => {
      this.origin = { x: e.clientX, y: e.clientY };
    };

    const onMove = (e: PointerEvent): void => {
      if (!this.origin) {
        return;
      }
      const dir = swipeToDirection(e.clientX - this.origin.x, e.clientY - this.origin.y);
      if (dir) {
        this.set(dir);
        this.origin = { x: e.clientX, y: e.clientY };
      }
    };

    const onEnd = (): void => {
      this.origin = null;
    };

    target.addEventListener('pointerdown', onDown);
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onEnd);
    target.addEventListener('pointercancel', onEnd);
    target.addEventListener('pointerleave', onEnd);

    this.cleanups.push(() => {
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onEnd);
      target.removeEventListener('pointercancel', onEnd);
      target.removeEventListener('pointerleave', onEnd);
    });
  }

  /** Cruceta en DOM: cualquier descendiente con `data-dir`. */
  attachDpad(root: HTMLElement): void {
    const onDown = (e: PointerEvent): void => {
      const button = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-dir]');
      const dir = button?.dataset.dir;
      if (!isDirection(dir)) {
        return;
      }
      e.preventDefault();
      this.set(dir);
      button?.classList.add('is-active');
    };

    const onUp = (e: PointerEvent): void => {
      (e.target as HTMLElement | null)
        ?.closest<HTMLElement>('[data-dir]')
        ?.classList.remove('is-active');
    };

    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('pointerleave', onUp);

    this.cleanups.push(() => {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('pointerleave', onUp);
    });
  }

  detach(): void {
    for (const cleanup of this.cleanups.splice(0)) {
      cleanup();
    }
    this.desired = null;
    this.origin = null;
  }

  /** Expuesto para tests: fija la dirección sin eventos reales. */
  simulateSwipe(dx: number, dy: number): void {
    const dir = swipeToDirection(dx, dy);
    if (dir) {
      this.set(dir);
    }
  }
}
