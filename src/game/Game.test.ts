import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHARACTERS } from '@/data/characters';
import { Game } from '@/game/Game';

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 560;
  const ctx = {
    canvas,
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'top' as CanvasTextBaseline,
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    translate: vi.fn(),
    roundRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  vi.spyOn(canvas, 'getContext').mockImplementation(() => ctx);
  return { canvas, ctx };
}

function registerStubImages(game: Game): void {
  for (const c of CHARACTERS) {
    const img = new Image();
    img.width = 32;
    img.height = 32;
    game.registerImage(c.id, img);
  }
}

describe('Game', () => {
  let game!: Game;

  beforeEach(() => {
    localStorage.clear();
    const { canvas, ctx } = makeCanvas();
    game = new Game(canvas, ctx);
    registerStubImages(game);
  });

  afterEach(() => {
    game.destroy();
  });

  it('estado inicial: pick-protagonist', () => {
    expect(game.currentScreen).toBe('pick-protagonist');
  });

  it('setProtagonist guarda id sin cambiar pantalla', () => {
    game.setProtagonist('maria');
    expect(game.protagonistId).toBe('maria');
    expect(game.currentScreen).toBe('pick-protagonist');
  });

  it('setGhostCount guarda n��������mero', () => {
    game.setGhostCount(2);
    expect(game.ghostCount).toBe(2);
  });

  it('startGame sin config v��������lida lanza error', () => {
    expect(() => game.startGame()).toThrow();
    game.setProtagonist('maria');
    expect(() => game.startGame()).toThrow();
  });

  it('startGame con config v��������lida pasa a playing', () => {
    game.setProtagonist('maria');
    game.setGhostCount(2);
    game.startGame();
    expect(game.currentScreen).toBe('playing');
    expect(game.maze).not.toBeNull();
    expect(game.protagonist).not.toBeNull();
    expect(game.ghosts.length).toBe(2);
  });

  it('endGame cambia a game-over y guarda raz��������n', () => {
    game.setProtagonist('maria');
    game.setGhostCount(1);
    game.startGame();
    game.endGame('caught', 'jose');
    expect(game.currentScreen).toBe('game-over');
    expect(game.gameOverReason).toBe('caught');
    expect(game.caughtGhostId).toBe('jose');
  });

  it('endGame won', () => {
    game.setProtagonist('maria');
    game.setGhostCount(1);
    game.startGame();
    game.endGame('won');
    expect(game.currentScreen).toBe('game-over');
    expect(game.gameOverReason).toBe('won');
  });

  it('reset vuelve a pick-protagonist y limpia selecciones', () => {
    game.setProtagonist('maria');
    game.setGhostCount(2);
    game.reset();
    expect(game.currentScreen).toBe('pick-protagonist');
    expect(game.protagonistId).toBeNull();
    expect(game.ghostCount).toBeNull();
  });
});
