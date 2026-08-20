import type { Direction } from '@/entities/direction';
import { Keyboard } from '@/input/Keyboard';
import { TouchInput } from '@/input/Touch';

/**
 * Une teclado y táctil: manda la fuente que se usó más recientemente, así se
 * puede alternar entre flechas y cruceta sin que una bloquee a la otra.
 */
export class PlayerInput {
  readonly keyboard = new Keyboard();
  readonly touch = new TouchInput();

  attach(options: { swipeTarget?: HTMLElement; dpad?: HTMLElement } = {}): void {
    this.keyboard.attach();
    if (options.swipeTarget) {
      this.touch.attachSwipe(options.swipeTarget);
    }
    if (options.dpad) {
      this.touch.attachDpad(options.dpad);
    }
  }

  detach(): void {
    this.keyboard.detach();
    this.touch.detach();
  }

  getDesiredDirection(): Direction | null {
    const fromTouch = this.touch.getDesiredDirection();
    const fromKeyboard = this.keyboard.getDesiredDirection();

    if (this.touch.getUpdatedAt() > this.keyboard.getUpdatedAt()) {
      return fromTouch ?? fromKeyboard;
    }
    return fromKeyboard ?? fromTouch;
  }
}
