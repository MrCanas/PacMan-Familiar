import { describe, expect, it } from 'vitest';

import { CHARACTERS } from '@/data/characters';
import {
  getGhostCandidates,
  isCharacterActiveAsGhost,
  isStartButtonEnabled,
} from '@/ui/GhostCountPicker';

describe('GhostCountPicker helpers', () => {
  it('getGhostCandidates excluye protagonista con orden estable', () => {
    const ids = getGhostCandidates('maria', CHARACTERS).map((c) => c.id);
    expect(ids).toEqual(['jose', 'mama', 'prima-ana', 'primo-javier']);
  });

  it('isCharacterActiveAsGhost', () => {
    expect(isCharacterActiveAsGhost(0, 2)).toBe(true);
    expect(isCharacterActiveAsGhost(1, 2)).toBe(true);
    expect(isCharacterActiveAsGhost(2, 2)).toBe(false);
  });

  it('isStartButtonEnabled', () => {
    expect(isStartButtonEnabled(null)).toBe(false);
    expect(isStartButtonEnabled(0)).toBe(false);
    expect(isStartButtonEnabled(1)).toBe(true);
    expect(isStartButtonEnabled(4)).toBe(true);
    expect(isStartButtonEnabled(5)).toBe(false);
  });
});
