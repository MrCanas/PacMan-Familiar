export type Difficulty = 'easy' | 'medium' | 'hard';

export const DEFAULT_DIFFICULTY: Difficulty = 'medium';

export type DifficultySettings = {
  playerMoveInterval: number;
  ghostMoveInterval: number;
  chaseProbability: number;
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    playerMoveInterval: 160,
    ghostMoveInterval: 450,
    chaseProbability: 0.35,
  },
  medium: {
    playerMoveInterval: 140,
    ghostMoveInterval: 320,
    chaseProbability: 0.6,
  },
  hard: {
    playerMoveInterval: 120,
    ghostMoveInterval: 220,
    chaseProbability: 0.8,
  },
};

export function getDifficultySettings(difficulty: Difficulty): DifficultySettings {
  return DIFFICULTY_SETTINGS[difficulty];
}
