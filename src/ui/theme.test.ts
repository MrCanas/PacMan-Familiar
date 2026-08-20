import { describe, expect, it } from 'vitest';

import { faceAtPosition, layoutFaceGrid } from '@/ui/theme';

const AREA = { x: 20, y: 100, w: 600, h: 260 };

describe('layoutFaceGrid', () => {
  it('cinco caras caben en una fila', () => {
    const slots = layoutFaceGrid(['a', 'b', 'c', 'd', 'e'], AREA, { maxPerRow: 5 });
    const filas = new Set(slots.map((s) => s.cy));
    expect(slots).toHaveLength(5);
    expect(filas.size).toBe(1);
  });

  it('ocho caras se parten en dos filas de cuatro', () => {
    const slots = layoutFaceGrid(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], AREA);
    const filas = [...new Set(slots.map((s) => s.cy))];
    expect(filas).toHaveLength(2);
    expect(slots.filter((s) => s.cy === filas[0]!)).toHaveLength(4);
    expect(slots.filter((s) => s.cy === filas[1]!)).toHaveLength(4);
  });

  it('siete caras se equilibran en 4 + 3, con la segunda fila centrada', () => {
    const slots = layoutFaceGrid(['a', 'b', 'c', 'd', 'e', 'f', 'g'], AREA);
    const filas = [...new Set(slots.map((s) => s.cy))];
    const primera = slots.filter((s) => s.cy === filas[0]!);
    const segunda = slots.filter((s) => s.cy === filas[1]!);
    expect(primera).toHaveLength(4);
    expect(segunda).toHaveLength(3);
    const centro = AREA.x + AREA.w / 2;
    const medio = (segunda[0]!.cx + segunda[segunda.length - 1]!.cx) / 2;
    expect(medio).toBeCloseTo(centro, 5);
  });

  it('las caras nunca se salen del area ni se solapan', () => {
    const slots = layoutFaceGrid(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], AREA);
    for (const s of slots) {
      expect(s.cx - s.r).toBeGreaterThanOrEqual(AREA.x);
      expect(s.cx + s.r).toBeLessThanOrEqual(AREA.x + AREA.w);
      expect(s.cy - s.r).toBeGreaterThanOrEqual(AREA.y);
    }
    const misma = slots.filter((s) => s.cy === slots[0]!.cy);
    for (let i = 1; i < misma.length; i++) {
      expect(misma[i]!.cx - misma[i - 1]!.cx).toBeGreaterThan(2 * misma[i]!.r);
    }
  });

  it('lista vacía no da ningún hueco', () => {
    expect(layoutFaceGrid([], AREA)).toEqual([]);
  });
});

describe('faceAtPosition', () => {
  const slots = layoutFaceGrid(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], AREA);

  it('acierta en el centro de una cara', () => {
    const s = slots[5]!;
    expect(faceAtPosition(s.cx, s.cy, slots)).toBe('f');
  });

  it('la esquina del cuadrado que envuelve la cara no cuenta', () => {
    const s = slots[0]!;
    expect(faceAtPosition(s.cx - s.r * 0.9, s.cy - s.r * 0.9, slots)).toBeNull();
  });

  it('fuera de la rejilla devuelve null', () => {
    expect(faceAtPosition(0, 0, slots)).toBeNull();
  });
});
