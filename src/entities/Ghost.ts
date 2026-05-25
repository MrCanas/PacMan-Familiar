import type { CharacterData } from '@/data/characters';
import type { DifficultySettings } from '@/game/difficulty';
import type { Maze } from '@/game/Maze';
import { Character } from '@/entities/Character';
import { getOpenDirections, pickGhostDirection } from '@/entities/ghostAI';
import { oppositeDirection, type Direction } from '@/entities/direction';

export class Ghost extends Character {
  private readonly chaseProbability: number;
  private readonly decisionInterval: number;
  private decisionCooldown = 0;

  constructor(
    data: CharacterData,
    image: HTMLImageElement,
    spawnCol: number,
    spawnRow: number,
    speed: number,
    initialDirection: Direction = 'left',
    settings?: Pick<DifficultySettings, 'chaseProbability' | 'ghostMoveInterval'>
  ) {
    super(data, image, spawnCol, spawnRow, speed, initialDirection);
    this.chaseProbability = settings?.chaseProbability ?? 0.6;
    this.decisionInterval = settings?.ghostMoveInterval ?? 2;
  }

  override update(maze: Maze, target?: { col: number; row: number }): void {
    const eps = Math.max(1.5, this.speed);
    const { col, row } = this.getLogicalCell();

    if (this.isNearCenterOfCell(col, row, eps) && target) {
      const open = getOpenDirections(maze, col, row);
      if (open.length === 1) {
        this.direction = open[0]!;
      }

      const opp = oppositeDirection(this.direction);
      const notBack = open.filter((d) => d !== opp);
      const needsDecision = open.length > 2 || notBack.length === 1 || notBack.length > 1;

      if (needsDecision && open.length > 1) {
        this.decisionCooldown += 1;
        if (this.decisionCooldown >= this.decisionInterval) {
          this.decisionCooldown = 0;
          this.direction = pickGhostDirection(
            maze,
            col,
            row,
            this.direction,
            target.col,
            target.row,
            this.chaseProbability
          );
        }
      }
    }

    super.update(maze);
  }
}
