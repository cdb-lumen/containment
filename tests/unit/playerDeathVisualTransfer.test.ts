import { describe, expect, it, vi } from 'vitest';

import { transferPlayerDeathVisual } from '../../src/game/player/transferPlayerDeathVisual';

describe('player death visual ownership transfer', () => {
  it('hides player art only after the corpse view accepts ownership', () => {
    const hidePresentation = vi.fn();
    const request = { family: 'marine' as const, x: 10, y: 20, rotation: 1, major: true };

    expect(transferPlayerDeathVisual({ spawnDeath: () => false }, { hidePresentation }, request)).toBe(false);
    expect(hidePresentation).not.toHaveBeenCalled();

    expect(transferPlayerDeathVisual({ spawnDeath: () => true }, { hidePresentation }, request)).toBe(true);
    expect(hidePresentation).toHaveBeenCalledTimes(1);
  });
});