import type { CharacterData } from '@/data/characters';
import { directionDelta, type Direction } from '@/entities/direction';
import { PELLET_VALUE } from '@/game/constants';
import type { DifficultySettings } from '@/game/difficulty';
import { chooseGhostMove } from '@/game/ghostAI';
import { GridMap } from '@/game/GridMap';
import { CLASSIC_MAZE } from '@/game/scenarios/classicMaze';
import type { ScenarioDefinition } from '@/game/scenarios/types';
import { StepClock } from '@/game/StepClock';

export type PlayStatus = 'playing' | 'won' | 'lost';

export type PlayerEntity = {
  col: number;
  row: number;
  direction: Direction;
  nextDirection: Direction;
  data: CharacterData;
  image: HTMLImageElement;
};

export type GhostEntity = {
  col: number;
  row: number;
  direction: Direction;
  data: CharacterData;
  image: HTMLImageElement;
};

export class PlaySession {
  readonly gridMap: GridMap;
  player: PlayerEntity;
  ghosts: GhostEntity[];
  status: PlayStatus = 'playing';
  score = 0;
  /** Puntos comidos en esta partida; el ranking los necesita aparte. */
  pelletsEaten = 0;
  elapsedMs = 0;
  caughtGhostId: string | null = null;

  private readonly chaseProbability: number;
  private readonly playerClock: StepClock;
  /** Un reloj por fantasma: el que está en la piscina se queda atrás. */
  private readonly ghostClocks: StepClock[];

  constructor(
    gridMap: GridMap,
    player: PlayerEntity,
    ghosts: GhostEntity[],
    settings: DifficultySettings
  ) {
    this.gridMap = gridMap;
    this.player = player;
    this.ghosts = ghosts;
    this.chaseProbability = settings.chaseProbability;
    this.playerClock = new StepClock({ baseIntervalMs: settings.playerMoveInterval });
    this.ghostClocks = ghosts.map(
      () => new StepClock({ baseIntervalMs: settings.ghostMoveInterval })
    );
  }

  static create(
    protagonistData: CharacterData,
    protagonistImage: HTMLImageElement,
    ghostEntries: { data: CharacterData; image: HTMLImageElement; col: number; row: number }[],
    settings: DifficultySettings,
    scenario: ScenarioDefinition = CLASSIC_MAZE
  ): PlaySession {
    const gridMap = GridMap.createForPlay(scenario);
    const { protagonist, ghosts: ghostSpawns } = gridMap.getSpawnPositions();

    const player: PlayerEntity = {
      col: protagonist.col,
      row: protagonist.row,
      direction: 'right',
      nextDirection: 'right',
      data: protagonistData,
      image: protagonistImage,
    };

    const ghosts: GhostEntity[] = ghostEntries.map((entry, i) => {
      const spawn = ghostSpawns[i % ghostSpawns.length]!;
      return {
        col: spawn.col,
        row: spawn.row,
        direction: 'left',
        data: entry.data,
        image: entry.image,
      };
    });

    return new PlaySession(gridMap, player, ghosts, settings);
  }

  setPlayerIntent(direction: Direction | null): void {
    if (!direction || this.status !== 'playing') {
      return;
    }
    this.player.nextDirection = direction;
  }

  /** Cuánto de rápido va esa ficha ahora mismo, según la casilla que pisa. */
  private speedFactorOf(entity: { col: number; row: number }): number {
    return this.gridMap.speedFactorAt(entity.col, entity.row);
  }

  /**
   * Hace correr la partida `dtMs` milisegundos.
   *
   * Cada ficha lleva su propio reloj, así que dentro de la piscina se avanza a
   * 0,8x sin que eso afecte a quien va por el césped.
   */
  advance(dtMs: number, intent: Direction | null): void {
    if (this.status !== 'playing') {
      return;
    }
    this.elapsedMs += dtMs;
    this.setPlayerIntent(intent);

    this.playerClock.advance(
      dtMs,
      () => this.speedFactorOf(this.player),
      () => {
        this.tickPlayer();
        this.checkCollisionsAfterPlayer();
      }
    );

    this.ghosts.forEach((ghost, i) => {
      this.ghostClocks[i]?.advance(
        dtMs,
        () => this.speedFactorOf(ghost),
        () => this.tickGhost(ghost)
      );
    });
  }

  /** Un paso del jugador (una celda). */
  tickPlayer(): void {
    if (this.status !== 'playing') {
      return;
    }

    const { player, gridMap } = this;
    this.applyBufferedDirection(player, gridMap);

    const { dx, dy } = directionDelta(player.direction);
    const nc = player.col + dx;
    const nr = player.row + dy;

    if (!gridMap.canEnter(nc, nr)) {
      return;
    }

    player.col = nc;
    player.row = nr;

    if (gridMap.eatPellet(player.col, player.row)) {
      this.score += PELLET_VALUE;
      this.pelletsEaten += 1;
    }

    if (gridMap.pelletsRemaining() === 0) {
      this.status = 'won';
    }
  }

  /** Un paso de todos los fantasmas. */
  tickGhosts(): void {
    if (this.status !== 'playing') {
      return;
    }
    for (const ghost of this.ghosts) {
      this.tickGhost(ghost);
    }
  }

  /** Un paso de un fantasma concreto, con su colisión inmediata. */
  tickGhost(ghost: GhostEntity): void {
    if (this.status !== 'playing') {
      return;
    }

    const { player, gridMap } = this;
    ghost.direction = chooseGhostMove(
      gridMap,
      ghost.col,
      ghost.row,
      ghost.direction,
      player.col,
      player.row,
      this.chaseProbability
    );

    const { dx, dy } = directionDelta(ghost.direction);
    const nc = ghost.col + dx;
    const nr = ghost.row + dy;

    if (gridMap.canEnter(nc, nr)) {
      ghost.col = nc;
      ghost.row = nr;
    }

    this.checkGhostCollision();
  }

  private applyBufferedDirection(player: PlayerEntity, gridMap: GridMap): void {
    const { dx, dy } = directionDelta(player.nextDirection);
    if (gridMap.canEnter(player.col + dx, player.row + dy)) {
      player.direction = player.nextDirection;
    }
  }

  /**
   * Cada ficha se mueve por su cuenta y se comprueba justo despues de cada
   * paso, asi que el cruce (heroe y fantasma intercambiando celda sin tocarse)
   * no puede darse: quien entra en la celda del otro choca alli mismo.
   */
  private checkGhostCollision(): void {
    for (const ghost of this.ghosts) {
      if (ghost.col === this.player.col && ghost.row === this.player.row) {
        this.lose(ghost);
        return;
      }
    }
  }

  private lose(ghost: GhostEntity): void {
    this.status = 'lost';
    this.caughtGhostId = ghost.data.id;
  }

  /** Comprueba colisión tras movimiento del jugador. */
  checkCollisionsAfterPlayer(): void {
    if (this.status !== 'playing') {
      return;
    }
    this.checkGhostCollision();
  }
}
