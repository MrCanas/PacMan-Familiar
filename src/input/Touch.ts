import type { Direction } from '@/entities/direction';

const SWIPE_THRESHOLD = 20;

export class Touch {
  private desired: Direction | null = null;
  private attached = false;
  private startX = 0;
  private startY = 0;

  private readonly handleTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (!t) return;
    this.startX = t.clientX;
    this.startY = t.clientY;
  };

  private readonly handleTouchEnd = (e: TouchEvent): void => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - this.startX;
    const dy = t.clientY - this.startY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      this.desired = dx > 0 ? 'right' : 'left';
    } else {
      this.desired = dy > 0 ? 'down' : 'up';
    }
  };

  attach(el: HTMLElement): void {
    if (this.attached) return;
    el.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    el.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    this.attached = true;
  }

  detach(el: HTMLElement): void {
    if (!this.attached) return;
    el.removeEventListener('touchstart', this.handleTouchStart);
    el.removeEventListener('touchend', this.handleTouchEnd);
    this.attached = false;
    this.desired = null;
  }

  getDesiredDirection(): Direction | null {
    return this.desired;
  }

  setDirection(dir: Direction): void {
    this.desired = dir;
  }
}
