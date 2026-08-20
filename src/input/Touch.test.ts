import { describe, expect, it } from 'vitest';

import { SWIPE_THRESHOLD, swipeToDirection, TouchInput } from '@/input/Touch';

function pointer(type: string, x: number, y: number): PointerEvent {
  return new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }) as PointerEvent;
}

describe('swipeToDirection', () => {
  it('ignora gestos por debajo del umbral', () => {
    expect(swipeToDirection(0, 0)).toBeNull();
    expect(swipeToDirection(SWIPE_THRESHOLD - 1, SWIPE_THRESHOLD - 1)).toBeNull();
  });

  it('usa el eje dominante', () => {
    expect(swipeToDirection(60, 10)).toBe('right');
    expect(swipeToDirection(-60, 10)).toBe('left');
    expect(swipeToDirection(10, 60)).toBe('down');
    expect(swipeToDirection(10, -60)).toBe('up');
  });

  it('con empate exacto gana el eje horizontal', () => {
    expect(swipeToDirection(40, 40)).toBe('right');
  });
});

describe('TouchInput', () => {
  it('deslizar sobre el objetivo fija la dirección', () => {
    const target = document.createElement('div');
    const input = new TouchInput();
    input.attachSwipe(target);

    target.dispatchEvent(pointer('pointerdown', 100, 100));
    target.dispatchEvent(pointer('pointermove', 100, 40));
    expect(input.getDesiredDirection()).toBe('up');

    input.detach();
  });

  it('sin pointerdown previo no reacciona al movimiento', () => {
    const target = document.createElement('div');
    const input = new TouchInput();
    input.attachSwipe(target);

    target.dispatchEvent(pointer('pointermove', 100, 40));
    expect(input.getDesiredDirection()).toBeNull();

    input.detach();
  });

  it('el deslizamiento se encadena sin levantar el dedo', () => {
    const target = document.createElement('div');
    const input = new TouchInput();
    input.attachSwipe(target);

    target.dispatchEvent(pointer('pointerdown', 100, 100));
    target.dispatchEvent(pointer('pointermove', 100, 40));
    expect(input.getDesiredDirection()).toBe('up');
    // El origen se reinicia, así que otros 60 px bastan para girar.
    target.dispatchEvent(pointer('pointermove', 160, 40));
    expect(input.getDesiredDirection()).toBe('right');

    input.detach();
  });

  it('la cruceta lee data-dir', () => {
    const root = document.createElement('div');
    const button = document.createElement('button');
    button.dataset.dir = 'left';
    root.appendChild(button);

    const input = new TouchInput();
    input.attachDpad(root);
    button.dispatchEvent(pointer('pointerdown', 0, 0));
    expect(input.getDesiredDirection()).toBe('left');

    input.detach();
  });

  it('detach deja de escuchar', () => {
    const target = document.createElement('div');
    const input = new TouchInput();
    input.attachSwipe(target);
    input.detach();

    target.dispatchEvent(pointer('pointerdown', 100, 100));
    target.dispatchEvent(pointer('pointermove', 100, 40));
    expect(input.getDesiredDirection()).toBeNull();
  });
});
