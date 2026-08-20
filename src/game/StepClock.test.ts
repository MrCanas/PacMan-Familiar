import { describe, expect, it, vi } from 'vitest';

import { MAX_STEPS_PER_ADVANCE, StepClock } from '@/game/StepClock';

const GRASS = (): number => 1;
const WATER = (): number => 0.8;

function clock(baseIntervalMs = 140): StepClock {
  return new StepClock({ baseIntervalMs });
}

describe('StepClock', () => {
  it('no da ningún paso antes de cumplirse el intervalo', () => {
    const onStep = vi.fn();
    const c = clock();
    expect(c.advance(139, GRASS, onStep)).toBe(0);
    expect(onStep).not.toHaveBeenCalled();
  });

  it('da un paso justo al cumplirse el intervalo', () => {
    const onStep = vi.fn();
    const c = clock();
    expect(c.advance(140, GRASS, onStep)).toBe(1);
    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it('el sobrante se guarda para el paso siguiente', () => {
    const onStep = vi.fn();
    const c = clock();
    c.advance(100, GRASS, onStep);
    expect(onStep).not.toHaveBeenCalled();
    c.advance(40, GRASS, onStep);
    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it('en el agua cada paso cuesta 1,25 veces más', () => {
    expect(clock(140).intervalFor(0.8)).toBeCloseTo(175);
    expect(clock(140).intervalFor(1)).toBe(140);
  });

  it('tres pasos en el agua consumen lo mismo que 3 × 175 ms', () => {
    const onStep = vi.fn();
    const c = clock(140);
    // Frames de 25 ms hasta acumular justo por debajo de tres pasos.
    for (let t = 0; t < 524; t += 4) c.advance(4, WATER, onStep);
    expect(onStep).toHaveBeenCalledTimes(2);
    c.advance(4, WATER, onStep);
    expect(onStep).toHaveBeenCalledTimes(3);
  });

  it('en el mismo tiempo se dan menos pasos en el agua que en el césped', () => {
    const enCesped = vi.fn();
    const enAgua = vi.fn();
    const a = clock(140);
    const b = clock(140);
    for (let i = 0; i < 100; i++) {
      a.advance(16, GRASS, enCesped);
      b.advance(16, WATER, enAgua);
    }
    expect(enCesped.mock.calls.length).toBeGreaterThan(enAgua.mock.calls.length);
  });

  it('se vuelve a preguntar la velocidad antes de cada paso', () => {
    const onStep = vi.fn();
    const c = clock(100);
    const speed = vi.fn<() => number>().mockReturnValueOnce(1).mockReturnValue(0.5);
    // 250 ms: el primer paso cuesta 100 (césped) y el segundo 200 (lento).
    expect(c.advance(250, speed, onStep)).toBe(1);
    expect(speed).toHaveBeenCalledTimes(2);
  });

  it('volver de segundo plano no dispara una ráfaga de pasos', () => {
    const onStep = vi.fn();
    const c = clock(140);
    c.advance(60_000, GRASS, onStep);
    expect(onStep.mock.calls.length).toBeLessThanOrEqual(MAX_STEPS_PER_ADVANCE);
  });

  it('tras tocar el tope no queda atraso acumulado', () => {
    const onStep = vi.fn();
    const c = clock(10);
    c.advance(60_000, GRASS, onStep);
    onStep.mockClear();
    // El siguiente frame corto no debería soltar nada todavía.
    c.advance(1, GRASS, onStep);
    expect(onStep).not.toHaveBeenCalled();
  });

  it('ignora dt negativo, cero o no numérico', () => {
    const onStep = vi.fn();
    const c = clock();
    expect(c.advance(-50, GRASS, onStep)).toBe(0);
    expect(c.advance(0, GRASS, onStep)).toBe(0);
    expect(c.advance(Number.NaN, GRASS, onStep)).toBe(0);
    expect(onStep).not.toHaveBeenCalled();
  });

  it('una velocidad absurda no cuelga el reloj', () => {
    const onStep = vi.fn();
    const c = clock();
    c.advance(500, () => 0, onStep);
    expect(onStep.mock.calls.length).toBeLessThanOrEqual(MAX_STEPS_PER_ADVANCE);
  });

  it('reset olvida lo acumulado', () => {
    const onStep = vi.fn();
    const c = clock();
    c.advance(139, GRASS, onStep);
    c.reset();
    c.advance(1, GRASS, onStep);
    expect(onStep).not.toHaveBeenCalled();
  });

  it('progress avanza de 0 a 1 dentro del paso', () => {
    const c = clock(100);
    expect(c.progress(1)).toBe(0);
    c.advance(50, GRASS, () => {});
    expect(c.progress(1)).toBeCloseTo(0.5);
  });
});
