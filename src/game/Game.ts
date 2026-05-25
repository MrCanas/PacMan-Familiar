import { CHARACTERS, getCharacterById } from '@/data/characters';
import {
  loadPrefs,
  saveGhostCount,
  saveProtagonistId,
  updateHighScoreIfNeeded,
} from '@/data/storage';
import { Keyboard } from '@/input/Keyboard';
import { CharacterPicker } from '@/ui/CharacterPicker';
import { GameOverScreen } from '@/ui/GameOver';
import { getGhostCandidates, GhostCountPicker } from '@/ui/GhostCountPicker';
import { HUD } from '@/ui/HUD';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
} from '@/game/constants';
import {
  DEFAULT_DIFFICULTY,
  getDifficultySettings,
  type Difficulty,
} from '@/game/difficulty';
import type { GridMap } from '@/game/GridMap';
import { PlaySession, type GhostEntity, type PlayerEntity } from '@/game/PlaySession';
import { drawCharacterFace } from '@/game/renderEntity';
import { Score } from '@/game/Score';

export type GameScreen = 'pick-protagonist' | 'pick-ghost-count' | 'playing' | 'game-over';

export class Game {
  currentScreen: GameScreen = 'pick-protagonist';
  protagonistId: string | null = null;
  ghostCount: number | null = null;
  currentDifficulty: Difficulty = DEFAULT_DIFFICULTY;

  gameOverReason: 'won' | 'caught' | null = null;
  caughtGhostId: string | null = null;

  playSession: PlaySession | null = null;

  readonly score = new Score();
  highScore = 0;

  readonly keyboard = new Keyboard();
  readonly hud = new HUD();
  readonly gameOverScreen = new GameOverScreen();

  readonly characterPicker: CharacterPicker;
  readonly ghostPicker: GhostCountPicker;

  private rafId: number | null = null;
  private playerIntervalId: ReturnType<typeof setInterval> | null = null;
  private ghostIntervalId: ReturnType<typeof setInterval> | null = null;
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
      (n, difficulty) => {
        this.setGhostCount(n);
        this.setDifficulty(difficulty);
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

  /** Compatibilidad con tests: laberinto activo. */
  get maze(): GridMap | null {
    return this.playSession?.gridMap ?? null;
  }

  /** Compatibilidad con tests: jugador activo. */
  get protagonist(): PlayerEntity | null {
    return this.playSession?.player ?? null;
  }

  /** Compatibilidad con tests: fantasmas activos. */
  get ghosts(): GhostEntity[] {
    return this.playSession?.ghosts ?? [];
  }

  destroy(): void {
    this.stopLoop();
    this.stopGameplayIntervals();
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

  setDifficulty(difficulty: Difficulty): void {
    this.currentDifficulty = difficulty;
  }

  startGame(): void {
    if (!this.protagonistId || this.ghostCount === null || this.ghostCount < 1 || this.ghostCount > 4) {
      throw new Error('Falta protagonista o cantidad de fantasmas válida');
    }

    this.stopGameplayIntervals();

    this.gameOverReason = null;
    this.caughtGhostId = null;
    this.currentScreen = 'playing';
    this.score.reset();

    const heroData = getCharacterById(this.protagonistId);
    const heroImg = this.getImage(this.protagonistId);
    if (!heroData || !heroImg) {
      throw new Error('Protagonista inválido');
    }

    const settings = getDifficultySettings(this.currentDifficulty);
    const candidates = getGhostCandidates(this.protagonistId, CHARACTERS);
    const ghostEntries: { data: (typeof candidates)[0]; image: HTMLImageElement; col: number; row: number }[] = [];

    for (let i = 0; i < this.ghostCount; i++) {
      const data = candidates[i % candidates.length]!;
      const img = this.getImage(data.id);
      if (!img) continue;
      ghostEntries.push({ data, image: img, col: 0, row: 0 });
    }

    this.playSession = PlaySession.create(heroData, heroImg, ghostEntries, settings);

    this.playerIntervalId = setInterval(() => this.onPlayerTick(), settings.playerMoveInterval);
    this.ghostIntervalId = setInterval(() => this.onGhostTick(), settings.ghostMoveInterval);
  }

  private onPlayerTick(): void {
    if (this.currentScreen !== 'playing' || !this.playSession) {
      return;
    }

    const dir = this.keyboard.getDesiredDirection();
    this.playSession.setPlayerIntent(dir);
    this.playSession.tickPlayer();
    this.playSession.checkCollisionsAfterPlayer();
    this.syncScoreFromSession();

    if (this.playSession.status === 'won') {
      this.endGame('won');
    } else if (this.playSession.status === 'lost') {
      this.endGame('caught', this.playSession.caughtGhostId ?? undefined);
    }
  }

  private onGhostTick(): void {
    if (this.currentScreen !== 'playing' || !this.playSession) {
      return;
    }

    this.playSession.tickGhosts();
    this.syncScoreFromSession();

    if (this.playSession.status === 'lost') {
      this.endGame('caught', this.playSession.caughtGhostId ?? undefined);
    }
  }

  private syncScoreFromSession(): void {
    if (!this.playSession) return;
    this.score.set(this.playSession.score);
  }

  endGame(reason: 'won' | 'caught', caughtGhostId?: string): void {
    this.stopGameplayIntervals();
    this.gameOverReason = reason;
    this.caughtGhostId = caughtGhostId ?? null;
    this.currentScreen = 'game-over';
    this.highScore = updateHighScoreIfNeeded(localStorage, this.score.get(), this.highScore);
  }

  reset(): void {
    this.stopGameplayIntervals();
    this.currentScreen = 'pick-protagonist';
    this.protagonistId = null;
    this.ghostCount = null;
    this.gameOverReason = null;
    this.caughtGhostId = null;
    this.playSession = null;
    this.score.reset();
    this.characterPicker.reset();
    this.ghostPicker.resetSelection();
    saveProtagonistId(localStorage, null);
    saveGhostCount(localStorage, null);
  }

  restartSameTeam(): void {
    this.startGame();
  }

  private stopGameplayIntervals(): void {
    if (this.playerIntervalId !== null) {
      clearInterval(this.playerIntervalId);
      this.playerIntervalId = null;
    }
    if (this.ghostIntervalId !== null) {
      clearInterval(this.ghostIntervalId);
      this.ghostIntervalId = null;
    }
  }

  startLoop(): void {
    const loop = (): void => {
      this.render();
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

    if (this.currentScreen === 'playing' && this.playSession) {
      const session = this.playSession;
      this.hud.render(ctx, {
        score: this.score.get(),
        highScore: this.highScore,
        protagonistId: this.protagonistId!,
        ghostIds: session.ghosts.map((g) => g.data.id),
        getImage: (id) => this.getImage(id),
      });
      session.gridMap.draw(ctx);
      drawCharacterFace(ctx, session.player.image, session.player.col, session.player.row, session.player.data.accentColor);
      for (const g of session.ghosts) {
        drawCharacterFace(ctx, g.image, g.col, g.row, g.data.accentColor);
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
