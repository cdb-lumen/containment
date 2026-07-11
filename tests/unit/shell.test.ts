import { describe, expect, it } from 'vitest';

import {
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_ACTIVE_ENEMIES,
} from '../../src/game/constants';

describe('game shell constants', () => {
  it('uses a landscape logical viewport and bounded horde', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(MAX_ACTIVE_ENEMIES).toBe(150);
  });
});
