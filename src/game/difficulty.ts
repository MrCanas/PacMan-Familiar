import { PROTAGONIST_SPEED } from '@/game/constants';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DEFAULT_DIFFICULTY: Difficulty = 'medium';

export type DifficultySettings = {
  ghostSpeed: number;
  chaseProbability: number;
  ghostMoveInterval: number;
};

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    ghostSpeed: PROTAGONIST_SPEED * 0.65,
    chaseProbability: 0.35,
    ghostMoveInterval: 4,
  },
  medium: {
    ghostSpeed: PROTAGONIST_SPEED * 0.85,
    chaseProbability: 0.6,
    ghostMoveInterval: 2,
  },
  hard: {
    ghostSpeed: PROTAGONIST_SPEED * 1.05,
    chaseProbability: 0.8,
    ghostMoveInterval: 1,
  },
};

export function getDifficultySettings(difficulty: Difficulty): DifficultySettings {
  return DIFFICULTY_SETTINGS[difficulty];
}

export function isDifficulty(value: string): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}
