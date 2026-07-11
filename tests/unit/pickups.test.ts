import { describe, expect, it } from 'vitest';

import { WORLD_HEIGHT, WORLD_WIDTH } from '../../src/game/constants';
import {
  applyPickupCredits,
  MAX_ACTIVE_PICKUPS,
  PICKUP_FADE_MS,
  PICKUP_KINDS,
  PICKUP_LIFETIME_MS,
  PICKUP_RADIUS,
  PickupSystem,
  type PickupCollectionResult,
  type PickupKind,
} from '../../src/game/pickups/PickupSystem';

const expectCollection = (result: PickupCollectionResult) => {
  expect(result.collected).toBe(true);
  if (!result.collected) throw new Error(`Expected collection, received ${result.reason}`);
  return result;
};

const dropSequence = (seed: number): ReadonlyArray<readonly [number, PickupKind, number]> => {
  const system = new PickupSystem(seed);
  const sequence: Array<readonly [number, PickupKind, number]> = [];
  for (let roll = 0; roll < 120; roll += 1) {
    const result = system.rollEnemyDrop('brute', 300, 400);
    if (result.dropped) {
      sequence.push([roll, result.pickup.kind, result.pickup.value]);
      system.remove(result.pickup.id);
    }
  }
  return sequence;
};

describe('PickupSystem deterministic drops', () => {
  it('replays the same drop sequence for the same seed and differs for another seed', () => {
    expect(dropSequence(0x1234abcd)).toEqual(dropSequence(0x1234abcd));
    expect(dropSequence(0x1234abcd)).not.toEqual(dropSequence(0x1234abce));
  });

  it('uses enemy drop chances and returns explicit safe no-drop results', () => {
    const system = new PickupSystem(73);
    expect(system.rollEnemyDrop('queen', 50, 50)).toEqual({
      dropped: false,
      reason: 'chance',
    });

    const results = Array.from({ length: 100 }, () =>
      system.rollEnemyDrop('brute', 50, 50),
    );
    const drops = results.filter((result) => result.dropped);
    expect(drops.length).toBeGreaterThan(0);
    expect(drops.length).toBeLessThan(results.length);
    expect(drops.every(({ pickup }) => PICKUP_KINDS.includes(pickup.kind))).toBe(true);
    expect(drops.every(({ pickup }) => Number.isFinite(pickup.value) && pickup.value >= 0)).toBe(
      true,
    );

    expect(system.rollEnemyDrop('missing' as 'brute', 50, 50)).toEqual({
      dropped: false,
      reason: 'invalid-enemy',
    });
    for (const [x, y] of [
      [Number.NaN, 0],
      [0, Number.POSITIVE_INFINITY],
    ]) {
      expect(system.rollEnemyDrop('brute', x, y)).toEqual({
        dropped: false,
        reason: 'invalid-position',
      });
    }
  });

  it('reset restores its random sequence and stable numeric IDs', () => {
    const system = new PickupSystem(991);
    const firstRun = dropSequenceFrom(system);

    system.reset();
    const replay = dropSequenceFrom(system);
    expect(replay).toEqual(firstRun);
    expect(replay[0]?.id).toBe(1);

    system.reset(992);
    expect(dropSequenceFrom(system)).not.toEqual(firstRun);
  });
});

const dropSequenceFrom = (system: PickupSystem) => {
  const drops = [];
  for (let roll = 0; roll < 80; roll += 1) {
    const result = system.rollEnemyDrop('carrier', 200, 200);
    if (result.dropped) drops.push(result.pickup);
  }
  return drops;
};

