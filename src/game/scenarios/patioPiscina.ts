import { patioTheme } from '@/game/scenarios/themes/patio';
import type { ScenarioDefinition } from '@/game/scenarios/types';

/**
 * El patio de casa: cesped rodeado de seto, tumbonas y mesas con sombrilla
 * como obstaculos, y la piscina en medio.
 *
 * Cruzar la piscina es el atajo, pero dentro del agua se va a 0,8x, y hay doce
 * puntos flotando ahi para que merezca la pena arriesgarse. Vale tanto para el
 * protagonista como para los fantasmas.
 *
 * Simbolos: `H` seto, `C` tumbona, `T` mesa, `.` punto en cesped, `~` agua,
 * `o` punto flotando, `P` salida del jugador, `G` salida de fantasma.
 */
export const PATIO_PISCINA: ScenarioDefinition = {
  id: 'patio',
  name: 'Patio con piscina',
  description: 'En el agua se nada a 0,8x. Cuidado con las tumbonas',
  rows: {
    kind: 'full',
    rows: [
      'HHHHHHHHHHHHHHHHHHHH',
      'H..................H',
      'H.CTC.........CTC..H',
      'HG................GH',
      'H...~~~~~~~~~~~~...H',
      'H...~oo~~~~~~oo~...H',
      'H...~~~~~~~~~~~~...H',
      'H..~~~oo~~~~oo~~~..H',
      'H...~~~~~~~~~~~~...H',
      'H...~oo~~~~~~oo~...H',
      'H...~~~~~~~~~~~~...H',
      'HG................GH',
      'H.CTC.........CTC..H',
      'H.................PH',
      'HHHHHHHHHHHHHHHHHHHH',
    ],
  },
  theme: patioTheme,
};
