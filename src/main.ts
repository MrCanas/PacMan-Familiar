import '@/styles/main.css';

import { CHARACTERS } from '@/data/characters';
import { Game } from '@/game/Game';
import { CanvasViewport } from '@/game/viewport';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

function requireElement<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) {
    throw new Error(`No se encontró el elemento ${selector}`);
  }
  return el;
}

async function bootstrap(): Promise<void> {
  const canvas = requireElement<HTMLCanvasElement>('#game');
  const stage = requireElement<HTMLElement>('#stage');
  const dpad = requireElement<HTMLElement>('#dpad');

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del canvas');
  }

  const viewport = new CanvasViewport(canvas, stage);
  const game = new Game(canvas, ctx, viewport);

  const images = await Promise.all(CHARACTERS.map((c) => loadImage(c.imagePath)));
  CHARACTERS.forEach((c, i) => {
    const img = images[i];
    if (img) {
      game.registerImage(c.id, img);
    }
  });

  viewport.observe(() => game.render());
  game.attachTouchControls(canvas, dpad);

  canvas.addEventListener('click', (e) => {
    canvas.focus();
    game.handleCanvasClick(e.clientX, e.clientY);
  });

  game.startLoop();
}

void bootstrap().catch((err) => {
  console.error(err);
});
