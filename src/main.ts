import '@/styles/main.css';

import { CHARACTERS } from '@/data/characters';
import { Game } from '@/game/Game';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

async function bootstrap(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  if (!canvas) {
    throw new Error('No se encontró el canvas #game');
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del canvas');
  }

  const images = await Promise.all(CHARACTERS.map((c) => loadImage(c.imagePath)));
  const game = new Game(canvas, ctx);
  CHARACTERS.forEach((c, i) => {
    const img = images[i];
    if (img) {
      game.registerImage(c.id, img);
    }
  });

  canvas.addEventListener('click', (e) => {
    canvas.focus();
    game.handleCanvasClick(e.clientX, e.clientY);
  });

  const dpad = document.getElementById('dpad');
  if (dpad) {
    dpad.addEventListener('pointerdown', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-dir]');
      if (btn) {
        e.preventDefault();
        const dir = btn.dataset.dir as 'up' | 'down' | 'left' | 'right';
        game.touch.setDirection(dir);
      }
    });
  }

  game.startLoop();
}

void bootstrap().catch((err) => {
  console.error(err);
});
