import { CHARACTERS, getCharacterById } from '@/data/characters';
import {
  loadPrefs,
  saveGhostCount,
  saveProtagonistId,
  updateHighScoreIfNeeded,
} from '@/data/storage';
import { Ghost } from '@/entities/Ghost';
import { Protagonist } from '@/entities/Protagonist';
import { Keyboard } from '@/input/Keyboard';
import { CharacterPicker } from '@/ui/CharacterPicker';
import { GameOverScreen } from '@/ui/GameOver';
import { getGhostCandidates, GhostCountPicker } from '@/ui/GhostCountPicker';
import { HUD } from '@/ui/HUD';
import { checkProtagonistGhostCollision } from '@/game/Collision';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GHOST_SPEED_FACTOR,
  PROTAGONIST_SPEED,
} from '@/game/constants';
import { Maze } from '@/game/Maze';
import { Score } from '@/game/Score';

export type GameScreen = 'pick-protagonist' | 'pick-ghost-count' | 'playing' | 'game-over';

export class Game {
  currentScreen: GameScreen = 'pick-protagonist';
  protagonistId: string | null = null;
  ghostCount: number | null = null;

  gameOverReason: 'won' | 'caught' | null = null;
  caughtGhostId: string | null = null;

  maze: Maze | null = null;
  protagonist: Protagonist | null = null;
  ghosts: Ghost[] = [];

  readonly score = new Score();
  highScore = 0;

  readonly keyboard = new Keyboard();
  readonly hud = new HUD();
  readonly gameOverScreen = new GameOverScreen();

  readonly characterPicker: CharacterPicker;
  readonly ghostPicker: GhostCountPicker;