describe('PickupSystem spawning and state boundary', () => {
  it('spawns every coherent kind, clamps positions, and never exceeds its exported cap', () => {
    expect(MAX_ACTIVE_PICKUPS).toBeLessThanOrEqual(60);
    const system = new PickupSystem(1);

    PICKUP_KINDS.forEach((kind, index) => {
      const result = system.spawn(kind, index + 1, index % 2 === 0 ? -100 : WORLD_WIDTH + 100, -1);
      expect(result.spawned).toBe(true);
    });
    const firstFive = system.snapshot;
    expect(firstFive.map(({ kind }) => kind)).toEqual(PICKUP_KINDS);
    expect(firstFive.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
    for (const pickup of firstFive) {
      expect(pickup.x).toBeGreaterThanOrEqual(PICKUP_RADIUS);
      expect(pickup.x).toBeLessThanOrEqual(WORLD_WIDTH - PICKUP_RADIUS);
      expect(pickup.y).toBeGreaterThanOrEqual(PICKUP_RADIUS);
      expect(pickup.y).toBeLessThanOrEqual(WORLD_HEIGHT - PICKUP_RADIUS);
    }

    while (system.snapshot.length < MAX_ACTIVE_PICKUPS) {
      expect(system.spawn('credits', 1, 100, 100).spawned).toBe(true);
    }
    expect(system.spawn('credits', 1, 100, 100)).toEqual({
      spawned: false,
      reason: 'cap',
    });
    expect(system.snapshot).toHaveLength(MAX_ACTIVE_PICKUPS);
  });

  it('returns fresh deeply frozen snapshots that cannot corrupt internal state', () => {
    const system = new PickupSystem(2);
    system.spawn('health', 20, 100, 100);
    const first = system.snapshot;
    const second = system.getSnapshot();

    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first[0])).toBe(true);
    expect(() => {
      (first as unknown as unknown[]).pop();
    }).toThrow(TypeError);
    expect(() => {
      (first[0] as unknown as { x: number }).x = -999;
    }).toThrow(TypeError);
    expect(system.snapshot[0]).toMatchObject({ x: 100, y: 100, value: 20 });
  });

  it('rejects malformed direct spawns, removes idempotently, and reset clears all', () => {
    const system = new PickupSystem(Number.NaN);
    expect(system.spawn('bogus' as PickupKind, 1, 0, 0)).toEqual({
      spawned: false,
      reason: 'invalid',
    });
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(system.spawn('ammo', value, 0, 0)).toEqual({
        spawned: false,
        reason: 'invalid',
      });
    }
    expect(system.spawn('ammo', 4, Number.NaN, 0)).toEqual({
      spawned: false,
      reason: 'invalid',
    });

    const defaultOptionsSpawn = system.spawn('ammo', 4, 100, 100, null as never);
    expect(defaultOptionsSpawn.spawned).toBe(true);
    if (defaultOptionsSpawn.spawned) system.remove(defaultOptionsSpawn.pickup.id);

    const spawned = system.spawn('ammo', 4, 100, 100);
    expect(spawned.spawned).toBe(true);
    if (!spawned.spawned) throw new Error('Expected spawn');
    expect(system.remove(spawned.pickup.id)).toBe(true);
    expect(system.remove(spawned.pickup.id)).toBe(false);
    system.spawn('armor', 10, 100, 100);
    system.reset();
    expect(system.snapshot).toEqual([]);
    expect(system.spawn('armor', 10, 100, 100)).toMatchObject({
      spawned: true,
      pickup: { id: 1 },
    });
  });
});

describe('PickupSystem lifetime and magnet update', () => {
  it('fades only near the bounded lifetime and explicitly reports expiration once', () => {
    const system = new PickupSystem(3);
    const spawned = system.spawn('credits', 10, 100, 100);
    expect(spawned.spawned).toBe(true);
    if (!spawned.spawned) throw new Error('Expected spawn');

    expect(system.update(PICKUP_LIFETIME_MS - PICKUP_FADE_MS, { x: 0, y: 0 })).toEqual({
      expiredIds: [],
      events: [],
    });
    expect(system.snapshot[0].alpha).toBe(1);

    system.update(PICKUP_FADE_MS / 2, { x: 0, y: 0 });
    expect(system.snapshot[0].alpha).toBeCloseTo(0.5, 12);
    expect(system.update(PICKUP_FADE_MS / 2 - 1, { x: 0, y: 0 }).expiredIds).toEqual([]);
    const expired = system.update(1, { x: 0, y: 0 });
    expect(expired).toEqual({
      expiredIds: [spawned.pickup.id],
      events: [{ type: 'expired', pickupId: spawned.pickup.id }],
    });
    expect(Object.isFrozen(expired)).toBe(true);
    expect(Object.isFrozen(expired.expiredIds)).toBe(true);
    expect(Object.isFrozen(expired.events)).toBe(true);
    expect(Object.isFrozen(expired.events[0])).toBe(true);
    expect(system.snapshot).toEqual([]);
    expect(system.update(1, { x: 0, y: 0 }).expiredIds).toEqual([]);
  });

  it('does not magnetize before enablement, then moves normalized without overshoot', () => {
    const system = new PickupSystem(4);
    system.spawn('credits', 10, 100, 100);

    system.update(1_000, { x: 200, y: 100 }, { pickupEfficiency: 2 });
    expect(system.snapshot[0]).toMatchObject({ x: 100, y: 100 });

    system.update(100, { x: 200, y: 100 }, {
      magnetEnabled: true,
      magnetRange: 150,
      magnetSpeed: 200,
    });
    expect(system.snapshot[0]).toMatchObject({ x: 120, y: 100 });

    system.update(1_000, { x: 200, y: 100 }, {
      magnetEnabled: true,
      magnetRange: 150,
      magnetSpeed: 10_000,
    });
    expect(system.snapshot[0]).toMatchObject({ x: 200, y: 100 });
    expect(Number.isFinite(system.snapshot[0].x)).toBe(true);
    expect(Number.isFinite(system.snapshot[0].y)).toBe(true);
  });

  it('magnetizes only within a finite range and ignores malformed updates and options', () => {
    const system = new PickupSystem(5);
    system.spawn('armor', 10, 100, 100);
    const original = system.snapshot[0];

    expect(() => system.update(100, { x: 100, y: 100 }, null as never)).not.toThrow();
    for (const delta of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(
        system.update(delta, { x: 110, y: 100 }, {
          magnetEnabled: true,
          magnetRange: 100,
          magnetSpeed: 100,
        }),
      ).toEqual({ expiredIds: [], events: [] });
    }
    system.update(100, { x: 101, y: 100 }, {
      magnetEnabled: true,
      magnetRange: Number.NaN,
      magnetSpeed: Number.POSITIVE_INFINITY,
    });
    system.update(100, { x: Number.NaN, y: 100 }, {
      magnetEnabled: true,
      magnetRange: 100,
      magnetSpeed: 100,
    });
    system.update(100, { x: 500, y: 100 }, {
      magnetEnabled: true,
      magnetRange: 50,
      magnetSpeed: 100,
    });
    expect(system.snapshot[0]).toMatchObject({ x: original.x, y: original.y, ageMs: original.ageMs + 400 });
  });
});

