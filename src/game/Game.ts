import type { CharacterData, FamilyData } from '@/data/characters';
import { FAMILIES, getCharacterById, resolveFamily } from '@/data/characters';
import {
  computeScore,
  createRankingClient,
  type MatchResult,
  type RankingClient,
} from '@/data/ranking';
import {
  loadPrefs,
  MAX_GHOSTS,
  MIN_GHOSTS,
  saveDifficulty,
  saveFamilyId,
  saveGhostIds,
  saveProtagonistId,
  saveScenarioId,
  updateHighScoreIfNeeded,
} from '@/data/storage';
import { PlayerInput } from '@/input/PlayerInput';
import { CharacterPicker } from '@/ui/CharacterPicker';
import { FamilyPicker } from '@/ui/FamilyPicker';
import { GameOverScreen } from '@/ui/GameOver';
import { getGhostCandidates, GhostPicker } from '@/ui/GhostPicker';
import { HUD } from '@/ui/HUD';
import { RankingScreen, type RankingState } from '@/ui/RankingScreen';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/game/constants';
import { DEFAULT_DIFFICULTY, getDifficultySettings, type Difficulty } from '@/game/difficulty';
import type { GridMap } from '@/game/GridMap';
import { DEFAULT_SCENARIO_ID, resolveScenario } from '@/game/scenarios';
import type { ScenarioDefinition } from '@/game/scenarios/types';
import { PlaySession, type GhostEntity, type PlayerEntity } from '@/game/PlaySession';
import { drawGhost, drawHero } from '@/game/renderEntity';
import { Score } from '@/game/Score';
import type { CanvasViewport } from '@/game/viewport';

export type GameScreen =
  | 'pick-family'
  | 'pick-protagonist'
  | 'pick-ghosts'
  | 'playing'
  | 'game-over'
  | 'ranking';

export class Game {
  currentScreen: GameScreen = 'pick-family';
  familyId: string;
  protagonistId: string | null = null;
  ghostIds: string[] = [];
  scenarioId: string = DEFAULT_SCENARIO_ID;
  currentDifficulty: Difficulty = DEFAULT_DIFFICULTY;

  gameOverReason: 'won' | 'caught' | null = null;
  caughtGhostId: string | null = null;

  playSession: PlaySession | null = null;

  readonly score = new Score();
  highScore = 0;

  readonly input = new PlayerInput();
  readonly hud = new HUD();
  readonly gameOverScreen = new GameOverScreen();

  readonly familyPicker: FamilyPicker;
  readonly characterPicker: CharacterPicker;
  readonly ghostPicker: GhostPicker;
  readonly rankingScreen: RankingScreen;

  /** `null` si no hay claves de Supabase: entonces el ranking ni aparece. */
  readonly ranking: RankingClient | null;
  private rankingState: RankingState = { status: 'loading' };
  /** Pantalla a la que volver al salir del ranking. */
  private rankingReturnTo: GameScreen = 'pick-family';