  private rafId: number | null = null;
  private readonly images = new Map<string, HTMLImageElement>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D
  ) {
    const prefs = loadPrefs();
    this.highScore = prefs.highScore;
    this.protagonistId = prefs.protagonistId;
    this.ghostCount = prefs.ghostCount;

    this.characterPicker = new CharacterPicker(CHARACTERS, (id) => this.getImage(id), (id) => {
      this.setProtagonist(id);
      this.currentScreen = 'pick-ghost-count';
    });

    this.ghostPicker = new GhostCountPicker(
      CHARACTERS,
      (id) => this.getImage(id),
      () => {
        this.currentScreen = 'pick-protagonist';
      },
      (n) => {
        this.setGhostCount(n);
        this.startGame();
      }
    );

    if (prefs.protagonistId) {
      this.characterPicker.restoreSelection(prefs.protagonistId);
    }
    if (prefs.ghostCount !== null) {
      this.ghostPicker.restoreCount(prefs.ghostCount);
    }

    this.keyboard.attach();
  }

  destroy(): void {
    this.stopLoop();
    this.keyboard.detach();
  }

  registerImage(id: string, img: HTMLImageElement): void {
    this.images.set(id, img);
  }

  getImage(id: string): HTMLImageElement | undefined {
    return this.images.get(id);
  }

  setProtagonist(id: string): void {
    this.protagonistId = id;
    saveProtagonistId(localStorage, id);
  }

  setGhostCount(n: number): void {
    this.ghostCount = n;
    saveGhostCount(localStorage, n);
  }

  startGame(): void {
    if (!this.protagonistId || this.ghostCount === null || this.ghostCount < 1 || this.ghostCount > 4) {
      throw new Error('Falta protagonista o cantidad de fantasmas válida');
    }

    this.gameOverReason = null;
    this.caughtGhostId = null;
    this.currentScreen = 'playing';

    this.maze = new Maze();
    this.score.reset();

    const { protagonist: pSpawn, ghosts: gSpawns } = this.maze.getSpawnPositions();
    const heroData = getCharacterById(this.protagonistId);
    const heroImg = this.getImage(this.protagonistId);
    if (!heroData || !heroImg) {
      throw new Error('Protagonista inválido');
    }

    this.protagonist = new Protagonist(
      heroData,
      heroImg,
      pSpawn.col,
      pSpawn.row,
      PROTAGONIST_SPEED,
      (pts) => this.score.add(pts)
    );

    const candidates = getGhostCandidates(this.protagonistId, CHARACTERS);
    const n = this.ghostCount;
    this.ghosts = [];
    for (let i = 0; i < n; i++) {
      const data = candidates[i % candidates.length]!;
      const img = this.getImage(data.id);
      if (!img) continue;
      const spawn = gSpawns[i % gSpawns.length]!;
      this.ghosts.push(
        new Ghost(data, img, spawn.col, spawn.row, PROTAGONIST_SPEED * GHOST_SPEED_FACTOR, 'left')
      );
    }
  }

  endGame(reason: 'won' | 'caught', caughtGhostId?: string): void {
    this.gameOverReason = reason;
    this.caughtGhostId = caughtGhostId ?? null;
    this.currentScreen = 'game-over';
    this.highScore = updateHighScoreIfNeeded(localStorage, this.score.get(), this.highScore);
  }

  reset(): void {
    this.currentScreen = 'pick-protagonist';
    this.protagonistId = null;
    this.ghostCount = null;
    this.gameOverReason = null;
    this.caughtGhostId = null;
    this.maze = null;
    this.protagonist = null;
    this.ghosts = [];
    this.score.reset();
    this.characterPicker.reset();
    this.ghostPicker.resetSelection();
    saveProtagonistId(localStorage, null);
    saveGhostCount(localStorage, null);
  }

  restartSameTeam(): void {
    if (!this.protagonistId || this.ghostCount === null) {
      this.startGame();
      return;
    }
    this.startGame();
  }

  startLoop(): void {
    const loop = (): void => {
      this.tick();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick(): void {
    if (this.currentScreen === 'playing' && this.maze && this.protagonist) {
      const dir = this.keyboard.getDesiredDirection();
      if (dir) {
        this.protagonist.applyDesiredDirection(dir);
      }
      this.protagonist.update(this.maze);
      for (const g of this.ghosts) {
        g.update(this.maze);
      }

      if (this.maze.pelletsRemaining() === 0) {
        this.endGame('won');
      } else {
        const hit = checkProtagonistGhostCollision(this.protagonist, this.ghosts);
        if (hit) {
          this.endGame('caught', hit.data.id);
        }
      }
    }

    this.render();
  }

  render(): void {
    const { ctx } = this;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.currentScreen === 'pick-protagonist') {
      this.characterPicker.render(ctx);
      return;
    }

    if (this.currentScreen === 'pick-ghost-count') {
      this.ghostPicker.render(ctx, this.protagonistId);
      return;
    }

    if (this.currentScreen === 'playing' && this.maze && this.protagonist) {
      this.hud.render(ctx, {
        score: this.score.get(),
        highScore: this.highScore,
        protagonistId: this.protagonistId!,
        ghostIds: this.ghosts.map((g) => g.data.id),
        getImage: (id) => this.getImage(id),
      });
      this.maze.draw(ctx);
      this.protagonist.draw(ctx);
      for (const g of this.ghosts) {
        g.draw(ctx);
      }
      return;
    }

    if (this.currentScreen === 'game-over' && this.gameOverReason && this.protagonistId) {
      this.gameOverScreen.render(ctx, {
        reason: this.gameOverReason,
        protagonistId: this.protagonistId,
        ghostId: this.caughtGhostId ?? undefined,
        score: this.score.get(),
        getImage: (id) => this.getImage(id),
      });
    }
  }

  handleCanvasClick(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (this.currentScreen === 'pick-protagonist') {
      this.characterPicker.handleClick(x, y);
    } else if (this.currentScreen === 'pick-ghost-count') {
      this.ghostPicker.handleClick(x, y, this.protagonistId);
    } else if (this.currentScreen === 'game-over') {
      const action = this.gameOverScreen.handleClick(x, y);
      if (action === 'play-again') {
        this.reset();
      } else if (action === 'same-team') {
        this.restartSameTeam();
      }
    }
  }
}
