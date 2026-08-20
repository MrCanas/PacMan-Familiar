import { LEFT_HALF_ROWS } from '@/game/mazeTemplate';
import { neonTheme } from '@/game/scenarios/themes/neon';
import type { ScenarioDefinition } from '@/game/scenarios/types';

/**
 * El laberinto de toda la vida. Se escribe a medias: diez simbolos por fila
 * que se reflejan sobre las otras diez columnas, y asi la simetria sale
 * garantizada en vez de a mano.
 */
export const CLASSIC_MAZE: ScenarioDefinition = {
  id: 'classic',
  name: 'Laberinto clásico',
  description: 'Pasillos de neón, como el de siempre',
  rows: { kind: 'mirrored', halfRows: LEFT_HALF_ROWS },
  theme: neonTheme,
};