  private rafId: number | null = null;
  /** Instante del frame anterior; `null` significa «aún no hay dt fiable». */
  private lastFrameMs: number | null = null;
  private readonly images = new Map<string, HTMLImageElement>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly viewport?: CanvasViewport,
    rankingClient: RankingClient | null = createRankingClient()
  ) {
    this.ranking = rankingClient;
    const prefs = loadPrefs();
    this.highScore = prefs.highScore;
    this.familyId = resolveFamily(prefs.familyId).id;
    this.scenarioId = resolveScenario(prefs.scenarioId).id;
    this.currentDifficulty = prefs.difficulty ?? DEFAULT_DIFFICULTY;

    this.familyPicker = new FamilyPicker(
      FAMILIES,
      (id) => this.getImage(id),
      (id) => {
        this.setFamily(id);
        this.currentScreen = 'pick-protagonist';
      },
      this.ranking ? () => this.openRanking('pick-family') : undefined
    );

    this.rankingScreen = new RankingScreen(
      (id) => this.getImage(id),
      () => {
        this.currentScreen = this.rankingReturnTo;
      }
    );

    this.characterPicker = new CharacterPicker(
      (id) => this.getImage(id),
      () => {
        this.currentScreen = 'pick-family';
      },
      (id) => {
        this.setProtagonist(id);
        this.currentScreen = 'pick-ghosts';
      }
    );

    this.ghostPicker = new GhostPicker(
      (id) => this.getImage(id),
      () => {
        this.currentScreen = 'pick-protagonist';
      },
      (ids, difficulty, scenarioId) => {
        this.setGhosts(ids);
        this.setDifficulty(difficulty);
        this.setScenario(scenarioId);
        this.startGame();
      }
    );

    // El protagonista guardado solo vale si sigue estando en la familia guardada.
    if (prefs.protagonistId && this.roster.some((c) => c.id === prefs.protagonistId)) {
      this.protagonistId = prefs.protagonistId;
    }
    this.ghostIds = this.restoreGhosts(prefs.ghostIds, prefs.legacyGhostCount);

    this.familyPicker.restoreSelection(this.familyId);
    this.characterPicker.restoreSelection(this.protagonistId);
    this.ghostPicker.restoreSelection(this.ghostIds, this.currentDifficulty, this.scenarioId);

    this.input.attach();
    // Partidas que quedaron sin enviar la última vez (móvil sin cobertura).
    void this.ranking?.flushOutbox();
  }

  /** Abre el ranking y lo recarga; al salir se vuelve a `from`. */
  openRanking(from: GameScreen): void {
    if (!this.ranking) return;
    this.rankingReturnTo = from;
    this.currentScreen = 'ranking';
    this.rankingState = { status: 'loading' };
    void this.ranking
      .fetchRanking()
      .then((rows) => {
        this.rankingState = { status: 'ready', rows };
      })
      .catch((err: unknown) => {
        this.rankingState = {
          status: 'error',
          message: err instanceof Error ? err.message : 'Inténtalo más tarde',
        };
      });
  }

  /**
   * Versiones anteriores solo guardaban *cuantos* fantasmas habia. Se convierte
   * a la lista de ids tomando los primeros candidatos, que es justo lo que
   * hacia aquel reparto automatico.
   */
  private restoreGhosts(stored: string[] | null, legacyCount: number | null): string[] {
    const valid = new Set(this.ghostCandidates.map((c) => c.id));
    if (stored) {
      const kept = stored.filter((id) => valid.has(id));
      if (kept.length >= MIN_GHOSTS) return kept.slice(0, MAX_GHOSTS);
    }
    if (legacyCount !== null && this.protagonistId) {
      return this.ghostCandidates.slice(0, legacyCount).map((c) => c.id);
    }
    return [];
  }

  get scenario(): ScenarioDefinition {
    return resolveScenario(this.scenarioId);
  }

  get family(): FamilyData {
    return resolveFamily(this.familyId);
  }

  /** Personajes jugables de la familia activa. */
  get roster(): CharacterData[] {
    return this.family.characters;
  }

  /** Quienes pueden ser fantasmas: la familia menos el protagonista. */
  get ghostCandidates(): CharacterData[] {
    return this.protagonistId ? getGhostCandidates(this.protagonistId, this.roster) : this.roster;
  }

  /** Atajo de compatibilidad: la fuente de teclado dentro de la entrada unificada. */
  get keyboard(): PlayerInput['keyboard'] {
    return this.input.keyboard;
  }

  /** Conecta deslizamiento sobre el tablero y cruceta en pantalla. */
  attachTouchControls(swipeTarget: HTMLElement, dpad?: HTMLElement): void {
    this.input.touch.attachSwipe(swipeTarget);
    if (dpad) {
      this.input.touch.attachDpad(dpad);
    }
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
    this.lastFrameMs = null;
    this.input.detach();
  }

  registerImage(id: string, img: HTMLImageElement): void {
    this.images.set(id, img);
  }

  getImage(id: string): HTMLImageElement | undefined {
    return this.images.get(id);
  }

  setFamily(id: string): void {
    if (this.familyId === id) return;
    this.familyId = resolveFamily(id).id;
    saveFamilyId(localStorage, this.familyId);
    // Cambiar de familia invalida al héroe y al equipo: son de otra gente.
    this.protagonistId = null;
    this.ghostIds = [];
    this.characterPicker.reset();
    this.ghostPicker.resetSelection();
    saveProtagonistId(localStorage, null);
    saveGhostIds(localStorage, null);
  }

  setProtagonist(id: string): void {
    this.protagonistId = id;
    saveProtagonistId(localStorage, id);
    // El héroe no puede perseguirse a sí mismo.
    this.ghostPicker.keepOnly(this.ghostCandidates);
    this.setGhosts(this.ghostPicker.getSelected());
  }

  setGhosts(ids: string[]): void {
    this.ghostIds = ids.slice(0, MAX_GHOSTS);
    saveGhostIds(localStorage, this.ghostIds.length ? this.ghostIds : null);
  }

  setScenario(id: string): void {
    this.scenarioId = resolveScenario(id).id;
    saveScenarioId(localStorage, this.scenarioId);
  }

  setDifficulty(difficulty: Difficulty): void {
    this.currentDifficulty = difficulty;
    saveDifficulty(localStorage, difficulty);
  }

  startGame(): void {
    if (!this.protagonistId) {
      throw new Error('Falta elegir protagonista');
    }
    if (this.ghostIds.length < MIN_GHOSTS || this.ghostIds.length > MAX_GHOSTS) {
      throw new Error(`Hay que elegir entre ${MIN_GHOSTS} y ${MAX_GHOSTS} fantasmas`);
    }

    this.lastFrameMs = null;

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
    const ghostEntries: {
      data: CharacterData;
      image: HTMLImageElement;
      col: number;
      row: number;
    }[] = [];

    for (const id of this.ghostIds) {
      const data = getCharacterById(id);
      const img = this.getImage(id);
      if (!data || !img) continue;
      ghostEntries.push({ data, image: img, col: 0, row: 0 });
    }

    this.playSession = PlaySession.create(heroData, heroImg, ghostEntries, settings, this.scenario);
  }

  /**
   * Hace correr la partida hasta `timeMs`. Lo llama el bucle de dibujo, que ya
   * recibe el reloj del navegador; publico para que los tests puedan mover el
   * tiempo a mano sin temporizadores falsos.
   */
  advance(timeMs: number): void {
    if (this.currentScreen !== 'playing' || !this.playSession) {
      // Al volver de un menu no se arrastra el tiempo que estuvo parado.
      this.lastFrameMs = null;
      return;
    }

    const previous = this.lastFrameMs;
    this.lastFrameMs = timeMs;
    if (previous === null) {
      return;
    }

    this.playSession.advance(timeMs - previous, this.input.getDesiredDirection());
    this.syncScoreFromSession();

    if (this.playSession.status === 'won') {
      this.endGame('won');
    } else if (this.playSession.status === 'lost') {
      this.endGame('caught', this.playSession.caughtGhostId ?? undefined);
    }
  }

  private syncScoreFromSession(): void {
    if (!this.playSession) return;
    this.score.set(this.playSession.score);
  }

  endGame(reason: 'won' | 'caught', caughtGhostId?: string): void {
    this.lastFrameMs = null;
    const session = this.playSession;
    this.gameOverReason = reason;
    this.caughtGhostId = caughtGhostId ?? null;
    this.currentScreen = 'game-over';

    if (session) {
      // Los puntos finales no son sólo lo comido: ganar y hacerlo rápido suman.
      // Así «quién más come» y «quién más puntos saca» son dos listas distintas.
      this.score.set(
        computeScore({
          pellets: session.pelletsEaten,
          won: reason === 'won',
          durationMs: session.elapsedMs,
        })
      );
    }
    this.highScore = updateHighScoreIfNeeded(localStorage, this.score.get(), this.highScore);
    if (session) {
      void this.submitResult(session.pelletsEaten, session.elapsedMs, reason === 'won');
    }
  }

  private async submitResult(pellets: number, durationMs: number, won: boolean): Promise<void> {
    const hero = this.protagonistId ? getCharacterById(this.protagonistId) : undefined;
    if (!this.ranking || !hero) return;
    const result: MatchResult = {
      familyId: this.familyId,
      characterId: hero.id,
      characterName: hero.name,
      scenarioId: this.scenarioId,
      difficulty: this.currentDifficulty,
      pellets,
      score: this.score.get(),
      won,
      durationMs,
    };
    await this.ranking.submit(result);
  }

  reset(): void {
    this.lastFrameMs = null;
    this.currentScreen = 'pick-family';
    this.protagonistId = null;
    this.ghostIds = [];
    this.gameOverReason = null;
    this.caughtGhostId = null;
    this.playSession = null;
    this.score.reset();
    this.characterPicker.reset();
    this.ghostPicker.resetSelection();
    saveProtagonistId(localStorage, null);
    saveGhostIds(localStorage, null);
  }

  restartSameTeam(): void {
    this.startGame();
  }

  startLoop(): void {
    const loop = (timeMs: number): void => {
      // Reajustar en cada frame cubre los casos que los observadores de
      // tamaño no notifican (barra del navegador móvil, cambio de zoom).
      this.viewport?.resize();
      this.advance(timeMs);
      this.render(timeMs);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameMs = null;
  }

  render(timeMs = 0): void {
    const { ctx } = this;
    this.viewport?.applyTransform(ctx);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.currentScreen === 'ranking') {
      this.rankingScreen.render(ctx, this.rankingState);
      return;
    }

    if (this.currentScreen === 'pick-family') {
      this.familyPicker.render(ctx);
      return;
    }

    if (this.currentScreen === 'pick-protagonist') {
      this.characterPicker.render(ctx, this.roster);
      return;
    }

    if (this.currentScreen === 'pick-ghosts') {
      this.ghostPicker.render(ctx, this.protagonistId, this.ghostCandidates);
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
      session.gridMap.draw(ctx, timeMs);
      drawHero(
        ctx,
        {
          id: session.player.data.id,
          image: session.player.image,
          col: session.player.col,
          row: session.player.row,
          direction: session.player.direction,
          accentColor: session.player.data.accentColor,
        },
        timeMs
      );
      for (const g of session.ghosts) {
        drawGhost(
          ctx,
          {
            id: g.data.id,
            image: g.image,
            col: g.col,
            row: g.row,
            direction: g.direction,
            accentColor: g.data.accentColor,
          },
          timeMs
        );
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
        showRanking: this.ranking !== null,
      });
    }
  }

  handleCanvasClick(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (this.currentScreen === 'ranking') {
      this.rankingScreen.handleClick(x, y);
    } else if (this.currentScreen === 'pick-family') {
      this.familyPicker.handleClick(x, y);
    } else if (this.currentScreen === 'pick-protagonist') {
      this.characterPicker.handleClick(x, y, this.roster);
    } else if (this.currentScreen === 'pick-ghosts') {
      this.ghostPicker.handleClick(x, y, this.ghostCandidates);
    } else if (this.currentScreen === 'playing') {
      // Tocar el tablero solo sirve para dar el foco al canvas.
    } else if (this.currentScreen === 'game-over') {
      const action = this.gameOverScreen.handleClick(x, y, this.ranking !== null);
      if (action === 'play-again') {
        this.reset();
      } else if (action === 'same-team') {
        this.restartSameTeam();
      } else if (action === 'ranking') {
        this.openRanking('game-over');
      }
    }
  }
}
