import type { CharacterData } from '@/data/characters';
import { directionDelta, type Direction } from '@/entities/direction';
import { PELLET_VALUE } from '@/game/constants';
import type { DifficultySettings } from '@/game/difficulty';
import { chooseGhostMove } from '@/game/ghostAI';
import { GridMap } from '@/game/GridMap';

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
  caughtGhostId: string | null = null;
  private readonly chaseProbability: number;

  constructor(
    gridMap: GridMap,
    player: PlayerEntity,
    ghosts: GhostEntity[],
    chaseProbability: number
  ) {
    this.gridMap = gridMap;
    this.player = player;
    this.ghosts = ghosts;
    this.chaseProbability = chaseProbability;
  }

  static create(
    protagonistData: CharacterData,
    protagonistImage: HTMLImageElement,
    ghostEntries: { data: CharacterData; image: HTMLImageElement; col: number; row: number }[],
    settings: DifficultySettings
  ): PlaySession {
    const gridMap = GridMap.createForPlay();
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

    return new PlaySession(gridMap, player, ghosts, settings.chaseProbability);
  }

  setPlayerIntent(direction: Direction | null): void {
    if (!direction || this.status !== 'playing') {
      return;
    }
    this.player.nextDirection = direction;
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
    }

    if (gridMap.pelletsRemaining() === 0) {
      this.status = 'won';
    }
  }

  /** Un paso por fantasma (una celda cada uno). */
  tickGhosts(): void {
    if (this.status !== 'playing') {
      return;
    }

    const { player, gridMap } = this;

    for (const ghost of this.ghosts) {
      const open = chooseGhostMove(
        gridMap,
        ghost.col,
        ghost.row,
        ghost.direction,
        player.col,
        player.row,
        this.chaseProbability
      );
      ghost.direction = open;

      const { dx, dy } = directionDelta(ghost.direction);
      const nc = ghost.col + dx;
      const nr = ghost.row + dy;

      if (gridMap.canEnter(nc, nr)) {
        ghost.col = nc;
        ghost.row = nr;
      }
    }

    this.checkGhostCollision();
  }

  private applyBufferedDirection(player: PlayerEntity, gridMap: GridMap): void {
    const { dx, dy } = directionDelta(player.nextDirection);
    if (gridMap.canEnter(player.col + dx, player.row + dy)) {
      player.direction = player.nextDirection;
    }
  }

  private checkGhostCollision(): void {
    for (const ghost of this.ghosts) {
      if (ghost.col === this.player.col && ghost.row === this.player.row) {
        this.status = 'lost';
        this.caughtGhostId = ghost.data.id;
        return;
      }
    }
  }

  /** Comprueba colisión tras movimiento del jugador. */
  checkCollisionsAfterPlayer(): void {
    if (this.status !== 'playing') {
      return;
    }
    this.checkGhostCollision();
  }
}
