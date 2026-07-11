import { describe, expect, it } from 'vitest';

import { PresentationClock } from '../../src/game/art/PresentationClock';

describe('PresentationClock', () => {
  it('starts at zero and advances only by finite positive active deltas', () => {
    const clock = new PresentationClock();
    expect(clock.snapshot()).toBe(0);

    clock.advance(16);
    clock.advance(0);
    clock.advance(-4);
    clock.advance(Number.NaN);
    clock.advance(Infinity);

    expect(clock.snapshot()).toBe(16);
  });

  it('freezes while suspended and resumes without adding wall time', () => {
    const clock = new PresentationClock();
    clock.advance(20);
    clock.suspend();
    clock.advance(5_000);
    expect(clock.snapshot()).toBe(20);

    clock.resume();
    clock.advance(17);
    expect(clock.snapshot()).toBe(37);
  });

  it('resets elapsed time and always exposes a finite snapshot', () => {
    const clock = new PresentationClock();
    clock.advance(Number.MAX_VALUE);
    clock.advance(Number.MAX_VALUE);
    expect(Number.isFinite(clock.snapshot())).toBe(true);

    clock.reset();
    expect(clock.snapshot()).toBe(0);
  });
});
