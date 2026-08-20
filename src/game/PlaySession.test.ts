import { describe, expect, it } from 'vitest';

import { ALL_CHARACTERS } from '@/data/characters';
import { getDifficultySettings } from '@/game/difficulty';
import { PlaySession } from '@/game/PlaySession';

const stubImg = new Image();
stubImg.width = 32;
stubImg.height = 32;

describe('PlaySession', () => {
  it('jugador se mueve una celda con dirección válida', () => {
    const hero = ALL_CHARACTERS[0]!;
    const session = PlaySession.create(hero, stubImg, [], getDifficultySettings('medium'));
    const { col, row } = session.player;
    session.setPlayerIntent('left');
    session.tickPlayer();
    expect(session.player.col).toBeLessThan(col);
    expect(session.player.row).toBe(row);
  });

  it('jugador no entra en pared', () => {
    const hero = ALL_CHARACTERS[0]!;
    const session = PlaySession.create(hero, stubImg, [], getDifficultySettings('medium'));
    session.player.col = 0;
    session.player.row = 1;
    session.player.direction = 'left';
    session.player.nextDirection = 'left';
    session.tickPlayer();
    expect(session.player.col).toBe(0);
  });

  it('pierde si fantasma comparte celda', () => {
    const hero = ALL_CHARACTERS[0]!;
    const ghost = ALL_CHARACTERS[1]!;
    const session = PlaySession.create(
      hero,
      stubImg,
      [{ data: ghost, image: stubImg, col: 0, row: 0 }],
      getDifficultySettings('medium')
    );
    session.ghosts[0]!.col = session.player.col;
    session.ghosts[0]!.row = session.player.row;
    session.checkCollisionsAfterPlayer();
    expect(session.status).toBe('lost');
  });
});
