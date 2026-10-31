import { describe, expect, it } from 'vitest';
import { canOccupyExpedition, canTraverseExpedition, createExpeditionGeometry, hasClearExpeditionShot } from '../../src/game/world/expeditionGeometry';
import { generateRun } from '../../src/game/roguelike/run';
import type { Point, Rect } from '../../src/game/roguelike/types';

const base = createExpeditionGeometry(generateRun(1729, 3).nodes[0]);
const room = (blockers: readonly Rect[] = [{ x: 100, y: 100, width: 100, height: 100 }]) => ({
  ...base, bounds: { x: 0, y: 0, width: 400, height: 400 }, boundary: undefined, voids: undefined, blockers,
});

describe('expedition continuous swept disc', () => {
  it.each([
    ['clear rounded corner', { x: 73, y: 80 }, { x: 80, y: 73 }, 28, true],
    ['actual corner clipping with legal endpoints', { x: 70, y: 99 }, { x: 99, y: 70 }, 28, false],
    ['face tangent', { x: 80, y: 72 }, { x: 220, y: 72 }, 28, true],
    ['corner tangent', { x: 90, y: 70 }, { x: 66, y: 88 }, 30, true],
    ['just outside corner tangent', { x: 89.999, y: 70 }, { x: 65.999, y: 88 }, 30, true],
    ['just inside corner tangent', { x: 90.001, y: 70 }, { x: 66.001, y: 88 }, 30, false],
    ['stationary rounded corner', { x: 80, y: 80 }, { x: 80, y: 80 }, 28, true],
    ['zero-radius clear', { x: 90, y: 95 }, { x: 95, y: 90 }, 0, true],
    ['zero-radius corner contact', { x: 90, y: 110 }, { x: 110, y: 90 }, 0, false],
    ['zero-radius crossing', { x: 50, y: 150 }, { x: 250, y: 150 }, 0, false],
  ] as const)('%s in both directions', (_name, from, to, radius, expected) => {
    const geometry = room();
    expect(canOccupyExpedition(geometry, from, radius)).toBe(true);
    expect(canOccupyExpedition(geometry, to, radius)).toBe(true);
    expect(canTraverseExpedition(geometry, from, to, radius)).toBe(expected);
    expect(canTraverseExpedition(geometry, to, from, radius)).toBe(expected);
  });

  it('rejects tunneling through an arbitrarily thin wall despite legal endpoints', () => {
    const geometry = room([{ x: 150, y: 50, width: 0.001, height: 250 }]);
    const from = { x: 50, y: 150 }, to = { x: 250, y: 150 };
    expect(canOccupyExpedition(geometry, from, 28)).toBe(true);
    expect(canOccupyExpedition(geometry, to, 28)).toBe(true);
    expect(canTraverseExpedition(geometry, from, to, 28)).toBe(false);
  });

  it('matches occupancy for stationary discs, including zero radius and tangent contact', () => {
    for (const point of [{ x: 80, y: 80 }, { x: 100, y: 100 }, { x: 72, y: 150 }, { x: 50, y: 50 }]) {
      for (const radius of [0, 28]) expect(canTraverseExpedition(room(), point, { ...point }, radius))
        .toBe(canOccupyExpedition(room(), point, radius));
    }
  });

  it('preserves bounds and invalid-input rejection', () => {
    const from = { x: 50, y: 50 };
    for (const [to, radius] of [[{ x: 401, y: 50 }, 0], [{ x: 20, y: 50 }, 28], [{ x: NaN, y: 50 }, 0], [from, -1], [from, Infinity]] as const) {
      expect(canTraverseExpedition(room([]), from, to, radius)).toBe(false);
    }
    expect(canTraverseExpedition(room([]), { x: 28, y: 28 }, { x: 372, y: 28 }, 28)).toBe(true);
  });

  it('still rejects continuous crossings of concave boundaries and thin polygon voids', () => {
    const boundary: Point[] = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }, { x: 220, y: 400 }, { x: 220, y: 100 }, { x: 180, y: 100 }, { x: 180, y: 400 }, { x: 0, y: 400 }];
    const voids = [[{ x: 199, y: 100 }, { x: 199.001, y: 100 }, { x: 199.001, y: 300 }, { x: 199, y: 300 }]];
    for (const geometry of [{ ...room([]), boundary }, { ...room([]), voids }]) {
      const from = { x: 100, y: 200 }, to = { x: 300, y: 200 };
      expect(canOccupyExpedition(geometry, from, 28)).toBe(true);
      expect(canOccupyExpedition(geometry, to, 28)).toBe(true);
      expect(canTraverseExpedition(geometry, from, to, 28)).toBe(false);
    }
  });

  it('keeps point-shot contact blocking while finite discs may be tangent', () => {
    expect(hasClearExpeditionShot(room(), { x: 50, y: 100 }, { x: 250, y: 100 })).toBe(false);
    expect(hasClearExpeditionShot(room(), { x: 50, y: 99 }, { x: 250, y: 99 })).toBe(true);
  });
});
