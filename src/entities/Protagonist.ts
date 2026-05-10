import type { CharacterData } from '@/data/characters';
import { PELLET_VALUE } from '@/game/constants';
import type { Maze } from '@/game/Maze';
import { Character } from '@/entities/Character';
import type { Direction } from '@/entities/direction';

export class Protagonist extends Character {
  private readonly onScore: (points: number) => void;

  constructor(
    data: CharacterData,
    image: HTMLImageElement,
    spawnCol: number,
    spawnRow: number,
    speed: number,
    onScore: (points: number) => void,
    initialDirection: Direction = 'right'
  ) {
    super(data, image, spawnCol, spawnRow, speed, initialDirection);
    this.onScore = onScore;
  }

  applyDesiredDirection(dir: Direction | null): void {
    if (dir) {
      this.setQueuedDirection(dir);
    }
  }

  override update(maze: Maze): void {
    super.update(maze);
    const { col, row } = this.getLogicalCell();
    if (this.isNearCenterOfCell(col, row, 2)) {
      if (maze.eatPellet(col, row)) {
        this.onScore(PELLET_VALUE);
      }
    }
  }
}
