import { CLASSIC_MAZE } from '@/game/scenarios/classicMaze';
import { PATIO_PISCINA } from '@/game/scenarios/patioPiscina';
import type { ScenarioDefinition, ScenarioId } from '@/game/scenarios/types';

export { CLASSIC_MAZE, PATIO_PISCINA };
export type { ScenarioDefinition, ScenarioId };

export const SCENARIOS: ScenarioDefinition[] = [CLASSIC_MAZE, PATIO_PISCINA];

export const DEFAULT_SCENARIO_ID: ScenarioId = CLASSIC_MAZE.id;

export function getScenarioById(id: string | null): ScenarioDefinition | undefined {
  if (!id) return undefined;
  return SCENARIOS.find((s) => s.id === id);
}

/** Escenario guardado, o el clásico si el id ya no existe. */
export function resolveScenario(id: string | null): ScenarioDefinition {
  return getScenarioById(id) ?? CLASSIC_MAZE;
}
