import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ALL_CHARACTERS } from '@/data/characters';
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
  for (const c of ALL_CHARACTERS) {
    const img = new Image();
    img.width = 32;
    img.height = 32;
    game.registerImage(c.id, img);
  }
}

function newGame(): Game {
  const { canvas, ctx } = makeCanvas();
  const game = new Game(canvas, ctx);
  registerStubImages(game);
  return game;
}

describe('Game', () => {
  let game!: Game;

  beforeEach(() => {
    localStorage.clear();
    game = newGame();
  });

  afterEach(() => {
    game.destroy();
  });

  it('estado inicial: pick-family con la primera familia', () => {
    expect(game.currentScreen).toBe('pick-family');
    expect(game.familyId).toBe('valverde');
    expect(game.roster).toHaveLength(8);
  });

  it('setProtagonist guarda id sin cambiar pantalla', () => {
    game.setProtagonist('abuela');
    expect(game.protagonistId).toBe('abuela');
    expect(game.currentScreen).toBe('pick-family');
  });

  it('los candidatos a fantasma son la familia menos el protagonista', () => {
    game.setProtagonist('abuela');
    const ids = game.ghostCandidates.map((c) => c.id);
    expect(ids).toHaveLength(7);
    expect(ids).not.toContain('abuela');
  });

  it('setGhosts recorta a cuatro', () => {
    game.setGhosts(['papa', 'mateo', 'olivia', 'tito-jorge', 'tito-mario']);
    expect(game.ghostIds).toEqual(['papa', 'mateo', 'olivia', 'tito-jorge']);
  });

  it('startGame sin config válida lanza error', () => {
    expect(() => game.startGame()).toThrow();
    game.setProtagonist('abuela');
    expect(() => game.startGame()).toThrow();
  });

  it('startGame con config válida pasa a playing con esos fantasmas', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['mateo', 'papa']);
    game.startGame();
    expect(game.currentScreen).toBe('playing');
    expect(game.playSession).not.toBeNull();
    expect(game.maze).not.toBeNull();
    expect(game.protagonist).not.toBeNull();
    expect(game.ghosts.map((g) => g.data.id)).toEqual(['mateo', 'papa']);
  });

  it('cambiar de familia olvida héroe y equipo de la anterior', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.setFamily('clasica');
    expect(game.familyId).toBe('clasica');
    expect(game.protagonistId).toBeNull();
    expect(game.ghostIds).toEqual([]);
    expect(game.roster.map((c) => c.id)).toContain('maria');
  });

  it('elegir como héroe a alguien que era fantasma lo saca del equipo', () => {
    game.setProtagonist('abuela');
    game.ghostPicker.restoreSelection(['papa', 'mateo'], null);
    game.setProtagonist('papa');
    expect(game.ghostIds).toEqual(['mateo']);
  });

  it('endGame cambia a game-over y guarda razón', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.startGame();
    game.endGame('caught', 'papa');
    expect(game.currentScreen).toBe('game-over');
    expect(game.gameOverReason).toBe('caught');
    expect(game.caughtGhostId).toBe('papa');
  });

  it('endGame won', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.startGame();
    game.endGame('won');
    expect(game.currentScreen).toBe('game-over');
    expect(game.gameOverReason).toBe('won');
  });

  it('reset vuelve a pick-family y limpia selecciones', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa', 'mateo']);
    game.reset();
    expect(game.currentScreen).toBe('pick-family');
    expect(game.protagonistId).toBeNull();
    expect(game.ghostIds).toEqual([]);
  });

  it('recuerda familia, héroe, equipo y dificultad al volver a entrar', () => {
    game.setFamily('clasica');
    game.setProtagonist('maria');
    game.setGhosts(['jose', 'mama']);
    game.setDifficulty('hard');
    game.destroy();

    game = newGame();
    expect(game.familyId).toBe('clasica');
    expect(game.protagonistId).toBe('maria');
    expect(game.ghostIds).toEqual(['jose', 'mama']);
    expect(game.currentDifficulty).toBe('hard');
  });

  it('migra la clave antigua ghostCount a fantasmas concretos', () => {
    localStorage.clear();
    localStorage.setItem('pacman-familiar.familyId', 'clasica');
    localStorage.setItem('pacman-familiar.protagonistId', 'maria');
    localStorage.setItem('pacman-familiar.ghostCount', '3');
    game.destroy();

    game = newGame();
    expect(game.ghostIds).toEqual(['jose', 'mama', 'prima-ana']);
  });

  it('startGame no crea temporizadores: la partida corre con el bucle de dibujo', () => {
    const spy = vi.spyOn(globalThis, 'setInterval');
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.startGame();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('el primer advance no mueve nada: aún no hay dt', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.startGame();
    const antes = { ...game.protagonist! };
    game.advance(1000);
    expect(game.protagonist!.col).toBe(antes.col);
    expect(game.protagonist!.row).toBe(antes.row);
  });

  it('dos advance seguidos sí mueven al jugador', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.startGame();
    const antes = { ...game.protagonist! };
    game.advance(1000);
    game.advance(1200);
    const movido = game.protagonist!.col !== antes.col || game.protagonist!.row !== antes.row;
    expect(movido).toBe(true);
  });

  it('tras terminar, advance ya no toca la partida', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.startGame();
    game.advance(1000);
    game.endGame('won');
    const sesion = game.playSession!;
    const antes = { ...sesion.player };
    game.advance(120_000);
    expect(sesion.player.col).toBe(antes.col);
    expect(sesion.player.row).toBe(antes.row);
  });

  it('recuerda el escenario elegido', () => {
    game.setScenario('patio');
    expect(game.scenario.id).toBe('patio');
    game.destroy();
    game = newGame();
    expect(game.scenarioId).toBe('patio');
  });

  it('un escenario guardado que ya no existe cae al laberinto clásico', () => {
    localStorage.setItem('pacman-familiar.scenarioId', 'marte');
    game.destroy();
    game = newGame();
    expect(game.scenarioId).toBe('classic');
  });

  it('la partida usa el escenario elegido', () => {
    game.setProtagonist('abuela');
    game.setGhosts(['papa']);
    game.setScenario('patio');
    game.startGame();
    expect(game.maze!.scenario.id).toBe('patio');
  });

  it('ignora un protagonista guardado que ya no está en la familia', () => {
    localStorage.clear();
    localStorage.setItem('pacman-familiar.familyId', 'clasica');
    localStorage.setItem('pacman-familiar.protagonistId', 'abuela');
    game.destroy();

    game = newGame();
    expect(game.protagonistId).toBeNull();
  });
});
