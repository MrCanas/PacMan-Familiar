import type { Maze } from '@/game/Maze';
import { Character } from '@/entities/Character';
import { directionDelta, oppositeDirection, type Direction } from '@/entities/direction';

const ALL_DIRS: Direction[] = ['up', 'down', 'left', 'right'];

export function getOpenDirections(maze: Maze, col: number, row: number): Direction[] {
  return ALL_DIRS.filter((d) => {
    const { dx, dy } = directionDelta(d);
    return maze.isWalkable(col + dx, row + dy);
  });
}

export class Ghost extends Character {
  override update(maze: Maze): void {
    const eps = Math.max(1.5, this.speed);
    const { col, row } = this.getLogicalCell();

    if (this.isNearCenterOfCell(col, row, eps)) {
      const open = getOpenDirections(maze, col, row);
      const opp = oppositeDirection(this.direction);
      const notBack = open.filter((d) => d !== opp);

      if (open.length > 2) {
        const choices = notBack.length ? notBack : open;
        const pick = choices[Math.floor(Math.random() * choices.length)]!;
        this.direction = pick;
      } else if (notBack.length === 1) {
        this.direction = notBack[0]!;
      } else if (notBack.length > 1) {
        const pick = notBack[Math.floor(Math.random() * notBack.length)]!;
        this.direction = pick;
      } else if (open.length === 1) {
        this.direction = open[0]!;
      }
    }

    super.update(maze);
  }
}
