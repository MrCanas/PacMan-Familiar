import { describe, expect, it } from 'vitest';

import { ALL_CHARACTERS } from '@/data/characters';
import { MAZE_COLS, MAZE_ROWS } from '@/game/constants';
import { getDifficultySettings } from '@/game/difficulty';
import { PlaySession } from '@/game/PlaySession';
import { PATIO_PISCINA } from '@/game/scenarios';
import { Terrain } from '@/game/terrain';
import type { Direction } from '@/entities/direction';

const stubImg = new Image();
stubImg.width = 32;
stubImg.height = 32;

const HERO = ALL_CHARACTERS[0]!;
const GHOST = ALL_CHARACTERS[1]!;
const MEDIUM = getDifficultySettings('medium');

function patioSession(ghosts = 0): PlaySession {
  const entries = Array.from({ length: ghosts }, (_, i) => ({
    data: ALL_CHARACTERS[i + 1]!,
    image: stubImg,
    col: 0,
    row: 0,
  }));
  return PlaySession.create(HERO, stubImg, entries, MEDIUM, PATIO_PISCINA);
}

/** Primera celda de agua con vecina de agua a la derecha: para nadar recto. */
function findWaterRun(session: PlaySession): { col: number; row: number } {
  for (let row = 0; row < MAZE_ROWS; row++) {
    for (let col = 0; col < MAZE_COLS - 2; col++) {
      const water = (c: number): boolean => session.gridMap.terrainAt(c, row) === Terrain.WATER;
      if (water(col) && water(col + 1) && water(col + 2)) return { col, row };
    }
  }
  throw new Error('El patio debería tener agua');
}

/** Cuenta cuántas celdas avanza el jugador en `frames` frames de `dt` ms. */
function stepsIn(session: PlaySession, direction: Direction, frames: number, dt = 8): number {
  let steps = 0;
  let prev = `${session.player.col},${session.player.row}`;
  for (let i = 0; i < frames; i++) {
    session.advance(dt, direction);
    const now = `${session.player.col},${session.player.row}`;
    if (now !== prev) steps += 1;
    prev = now;
  }
  return steps;
}

describe('velocidad por terreno', () => {
  it('el patio tiene agua y el jugador empieza en el césped', () => {
    const session = patioSession();
    expect(session.gridMap.speedFactorAt(session.player.col, session.player.row)).toBe(1);
  });

  it('en el agua se avanza más despacio que en el césped', () => {
    const cesped = patioSession();
    const agua = patioSession();
    const run = findWaterRun(agua);
    agua.player.col = run.col;
    agua.player.row = run.row;
    agua.player.direction = 'right';
    agua.player.nextDirection = 'right';

    const pasosCesped = stepsIn(cesped, 'left', 200);
    const pasosAgua = stepsIn(agua, 'right', 200);

    expect(pasosAgua).toBeGreaterThan(0);
    expect(pasosAgua).toBeLessThan(pasosCesped);
    // 0,8x: en el mismo tiempo se dan cuatro quintos de los pasos.
    expect(pasosAgua / pasosCesped).toBeCloseTo(0.8, 1);
  });

  it('un paso en el agua cuesta 1,25 veces lo que en el césped', () => {
    const session = patioSession();
    const run = findWaterRun(session);
    session.player.col = run.col;
    session.player.row = run.row;
    session.player.direction = 'right';
    session.player.nextDirection = 'right';

    const antes = session.player.col;
    // 140 ms bastan en el césped, pero en el agua hacen falta 175.
    session.advance(140, 'right');
    expect(session.player.col).toBe(antes);
    session.advance(35, 'right');
    expect(session.player.col).toBe(antes + 1);
  });

  it('al fantasma que nada le cuesta más dar el paso que al que pisa césped', () => {
    // Intervalo de fantasma en dificultad media: 320 ms. En el agua, 320/0,8 = 400.
    // El tiempo se entrega en frames cortos, como haría el navegador.
    function seMovioTras(terreno: 'cesped' | 'agua', totalMs: number): boolean {
      const session = patioSession(1);
      const ghost = session.ghosts[0]!;
      if (terreno === 'agua') {
        const run = findWaterRun(session);
        ghost.col = run.col + 1;
        ghost.row = run.row;
      }
      // El jugador, lejos y quieto: que no acabe la partida a mitad de medida.
      session.player.col = 1;
      session.player.row = 1;
      session.player.direction = 'up';
      session.player.nextDirection = 'up';

      const inicio = `${ghost.col},${ghost.row}`;
      for (let t = 0; t < totalMs; t += 8) {
        session.advance(8, null);
      }
      return `${ghost.col},${ghost.row}` !== inicio;
    }

    expect(seMovioTras('cesped', 312)).toBe(false);
    expect(seMovioTras('cesped', 328)).toBe(true);

    // Con el mismo tiempo que basta en el césped, en el agua aún no se mueve.
    expect(seMovioTras('agua', 328)).toBe(false);
    expect(seMovioTras('agua', 408)).toBe(true);
  });

  it('las tumbonas y mesas frenan igual que un seto', () => {
    const session = patioSession();
    const { gridMap } = session;
    let bloqueado = false;
    for (let row = 0; row < MAZE_ROWS && !bloqueado; row++) {
      for (let col = 1; col < MAZE_COLS - 1; col++) {
        if (!gridMap.isObstacle(col, row) || !gridMap.canEnter(col - 1, row)) continue;
        session.player.col = col - 1;
        session.player.row = row;
        session.player.direction = 'right';
        session.player.nextDirection = 'right';
        session.tickPlayer();
        expect(session.player.col).toBe(col - 1);
        bloqueado = true;
        break;
      }
    }
    expect(bloqueado).toBe(true);
  });

  it('advance no mueve nada después de terminar la partida', () => {
    const session = patioSession(1);
    session.status = 'lost';
    const antes = { ...session.player };
    session.advance(5000, 'left');
    expect(session.player.col).toBe(antes.col);
    expect(session.player.row).toBe(antes.row);
  });

  it('un frame enorme no teletransporta al jugador', () => {
    const session = patioSession();
    const antes = session.player.col;
    session.advance(30_000, 'left');
    expect(antes - session.player.col).toBeLessThanOrEqual(4);
  });

  it('cuenta los puntos comidos aparte de los puntos de marcador', () => {
    const session = patioSession();
    stepsIn(session, 'left', 400);
    expect(session.pelletsEaten).toBeGreaterThan(0);
    expect(session.score).toBe(session.pelletsEaten * 10);
  });

  it('en el laberinto clásico todo va a velocidad normal', () => {
    const clasico = PlaySession.create(HERO, stubImg, [], MEDIUM);
    const patio = patioSession();
    const pasosClasico = stepsIn(clasico, 'left', 120);
    const pasosPatioCesped = stepsIn(patio, 'left', 120);
    expect(pasosClasico).toBe(pasosPatioCesped);
  });

  it('un fantasma en la misma celda termina la partida', () => {
    const session = PlaySession.create(
      HERO,
      stubImg,
      [{ data: GHOST, image: stubImg, col: 0, row: 0 }],
      MEDIUM,
      PATIO_PISCINA
    );
    session.ghosts[0]!.col = session.player.col;
    session.ghosts[0]!.row = session.player.row;
    session.checkCollisionsAfterPlayer();
    expect(session.status).toBe('lost');
    expect(session.caughtGhostId).toBe(GHOST.id);
  });
});
