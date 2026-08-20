let counter = 0;

/**
 * Contador compartido por las fuentes de entrada. Permite saber cuál se usó la
 * última vez sin depender del reloj, que en tests es poco fiable.
 */
export function nextInputSequence(): number {
  counter += 1;
  return counter;
}
