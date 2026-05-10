import { describe, expect, it } from 'vitest';

import { CELL_SIZE } from '@/game/constants';
import { checkProtagonistGhostCollision } from '@/game/Collision';

describe('Collision', () => {
  it('detecta superposici�n', () => {
    const p = { pixelX: 100, pixelY: 100, data: { id: 'p' } };
    const g = { pixelX: 100, pixelY: 100, data: { id: 'g1' } };
    expect(checkProtagonistGhostCollision(p, [g], CELL_SIZE)?.data.id).toBe('g1');
  });

  it('no detecta si la distancia es mayor que 0.7 * cell', () => {
    const p = { pixelX: 0, pixelY: 0, data: { id: 'p' } };
    const g = { pixelX: CELL_SIZE, pixelY: 0, data: { id: 'g1' } };
    expect(checkProtagonistGhostCollision(p, [g], CELL_SIZE)).toBeNull();
  });

  it('devuelve el primer fantasma que colisiona', () => {
    const p = { pixelX: 10, pixelY: 10, data: { id: 'p' } };
    const a = { pixelX: 10, pixelY: 10, data: { id: 'a' } };
    const b = { pixelX: 10, pixelY: 10, data: { id: 'b' } };
    expect(checkProtagonistGhostCollision(p, [a, b], CELL_SIZE)?.data.id).toBe('a');
  });

  it('sin colisiones devuelve null', () => {
    const p = { pixelX: 0, pixelY: 0, data: { id: 'p' } };
    const g = { pixelX: 500, pixelY: 500, data: { id: 'g1' } };
    expect(checkProtagonistGhostCollision(p, [g], CELL_SIZE)).toBeNull();
  });
});
