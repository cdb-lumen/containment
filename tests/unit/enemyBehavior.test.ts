import { describe, expect, it } from 'vitest';

import {
  MAX_ACTIVE_ENEMIES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../../src/game/constants';
import { ENEMIES } from '../../src/game/enemies/catalog';
import {
  EnemySystem,
  type EnemyEvent,
  type EnemySnapshot,
} from '../../src/game/enemies/EnemySystem';

const requireSpawn = (
  system: EnemySystem,
  ...args: Parameters<EnemySystem['spawn']>
): EnemySnapshot => {
  const result = system.spawn(...args);
  expect(result.spawned).toBe(true);
  if (!result.spawned) throw new Error(`spawn refused: ${result.reason}`);
  return result.enemy;
};

const position = (system: EnemySystem, id: number): { x: number; y: number } => {
  const enemy = system.getSnapshot(id);
  if (!enemy) throw new Error(`enemy ${id} is missing`);
  return { x: enemy.x, y: enemy.y };
};

const eventsOf = <T extends EnemyEvent['type']>(
  events: readonly EnemyEvent[],
  type: T,
): Array<Extract<EnemyEvent, { type: T }>> =>
  events.filter(
    (event): event is Extract<EnemyEvent, { type: T }> => event.type === type,
  );

describe('EnemySystem movement decisions', () => {
  it('moves a crawler toward the player with normalized pursuit', () => {
    const system = new EnemySystem();
    const crawler = requireSpawn(system, 'crawler', 100, 100);

    system.update(100, { x: 400, y: 500 });
    const moved = system.getSnapshot(crawler.id)!;

    expect(moved.x).toBeGreaterThan(100);
    expect(moved.y).toBeGreaterThan(100);
    expect(Math.hypot(moved.velocityX, moved.velocityY)).toBeCloseTo(
      ENEMIES.crawler.speed,
      5,
    );
  });

  it('integrates cached movement while far-away decisions are throttled', () => {
    const system = new EnemySystem();
    const crawler = requireSpawn(system, 'crawler', 0, 0);

    system.update(20, { x: WORLD_WIDTH, y: WORLD_HEIGHT });
    const first = system.getSnapshot(crawler.id)!;
    expect(first.decisionIntervalMs).toBeGreaterThan(20);

    system.update(20, { x: WORLD_WIDTH, y: WORLD_HEIGHT });
    const second = system.getSnapshot(crawler.id)!;
    expect(second.decisionVersion).toBe(first.decisionVersion);
    expect(second.x).toBeGreaterThan(first.x);
    expect(second.y).toBeGreaterThan(first.y);
  });

  it('deterministically separates overlapping enemies', () => {
    const system = new EnemySystem();
    const first = requireSpawn(system, 'crawler', 500, 500);
    const second = requireSpawn(system, 'crawler', 500, 500);

    system.update(100, { x: 900, y: 500 });
    const firstPosition = position(system, first.id);
    const secondPosition = position(system, second.id);

    expect(firstPosition).not.toEqual(secondPosition);
    expect(Math.abs(firstPosition.y - secondPosition.y)).toBeGreaterThan(0);
  });

  it('tries deterministic steering alternatives when collision context rejects a move', () => {
    const attempts: Array<{ fromX: number; fromY: number; toX: number; toY: number }> = [];
    const system = new EnemySystem({
      canMove: (context) => {
        attempts.push(context);
        return context.toY > context.fromY;
      },
    });
    const crawler = requireSpawn(system, 'crawler', 200, 200);

    expect(() => system.update(100, { x: 600, y: 200 })).not.toThrow();
    const moved = system.getSnapshot(crawler.id)!;

    expect(attempts.length).toBeGreaterThan(1);
    expect(attempts[0]).toMatchObject({ fromX: 200, fromY: 200 });
    expect(moved.y).toBeGreaterThan(200);
  });

  it('keeps every enemy active until explicit damage or removal', () => {
    const system = new EnemySystem();
    const crawler = requireSpawn(system, 'crawler', WORLD_WIDTH, WORLD_HEIGHT);

    system.update(Number.MAX_VALUE, { x: 0, y: 0 });
    expect(system.getSnapshot(crawler.id)).not.toBeNull();
    expect(system.activeCount).toBe(1);
    expect(system.remove(crawler.id)).toBe(true);
    expect(system.remove(crawler.id)).toBe(false);
    expect(system.activeCount).toBe(0);
  });
});

describe('EnemySystem archetypes', () => {
  it('gives brutes armor-first damage, slower pursuit, and strong knockback resistance', () => {
    const system = new EnemySystem();
    const brute = requireSpawn(system, 'brute', 100, 200);
    const crawler = requireSpawn(system, 'crawler', 100, 400);

    system.update(100, { x: 1_000, y: 200 });
    expect(position(system, brute.id).x - 100).toBeLessThan(
      position(system, crawler.id).x - 100,
    );

    const armored = system.applyDamage(brute.id, 40);
    expect(armored).toMatchObject({
      applied: true,
      absorbedByArmor: 40,
      healthDamage: 0,
      died: false,
    });
    expect(system.getSnapshot(brute.id)).toMatchObject({
      health: brute.maxHealth,
      armor: brute.armor - 40,
    });

    const bruteKnockback = system.applyDamage(brute.id, 1, { x: 100, y: 0 });
    const crawlerKnockback = system.applyDamage(crawler.id, 1, { x: 100, y: 0 });
    expect(bruteKnockback.appliedKnockback.x).toBeGreaterThanOrEqual(0);
    expect(bruteKnockback.appliedKnockback.x).toBeLessThan(
      crawlerKnockback.appliedKnockback.x,
    );
  });

  it('has a spitter approach, retreat, and hold its preferred range band', () => {
    const approach = new EnemySystem();
    const far = requireSpawn(approach, 'spitter', 100, 300);
    approach.update(100, { x: 800, y: 300 });
    expect(position(approach, far.id).x).toBeGreaterThan(100);

    const retreat = new EnemySystem();
    const close = requireSpawn(retreat, 'spitter', 300, 300);
    retreat.update(100, { x: 340, y: 300 });
    expect(position(retreat, close.id).x).toBeLessThan(300);

    const hold = new EnemySystem();
    const inBand = requireSpawn(hold, 'spitter', 300, 300);
    hold.update(100, { x: 600, y: 300 });
    expect(position(hold, inBand.id).x).toBeCloseTo(300, 8);
  });

  it('emits spitter hazards only in range and after cooldown', () => {
    const system = new EnemySystem();
    const spitter = requireSpawn(system, 'spitter', 300, 300);

    expect(eventsOf(system.update(0, { x: 600, y: 300 }), 'hazard-attack')).toEqual([
      expect.objectContaining({
        type: 'hazard-attack',
        enemyId: spitter.id,
        damage: ENEMIES.spitter.contactDamage,
        targetX: 600,
        targetY: 300,
      }),
    ]);
    expect(eventsOf(system.update(0, { x: 600, y: 300 }), 'hazard-attack')).toEqual([]);
    expect(
      eventsOf(
        system.update(ENEMIES.spitter.attackCooldownMs - 1, { x: 600, y: 300 }),
        'hazard-attack',
      ),
    ).toEqual([]);
    expect(eventsOf(system.update(1, { x: 600, y: 300 }), 'hazard-attack')).toHaveLength(1);

    const outOfRange = new EnemySystem();
    requireSpawn(outOfRange, 'spitter', 0, 0);
    expect(
      eventsOf(outOfRange.update(0, { x: WORLD_WIDTH, y: WORLD_HEIGHT }), 'hazard-attack'),
    ).toEqual([]);
  });

  it('targets a deterministic flank and cycles stalker camouflage and reveal', () => {
    const system = new EnemySystem();
    const stalker = requireSpawn(system, 'stalker', 300, 300);

    system.update(0, { x: 700, y: 300 });
    const initial = system.getSnapshot(stalker.id)!;
    expect(initial.targetX === 700 && initial.targetY === 300).toBe(false);
    expect(initial.camouflageState).toBe('camouflaged');
    expect(initial.alpha).toBeLessThan(1);

    system.update(2_000, { x: 700, y: 300 });
    expect(system.getSnapshot(stalker.id)).toMatchObject({
      camouflageState: 'revealed',
      alpha: 1,
    });
    system.update(1_000, { x: 700, y: 300 });
    expect(system.getSnapshot(stalker.id)).toMatchObject({
      camouflageState: 'camouflaged',
    });
  });
});

describe('EnemySystem combat, reservations, and boundaries', () => {
  it('reserves bounded carrier children and emits them exactly once on death', () => {
    const system = new EnemySystem();
    const carrier = requireSpawn(system, 'carrier', 400, 400);
    expect(carrier.reservedChildren).toBe(3);
    expect(system.reservedCount).toBe(3);
    expect(system.activeCount + system.reservedCount).toBeLessThanOrEqual(
      MAX_ACTIVE_ENEMIES,
    );

    const lethal = system.applyDamage(carrier.id, Number.MAX_VALUE);
    const children = eventsOf(lethal.events, 'spawn-request');
    expect(children).toHaveLength(3);
    expect(children.every(({ enemyType }) => enemyType === 'crawler')).toBe(true);
    expect(new Set(children.map(({ requestIndex }) => requestIndex)).size).toBe(3);
    expect(eventsOf(lethal.events, 'death')).toHaveLength(1);
    expect(system.reservedCount).toBe(0);
    expect(system.activeCount).toBe(0);

    expect(system.applyDamage(carrier.id, 1).events).toEqual([]);
  });

  it('counts carrier reservations against the global cap without overrunning it', () => {
    const system = new EnemySystem();
    for (let index = 0; index < MAX_ACTIVE_ENEMIES - 4; index += 1) {
      expect(system.spawn('crawler', index, index).spawned).toBe(true);
    }
    const carrier = requireSpawn(system, 'carrier', 100, 100);
    expect(carrier.reservedChildren).toBe(3);
    expect(system.activeCount + system.reservedCount).toBe(MAX_ACTIVE_ENEMIES);
    expect(system.spawn('crawler', 0, 0)).toEqual({
      spawned: false,
      reason: 'capacity',
    });
  });

  it('enforces finite-range contact attacks and per-enemy cooldowns', () => {
    const system = new EnemySystem();
    const crawler = requireSpawn(system, 'crawler', 100, 100);

    const first = eventsOf(system.update(0, { x: 120, y: 100, radius: 10 }), 'contact-attack');
    expect(first).toEqual([
      expect.objectContaining({
        type: 'contact-attack',
        enemyId: crawler.id,
        damage: ENEMIES.crawler.contactDamage,
      }),
    ]);
    expect(eventsOf(system.update(0, { x: 120, y: 100 }), 'contact-attack')).toEqual([]);
    system.update(ENEMIES.crawler.attackCooldownMs, { x: 1_000, y: 1_000 });
    expect(eventsOf(system.update(0, { x: 120, y: 100 }), 'contact-attack')).toHaveLength(
      1,
    );
    expect(eventsOf(system.update(0, { x: Number.POSITIVE_INFINITY, y: 100 }), 'contact-attack')).toEqual([]);
  });

  it('applies coherent elite modifiers and emits frozen death metadata once', () => {
    const system = new EnemySystem();
    const normal = requireSpawn(system, 'crawler', 100, 100);
    const elite = requireSpawn(system, 'crawler', 200, 200, true);
    const healthMultiplier = elite.maxHealth / normal.maxHealth;

    expect(elite.elite).toBe(true);
    expect(healthMultiplier).toBeGreaterThan(1);
    expect(elite.contactDamage / normal.contactDamage).toBeCloseTo(healthMultiplier, 10);
    expect(elite.creditReward / normal.creditReward).toBeCloseTo(healthMultiplier, 10);

    const result = system.applyDamage(elite.id, elite.maxHealth);
    const death = eventsOf(result.events, 'death')[0];
    expect(death).toMatchObject({
      enemyId: elite.id,
      enemyType: 'crawler',
      elite: true,
      reward: elite.creditReward,
      dropChance: ENEMIES.crawler.dropChance,
    });
    expect(Object.isFrozen(death)).toBe(true);
    expect(system.applyDamage(elite.id, 10).events).toEqual([]);
  });

  it('validates spawns, clamps bounds, and keeps unique stable numeric ids', () => {
    const system = new EnemySystem();
    expect(system.spawn('crawler', Number.NaN, 0)).toEqual({
      spawned: false,
      reason: 'invalid-position',
    });
    expect(system.spawn('crawler', 0, Number.POSITIVE_INFINITY)).toEqual({
      spawned: false,
      reason: 'invalid-position',
    });
    expect(system.spawn('queen' as never, 0, 0)).toEqual({
      spawned: false,
      reason: 'invalid-type',
    });

    const low = requireSpawn(system, 'crawler', -100, -100);
    const high = requireSpawn(system, 'crawler', WORLD_WIDTH + 100, WORLD_HEIGHT + 100);
    expect(low).toMatchObject({ x: 0, y: 0 });
    expect(high).toMatchObject({ x: WORLD_WIDTH, y: WORLD_HEIGHT });
    expect(Number.isSafeInteger(low.id)).toBe(true);
    expect(high.id).toBeGreaterThan(low.id);
  });

  it('ignores malformed damage, knockback, player state, and clamps huge updates', () => {
    const system = new EnemySystem();
    const crawler = requireSpawn(system, 'crawler', 100, 100);
    const before = system.getSnapshot(crawler.id)!;

    for (const damage of [Number.NaN, Number.POSITIVE_INFINITY, -1, 0]) {
      expect(system.applyDamage(crawler.id, damage)).toMatchObject({
        applied: false,
        absorbedByArmor: 0,
        healthDamage: 0,
        died: false,
        appliedKnockback: { x: 0, y: 0 },
        events: [],
      });
    }
    expect(() =>
      system.applyDamage(crawler.id, 1, { x: Number.POSITIVE_INFINITY, y: 10 }),
    ).not.toThrow();
    expect(system.getSnapshot(crawler.id)!.x).toBe(before.x);

    system.update(Number.NaN, { x: 500, y: 500 });
    system.update(-1, { x: 500, y: 500 });
    system.update(100, { x: Number.NaN, y: 500 });
    expect(system.getSnapshot(crawler.id)!.x).toBe(before.x);

    system.update(Number.MAX_VALUE, { x: WORLD_WIDTH, y: WORLD_HEIGHT });
    const moved = system.getSnapshot(crawler.id)!;
    expect(moved.x).toBeGreaterThan(before.x);
    expect(moved.x - before.x).toBeLessThanOrEqual(ENEMIES.crawler.speed);
    expect(moved.x).toBeLessThanOrEqual(WORLD_WIDTH);
    expect(moved.y).toBeLessThanOrEqual(WORLD_HEIGHT);
  });
});

describe('EnemySystem state boundary', () => {
  it('returns deeply frozen fresh snapshots that cannot corrupt simulation state', () => {
    const system = new EnemySystem();
    const crawler = requireSpawn(system, 'crawler', 100, 100);
    const first = system.snapshot;
    const second = system.snapshot;

    expect(first).not.toBe(second);
    expect(first.enemies).not.toBe(second.enemies);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.enemies)).toBe(true);
    expect(Object.isFrozen(first.enemies[0])).toBe(true);
    expect(() => {
      (first.enemies[0] as unknown as { health: number }).health = -1;
    }).toThrow(TypeError);
    expect(() => {
      (first.enemies as unknown as EnemySnapshot[]).pop();
    }).toThrow(TypeError);
    expect(system.getSnapshot(crawler.id)).toMatchObject({ health: ENEMIES.crawler.maxHealth });
  });

  it('isolates listener failures, supports unsubscribe, and resets ids and all state', () => {
    const system = new EnemySystem();
    const observed: EnemyEvent[] = [];
    system.subscribe(() => {
      throw new Error('broken scene adapter');
    });
    const unsubscribe = system.subscribe((event) => observed.push(event));
    const first = requireSpawn(system, 'carrier', 100, 100);
    system.update(0, { x: 100, y: 100 });
    expect(observed.some(({ type }) => type === 'contact-attack')).toBe(true);

    unsubscribe();
    unsubscribe();
    const observedCount = observed.length;
    system.applyDamage(first.id, Number.MAX_VALUE);
    expect(observed).toHaveLength(observedCount);

    system.reset();
    expect(system.snapshot).toEqual({ activeCount: 0, reservedCount: 0, enemies: [] });
    const afterReset = requireSpawn(system, 'crawler', 0, 0);
    expect(afterReset.id).toBe(1);
    expect(afterReset.contactCooldownRemainingMs).toBe(0);
    expect(afterReset.decisionVersion).toBe(0);
  });
});