describe('PickupSystem collection and rewards', () => {
  it('collects once within the pickup radius and returns typed coherent rewards', () => {
    for (const kind of PICKUP_KINDS) {
      const system = new PickupSystem(6);
      const spawned = system.spawn(kind, kind === 'grenade' ? 1 : 10, 200, 200);
      expect(spawned.spawned).toBe(true);
      if (!spawned.spawned) throw new Error('Expected spawn');

      expect(system.collect(spawned.pickup.id, { x: 200 + PICKUP_RADIUS + 0.01, y: 200 })).toEqual({
        collected: false,
        reason: 'out-of-range',
      });
      const collection = expectCollection(
        system.collect(spawned.pickup.id, { x: 200 + PICKUP_RADIUS, y: 200 }),
      );
      expect(collection.pickupId).toBe(spawned.pickup.id);
      expect(collection.reward.kind).toBe(kind);
      expect(collection.reward.amount).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(collection.reward.amount)).toBe(true);
      expect(Object.isFrozen(collection)).toBe(true);
      expect(Object.isFrozen(collection.reward)).toBe(true);
      expect(system.collect(spawned.pickup.id, { x: 200, y: 200 })).toEqual({
        collected: false,
        reason: 'not-found',
      });
    }
  });

  it('applies pickup efficiency observably and accounts for credits exactly', () => {
    const baseSystem = new PickupSystem(7);
    const baseSpawn = baseSystem.spawn('credits', 20, 100, 100);
    if (!baseSpawn.spawned) throw new Error('Expected spawn');
    const base = expectCollection(baseSystem.collect(baseSpawn.pickup.id, { x: 100, y: 100 }));

    const efficientSystem = new PickupSystem(7);
    const efficientSpawn = efficientSystem.spawn('credits', 20, 100, 100);
    if (!efficientSpawn.spawned) throw new Error('Expected spawn');
    const efficient = expectCollection(
      efficientSystem.collect(
        efficientSpawn.pickup.id,
        { x: 100, y: 100 },
        { pickupEfficiency: 1.5 },
      ),
    );

    expect(base.reward).toEqual({ kind: 'credits', amount: 20, credits: 20 });
    expect(efficient.reward).toEqual({ kind: 'credits', amount: 30, credits: 30 });
    expect(efficient.reward.amount).toBeGreaterThan(base.reward.amount);
    expect(applyPickupCredits(40, efficient)).toBe(70);

    const healthSystem = new PickupSystem(8);
    const healthSpawn = healthSystem.spawn('health', 10, 100, 100);
    if (!healthSpawn.spawned) throw new Error('Expected spawn');
    const health = expectCollection(healthSystem.collect(healthSpawn.pickup.id, { x: 100, y: 100 }));
    expect(health.reward).toEqual({ kind: 'health', amount: 10 });
    expect(applyPickupCredits(40, health)).toBe(40);
    expect(applyPickupCredits(Number.NaN, efficient)).toBe(0);
  });

  it('safely rejects malformed collection positions and efficiency multipliers', () => {
    const system = new PickupSystem(9);
    const spawned = system.spawn('ammo', 10, 100, 100);
    if (!spawned.spawned) throw new Error('Expected spawn');

    expect(system.collect(spawned.pickup.id, { x: Number.NaN, y: 100 })).toEqual({
      collected: false,
      reason: 'invalid-player',
    });
    const collected = expectCollection(
      system.collect(
        spawned.pickup.id,
        { x: 100, y: 100 },
        { pickupEfficiency: Number.POSITIVE_INFINITY },
      ),
    );
    expect(collected.reward).toEqual({ kind: 'ammo', amount: 10 });

    const nullOptionsSystem = new PickupSystem(10);
    const nullOptionsSpawn = nullOptionsSystem.spawn('health', 10, 100, 100);
    if (!nullOptionsSpawn.spawned) throw new Error('Expected spawn');
    expect(
      nullOptionsSystem.collect(
        nullOptionsSpawn.pickup.id,
        { x: 100, y: 100 },
        null as never,
      ),
    ).toMatchObject({ collected: true, reward: { kind: 'health', amount: 10 } });
  });
});
