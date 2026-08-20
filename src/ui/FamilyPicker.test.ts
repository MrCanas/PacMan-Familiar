import { describe, expect, it, vi } from 'vitest';

import { FAMILIES } from '@/data/families';
import { FamilyPicker, isFamilyNextEnabled } from '@/ui/FamilyPicker';

describe('FamilyPicker', () => {
  it('el botón Siguiente exige haber elegido familia', () => {
    expect(isFamilyNextEnabled(null)).toBe(false);
    expect(isFamilyNextEnabled('valverde')).toBe(true);
  });

  it('tocar una tarjeta selecciona esa familia y no confirma todavía', () => {
    const onConfirm = vi.fn();
    const picker = new FamilyPicker(FAMILIES, () => undefined, onConfirm);
    // Centro de la primera tarjeta.
    picker.handleClick(320, 132 + 66);
    expect(picker.getSelectedId()).toBe(FAMILIES[0]!.id);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('la segunda tarjeta selecciona la segunda familia', () => {
    const picker = new FamilyPicker(FAMILIES, () => undefined, vi.fn());
    picker.handleClick(320, 132 + 132 + 20 + 66);
    expect(picker.getSelectedId()).toBe(FAMILIES[1]!.id);
  });

  it('Siguiente confirma la familia elegida', () => {
    const onConfirm = vi.fn();
    const picker = new FamilyPicker(FAMILIES, () => undefined, onConfirm);
    picker.restoreSelection('clasica');
    picker.handleClick(320, 560 - 28 - 36);
    expect(onConfirm).toHaveBeenCalledWith('clasica');
  });

  it('Siguiente sin selección no hace nada', () => {
    const onConfirm = vi.fn();
    const picker = new FamilyPicker(FAMILIES, () => undefined, onConfirm);
    picker.handleClick(320, 560 - 28 - 36);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
