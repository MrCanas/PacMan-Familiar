import { describe, expect, it, vi } from 'vitest';

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

  it('usa window.addEventListener sin duplicar', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const kb = new Keyboard();
    kb.attach();
    kb.attach();
    expect(addSpy).toHaveBeenCalledTimes(1);
    kb.detach();
    expect(removeSpy).toHaveBeenCalledTimes(1);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
