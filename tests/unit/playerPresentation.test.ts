import { describe, expect, it } from 'vitest';

import { PlayerPresentationState } from '../../src/game/player/PlayerPresentationState';

const options = {
  velocityX: 0,
  velocityY: 0,
  dead: false,
  quality: 'high' as const,
  reducedMotion: false,
  reducedFlash: false,
};

describe('PlayerPresentationState', () => {
  it('uses bounded recoil and hit windows with hit precedence', () => {
    const state = new PlayerPresentationState();
    state.triggerRecoil(100);
    expect(state.update(100, options).frame).toBe('attack');
    expect(state.snapshot(100)).toMatchObject({ recoil: true, hit: false });

    state.triggerHit(120);
    expect(state.update(120, options).frame).toBe('hit');
    expect(state.snapshot(120)).toMatchObject({ recoil: true, hit: true });
    expect(state.snapshot(1_000)).toMatchObject({ recoil: false, hit: false });
  });

  it('ignores invalid signal times and resets all transient presentation state', () => {
    const state = new PlayerPresentationState();
    state.triggerRecoil(100);
    state.triggerHit(100);
    state.update(125, { ...options, velocityX: 1 });

    state.reset();
    expect(state.snapshot(125)).toEqual({
      frame: 'idleA',
      animating: false,
      recoil: false,
      hit: false,
    });
    state.triggerRecoil(Number.NaN);
    state.triggerHit(Infinity);
    expect(state.snapshot(125)).toMatchObject({ recoil: false, hit: false });
  });

  it('reports movement animation independently of transient signals', () => {
    const state = new PlayerPresentationState();
    expect(state.update(360, { ...options, velocityY: -20 }).frame).toBe('moveB');
    expect(state.snapshot(360)).toMatchObject({ animating: true, recoil: false, hit: false });
    state.update(361, options);
    expect(state.snapshot(361)).toMatchObject({ animating: false });
  });
});
