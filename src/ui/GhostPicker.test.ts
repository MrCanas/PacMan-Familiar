import { describe, expect, it, vi } from 'vitest';

import { resolveFamily } from '@/data/families';
import {
  getGhostCandidates,
  GhostPicker,
  isStartButtonEnabled,
  toggleGhost,
} from '@/ui/GhostPicker';

const VALVERDE = resolveFamily('valverde');

/** Lienzo de mentira: sólo nos importa que `render` no cambie el estado. */
function fakeCtx(): CanvasRenderingContext2D {
  const noop = (): void => {};
  return {
    save: noop,
    restore: noop,
    fillRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    clip: noop,
    fill: noop,
    stroke: noop,
    drawImage: noop,
    translate: noop,
    roundRect: noop,
    fillText: noop,
    measureText: () => ({ width: 10 }) as TextMetrics,
    createLinearGradient: () => ({ addColorStop: noop }) as unknown as CanvasGradient,
  } as unknown as CanvasRenderingContext2D;
}
const CLASICA = resolveFamily('clasica');

describe('GhostPicker helpers', () => {
  it('getGhostCandidates excluye al protagonista y conserva el orden', () => {
    const ids = getGhostCandidates('maria', CLASICA.characters).map((c) => c.id);
    expect(ids).toEqual(['jose', 'mama', 'prima-ana', 'primo-javier']);
  });

  it('con ocho personajes quedan siete candidatos', () => {
    expect(getGhostCandidates('abuela', VALVERDE.characters)).toHaveLength(7);
  });

  it('toggleGhost añade, quita y respeta el tope de cuatro', () => {
    expect(toggleGhost([], 'papa')).toEqual(['papa']);
    expect(toggleGhost(['papa'], 'papa')).toEqual([]);
    const cuatro = ['a', 'b', 'c', 'd'];
    expect(toggleGhost(cuatro, 'e')).toEqual(cuatro);
    expect(toggleGhost(cuatro, 'b')).toEqual(['a', 'c', 'd']);
  });

  it('isStartButtonEnabled exige entre uno y cuatro', () => {
    expect(isStartButtonEnabled([])).toBe(false);
    expect(isStartButtonEnabled(['a'])).toBe(true);
    expect(isStartButtonEnabled(['a', 'b', 'c', 'd'])).toBe(true);
    expect(isStartButtonEnabled(['a', 'b', 'c', 'd', 'e'])).toBe(false);
  });
});

describe('GhostPicker', () => {
  const candidates = getGhostCandidates('abuela', VALVERDE.characters);

  function picker(onStart = vi.fn()): { p: GhostPicker; onStart: typeof onStart } {
    return { p: new GhostPicker(() => undefined, vi.fn(), onStart), onStart };
  }

  it('no deja empezar sin fantasmas', () => {
    const { p, onStart } = picker();
    // Botón de empezar, abajo a la derecha.
    p.handleClick(640 - 24 - 120, 560 - 20 - 36, candidates);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('empieza con los fantasmas elegidos, en el orden elegido', () => {
    const { p, onStart } = picker();
    p.restoreSelection(['mateo', 'papa'], 'hard', 'patio');
    p.handleClick(640 - 24 - 120, 560 - 20 - 36, candidates);
    expect(onStart).toHaveBeenCalledWith(['mateo', 'papa'], 'hard', 'patio');
  });

  it('el escenario por defecto es el laberinto clásico', () => {
    const { p } = picker();
    expect(p.getScenarioId()).toBe('classic');
  });

  it('se puede cambiar al patio con piscina', () => {
    const { p, onStart } = picker();
    p.restoreSelection(['papa'], null, 'classic');
    // Segundo botón de escenario: a la derecha del centro.
    p.handleClick(640 / 2 + 16 / 2 + 268 / 2, 344 + 23, candidates);
    expect(p.getScenarioId()).toBe('patio');
    p.handleClick(640 - 24 - 120, 560 - 20 - 36, candidates);
    expect(onStart).toHaveBeenCalledWith(['papa'], 'medium', 'patio');
  });

  it('dibujar la pantalla no deshace lo que acaba de elegir el jugador', () => {
    // Regresión: `render` recibía el escenario desde Game y lo reescribía en
    // cada frame, así que el clic en «Patio con piscina» duraba un suspiro.
    const ctx = fakeCtx();
    const { p, onStart } = picker();
    p.restoreSelection(['papa'], null, 'classic');
    p.handleClick(640 / 2 + 16 / 2 + 268 / 2, 344 + 23, candidates);
    p.render(ctx, 'abuela', candidates);
    expect(p.getScenarioId()).toBe('patio');
    p.handleClick(640 - 24 - 120, 560 - 20 - 36, candidates);
    expect(onStart).toHaveBeenCalledWith(['papa'], 'medium', 'patio');
  });

  it('resetSelection vuelve al laberinto clásico', () => {
    const { p } = picker();
    p.restoreSelection(['papa'], null, 'patio');
    p.resetSelection();
    expect(p.getScenarioId()).toBe('classic');
  });

  it('restoreSelection recorta a cuatro', () => {
    const { p } = picker();
    p.restoreSelection(['a', 'b', 'c', 'd', 'e'], null);
    expect(p.getSelected()).toHaveLength(4);
  });

  it('keepOnly descarta a los que ya no están en el elenco', () => {
    const { p } = picker();
    p.restoreSelection(['papa', 'maria'], null);
    p.keepOnly(candidates);
    expect(p.getSelected()).toEqual(['papa']);
  });

  it('resetSelection vacía el equipo y vuelve a dificultad media', () => {
    const { p } = picker();
    p.restoreSelection(['papa'], 'hard');
    p.resetSelection();
    expect(p.getSelected()).toEqual([]);
    expect(p.getDifficulty()).toBe('medium');
  });

  it('tocar una cara la añade y volver a tocarla la quita', () => {
    const { p } = picker();
    // Renderizamos primero para que exista la disposición de caras.
    p.handleClick(-100, -100, candidates);
    const layout = p.getSelected();
    expect(layout).toEqual([]);
    // La primera cara de la rejilla: la buscamos por su posición conocida.
    const slot = { cx: 24 + (640 - 48) / 4 / 2, cy: 126 + (190 / 2 - 24) / 2 };
    p.handleClick(slot.cx, slot.cy, candidates);
    expect(p.getSelected()).toEqual([candidates[0]!.id]);
    p.handleClick(slot.cx, slot.cy, candidates);
    expect(p.getSelected()).toEqual([]);
  });
});
