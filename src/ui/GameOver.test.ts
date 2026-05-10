import { describe, expect, it } from 'vitest';

import {
  getGameOverButtonChoice,
  getGameOverMessage,
  layoutGameOverButtons,
} from '@/ui/GameOver';

describe('GameOver helpers', () => {
  it('getGameOverMessage victoria', () => {
    expect(getGameOverMessage('won', 'Hero')).toContain('Hero');
    expect(getGameOverMessage('won', 'Hero')).toMatch(/gan/i);
  });

  it('getGameOverMessage captura', () => {
    const msg = getGameOverMessage('caught', 'Hero', 'Ghost');
    expect(msg).toContain('Ghost');
    expect(msg).toContain('Hero');
  });

  it('getGameOverButtonChoice detecta botones', () => {
    const buttons = layoutGameOverButtons();
    const ax = buttons.again.x + buttons.again.w / 2;
    const ay = buttons.again.y + buttons.again.h / 2;
    const sx = buttons.same.x + buttons.same.w / 2;
    const sy = buttons.same.y + buttons.same.h / 2;
    expect(getGameOverButtonChoice(ax, ay, buttons)).toBe('play-again');
    expect(getGameOverButtonChoice(sx, sy, buttons)).toBe('same-team');
    expect(getGameOverButtonChoice(2, 2, buttons)).toBeNull();
  });
});
