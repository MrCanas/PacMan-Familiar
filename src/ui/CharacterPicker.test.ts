import { describe, expect, it } from 'vitest';

import { type FaceLayout, getCharacterAtPosition, isNextButtonEnabled } from '@/ui/CharacterPicker';

describe('CharacterPicker helpers', () => {
  const layout: FaceLayout[] = [
    { id: 'a', cx: 50, cy: 50, r: 20 },
    { id: 'b', cx: 150, cy: 50, r: 20 },
  ];

  it('getCharacterAtPosition detecta click dentro del c�rculo', () => {
    expect(getCharacterAtPosition(50, 50, layout)).toBe('a');
    expect(getCharacterAtPosition(150, 50, layout)).toBe('b');
  });

  it('getCharacterAtPosition devuelve null fuera', () => {
    expect(getCharacterAtPosition(500, 500, layout)).toBeNull();
    expect(getCharacterAtPosition(50, 71, layout)).toBeNull();
  });

  it('isNextButtonEnabled solo con selecci�n', () => {
    expect(isNextButtonEnabled(null)).toBe(false);
    expect(isNextButtonEnabled('maria')).toBe(true);
  });
});
