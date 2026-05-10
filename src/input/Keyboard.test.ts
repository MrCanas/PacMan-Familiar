import { describe, expect, it } from 'vitest';

import { Keyboard } from '@/input/Keyboard';

describe('Keyboard', () => {
  it('flechas y WASD mapean direcci�n', () => {
    const kb = new Keyboard();
    kb.simulateKey('ArrowUp');
    expect(kb.getDesiredDirection()).toBe('up');
    kb.simulateKey('s');
    expect(kb.getDesiredDirection()).toBe('down');
    kb.simulateKey('a');
    expect(kb.getDesiredDirection()).toBe('left');
    kb.simulateKey('D');
    expect(kb.getDesiredDirection()).toBe('right');
  });
});
