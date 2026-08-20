/**
 * Reloj de pasos de una ficha.
 *
 * Antes cada ficha se movía con un `setInterval` de intervalo fijo, así que
 * todas iban siempre igual de rápido. Con la piscina eso ya no vale: el ritmo
 * depende de la casilla que se está pisando. Este reloj acumula el tiempo que
 * va pasando y suelta un paso cada vez que se junta lo suficiente, con el
 * intervalo recalculado en cada paso.
 */

/**
 * Un frame más largo que esto es una pestaña que vuelve del segundo plano, no
 * un tirón: se recorta para no fast-forwardear la partida. Un cuarto de segundo
 * deja pasar los tirones normales sin ralentizar el juego, pero corta en seco
 * los saltos de varios segundos.
 */
export const MAX_FRAME_DT_MS = 250;
/** Cinturón de seguridad: nadie se teletransporta media pantalla de golpe. */
export const MAX_STEPS_PER_ADVANCE = 4;

export type StepClockOptions = {
  baseIntervalMs: number;
  maxDtMs?: number;
  maxStepsPerAdvance?: number;
};

export class StepClock {
  readonly baseIntervalMs: number;
  private readonly maxDtMs: number;
  private readonly maxStepsPerAdvance: number;
  private accumulator = 0;

  constructor(options: StepClockOptions) {
    this.baseIntervalMs = options.baseIntervalMs;
    this.maxDtMs = options.maxDtMs ?? MAX_FRAME_DT_MS;
    this.maxStepsPerAdvance = options.maxStepsPerAdvance ?? MAX_STEPS_PER_ADVANCE;
  }

  /** Cuánto tarda un paso a esa velocidad. A 0,8x tarda 1,25 veces más. */
  intervalFor(speedFactor: number): number {
    const factor = Number.isFinite(speedFactor) && speedFactor > 0 ? speedFactor : 1;
    return this.baseIntervalMs / factor;
  }

  /** Fracción del paso actual ya recorrida, de 0 a 1. Para interpolar el dibujo. */
  progress(speedFactor: number): number {
    const interval = this.intervalFor(speedFactor);
    if (interval <= 0) return 0;
    return Math.min(1, this.accumulator / interval);
  }

  reset(): void {
    this.accumulator = 0;
  }

  /**
   * Suma `dtMs` y ejecuta `onStep` tantas veces como toque.
   *
   * `speedFactor` es una función y no un número porque se vuelve a preguntar
   * antes de cada paso: una ficha que entra al agua a mitad de frame ya paga
   * el intervalo lento en el paso siguiente.
   */
  advance(dtMs: number, speedFactor: () => number, onStep: () => void): number {
    if (!Number.isFinite(dtMs) || dtMs <= 0) {
      return 0;
    }

    this.accumulator += Math.min(dtMs, this.maxDtMs);

    let steps = 0;
    while (steps < this.maxStepsPerAdvance) {
      const interval = this.intervalFor(speedFactor());
      if (interval <= 0 || this.accumulator < interval) {
        break;
      }
      this.accumulator -= interval;
      steps += 1;
      onStep();
    }

    if (steps === this.maxStepsPerAdvance) {
      // Se tocó el tope: mejor tirar el atraso que ir soltando pasos sueltos
      // durante los frames siguientes.
      this.accumulator = 0;
    }
    return steps;
  }
}
