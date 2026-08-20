import { describe, expect, it } from 'vitest';

import { PlayerInput } from '@/input/PlayerInput';

describe('PlayerInput', () => {
  it('sin entradas no hay dirección', () => {
    expect(new PlayerInput().getDesiredDirection()).toBeNull();
  });

  it('manda la fuente usada más recientemente', () => {
    const input = new PlayerInput();

    input.keyboard.simulateKey('ArrowLeft');
    expect(input.getDesiredDirection()).toBe('left');

    input.touch.simulateSwipe(0, 60);
    expect(input.getDesiredDirection()).toBe('down');

    input.keyboard.simulateKey('ArrowUp');
    expect(input.getDesiredDirection()).toBe('up');
  });

  it('cae en la otra fuente si la más reciente está vacía', () => {
    const input = new PlayerInput();
    input.touch.simulateSwipe(60, 0);
    // El teclado nunca se usó: sigue mandando el táctil.
    expect(input.getDesiredDirection()).toBe('right');
  });
});
