import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';

/**
 * Ajusta el canvas al hueco disponible manteniendo la proporción del juego.
 *
 * El resto del código sigue dibujando en el sistema lógico de
 * `CANVAS_WIDTH × CANVAS_HEIGHT`; aquí solo se decide cuántos píxeles reales
 * ocupa eso en pantalla. El búfer se crea a la resolución del dispositivo
 * (`devicePixelRatio`) para que en móviles no se vea borroso.
 */
export class CanvasViewport {
  private scale = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly container: HTMLElement
  ) {}

  /** Escala lógico → CSS px, útil para dimensionar controles externos. */
  getScale(): number {
    return this.scale;
  }

  /** Recalcula tamaño CSS y búfer. Devuelve `true` si algo cambió. */
  resize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const box = this.container.getBoundingClientRect();
    const availableWidth = Math.max(box.width, 1);
    const availableHeight = Math.max(box.height, 1);

    const scale = Math.min(availableWidth / CANVAS_WIDTH, availableHeight / CANVAS_HEIGHT);
    const cssWidth = Math.floor(CANVAS_WIDTH * scale);
    const cssHeight = Math.floor(CANVAS_HEIGHT * scale);
    const bufferWidth = Math.round(cssWidth * dpr);
    const bufferHeight = Math.round(cssHeight * dpr);

    if (this.canvas.width === bufferWidth && this.canvas.height === bufferHeight) {
      return false;
    }

    this.scale = scale;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = bufferWidth;
    this.canvas.height = bufferHeight;
    return true;
  }

  /**
   * Deja el contexto listo para dibujar en coordenadas lógicas. Hay que
   * llamarlo en cada frame porque cambiar `canvas.width` resetea el estado.
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    const factor = this.canvas.width / CANVAS_WIDTH;
    ctx.setTransform(factor, 0, 0, factor, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  /** Se reajusta ante cambios de tamaño, rotación o zoom del navegador. */
  observe(onResize: () => void): () => void {
    const handle = (): void => {
      this.resize();
      onResize();
    };

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handle) : null;
    observer?.observe(this.container);
    window.addEventListener('resize', handle);
    window.addEventListener('orientationchange', handle);

    handle();

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', handle);
      window.removeEventListener('orientationchange', handle);
    };
  }
}
