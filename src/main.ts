import '@/styles/main.css';

import { ALL_CHARACTERS } from '@/data/characters';
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

  // Se lanzan todas las caras a la vez, pero solo se esperan las de la familia
  // activa: con dos elencos, esperar a las trece dejaria la pantalla en negro
  // mas tiempo del necesario. Las demas se van pintando segun llegan.
  const active = new Set(game.roster.map((c) => c.id));
  const loads = ALL_CHARACTERS.map((c) => ({
    id: c.id,
    done: loadImage(c.imagePath)
      .then((img) => {
        game.registerImage(c.id, img);
        game.render();
      })
      .catch((err: unknown) => {
        // Una cara que falla no debe impedir jugar con el resto.
        console.error(err);
      }),
  }));
  await Promise.all(loads.filter((l) => active.has(l.id)).map((l) => l.done));

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
