import { describe, expect, it } from 'vitest';

import { Keyboard } from '@/input/Keyboard';

describe('Keyboard', () => {
  it('flechas y WASD mapean dirección', () => {
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

  it('listener keydown con code Arrow*', () => {
    const kb = new Keyboard();
    const target = document.createElement('div');
    kb.attach(target);
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true })
    );
    expect(kb.getDesiredDirection()).toBe('left');
    kb.detach(target);
  });
});
