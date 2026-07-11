import { describe, expect, it } from 'vitest';

import { MAX_ACTIVE_ENEMIES } from '../../src/game/constants';
import { ENEMIES } from '../../src/game/enemies/catalog';
import {
  AREA_ATTACK_COOLDOWN_MS,
  AREA_ATTACK_DELAY_MS,
  MAX_QUEEN_UPDATE_DELTA_MS,
  NEST_MAX_HEALTH,
  NEST_SPAWN_COOLDOWN_MS,
  QUEEN_ARMORED_DURATION_MS,
  QUEEN_NEST_SPAWN_DURATION_MS,
  QUEEN_VULNERABLE_DURATION_MS,
  QueenBossSystem,
  type QueenBossEvent,
} from '../../src/game/enemies/QueenBossSystem';
import {
  QueenPresentationState,
  QUEEN_ATTACK_ANTICIPATION_MS,
  QUEEN_ATTACK_RECOVERY_MS,
  QUEEN_HIT_PRESENTATION_MS,
} from '../../src/game/enemies/QueenPresentationState';

const FAR_PLAYER = Object.freeze({ x: 10_000, y: 10_000 });

const eventsOf = <T extends QueenBossEvent['type']>(
  events: readonly QueenBossEvent[],
  type: T,
): Array<Extract<QueenBossEvent, { type: T }>> =>
  events.filter(
    (event): event is Extract<QueenBossEvent, { type: T }> => event.type === type,
  );

const enterNestSpawn = (system: QueenBossSystem): void => {
  system.update(QUEEN_ARMORED_DURATION_MS, FAR_PLAYER, 0);
  expect(system.snapshot.phase).toBe('nest-spawn');
};

const enterVulnerable = (system: QueenBossSystem): void => {
  enterNestSpawn(system);
  system.update(QUEEN_NEST_SPAWN_DURATION_MS, FAR_PLAYER, 0);
  expect(system.snapshot.phase).toBe('vulnerable');
};

const finishVulnerableCycle = (system: QueenBossSystem): void => {
  system.update(QUEEN_VULNERABLE_DURATION_MS, FAR_PLAYER, 0);
  expect(system.snapshot.phase).toBe('armored');
};

describe('queen presentation state', () => {
  const snapshot = (overrides: Record<string, unknown> = {}) => ({
    active: true, defeated: false, phase: 'armored' as const, stage: 1 as const,
    x: 500, y: 400, rotation: 0, health: ENEMIES.queen.maxHealth,
    maxHealth: ENEMIES.queen.maxHealth, vulnerable: false,
    phaseRemainingMs: QUEEN_ARMORED_DURATION_MS, nests: [], pendingTelegraph: null,
    ...overrides,
  });

  it('reuses phase-aware output while low quality preserves breathing and suppresses emissive', () => {
    const state = new QueenPresentationState();
    state.acquire(snapshot());
    const stageOne = state.update(snapshot(), 500, 'high', false, false);
    const sameOutput = state.update(snapshot({ stage: 3 }), 500, 'high', false, false);
    expect(sameOutput).toBe(stageOne);
    expect(sameOutput.frame).toMatch(/^idle[AB]$/);
    expect(sameOutput.emissiveAlpha).toBeGreaterThan(0);
    const low = state.update(snapshot({ stage: 3 }), 500, 'low', false, false);
    expect(low.offsetY).not.toBe(0);
    expect(low.scaleX).not.toBe(1);
    expect(low.emissiveAlpha).toBe(0);
  });

  it('routes only real telegraph and attack events into anticipation and recovery', () => {
    const state = new QueenPresentationState();
    state.acquire(snapshot());
    state.handleEvent({ type: 'minion-spawn-request', eventId: 1, requestId: 1,
      nestId: 1, enemyType: 'crawler', x: 0, y: 0 }, 100);
    expect(state.update(snapshot(), 100, 'high', false, false).frame).not.toBe('attack');
    state.handleEvent({ type: 'area-telegraph', eventId: 2, telegraphId: 1,
      x: 1, y: 2, radius: 3, delayMs: QUEEN_ATTACK_ANTICIPATION_MS, damage: 4 }, 100);
    expect(state.update(snapshot(), 100, 'high', false, false).frame).toBe('attack');
    expect(state.update(snapshot(), 100 + QUEEN_ATTACK_ANTICIPATION_MS, 'high', false, false).frame)
      .not.toBe('attack');
    state.handleEvent({ type: 'area-attack', eventId: 3, telegraphId: 1,
      x: 1, y: 2, radius: 3, damage: 4 }, 1_000);
    expect(state.update(snapshot(), 1_000 + QUEEN_ATTACK_RECOVERY_MS - 1, 'high', false, false).frame)
      .toBe('attack');
  });

  it('shows hit only after applied decrease and obeys reduced motion and flash', () => {
    const state = new QueenPresentationState();
    state.acquire(snapshot());
    state.triggerHit(100, false);
    expect(state.update(snapshot(), 100, 'high', false, false).frame).not.toBe('hit');
    state.triggerHit(100, true);
    expect(state.update(snapshot({ health: ENEMIES.queen.maxHealth - 1 }), 100,
      'high', true, true)).toMatchObject({
      frame: 'hit', hitBrightness: 0, offsetX: 0, offsetY: 0,
      scaleX: 1, scaleY: 1, rotationOffset: 0,
    });
    expect(state.update(snapshot(), 100 + QUEEN_HIT_PRESENTATION_MS, 'high', false, false).frame)
      .not.toBe('hit');
  });

  it('selects death then resets every transient window for restart', () => {
    const state = new QueenPresentationState();
    state.acquire(snapshot());
    state.triggerHit(10, true);
    state.handleEvent({ type: 'area-telegraph', eventId: 1, telegraphId: 1,
      x: 1, y: 2, radius: 3, delayMs: 900, damage: 4 }, 10);
    expect(state.update(snapshot({ active: false, defeated: true, phase: 'defeated' }), 10,
      'high', false, false).frame).toBe('death');
    state.release();
    state.acquire(snapshot());
    expect(state.update(snapshot(), 10, 'high', false, false)).toMatchObject({
      frame: 'idleA', hitBrightness: 0,
    });
  });
});

describe('QueenBossSystem phases and damage gates', () => {
  it('starts idempotently and follows the deterministic timed phase sequence', () => {
    const system = new QueenBossSystem();
    expect(system.snapshot).toMatchObject({
      active: false,
      defeated: false,
      phase: 'idle',
      stage: 1,
      vulnerable: false,
      health: ENEMIES.queen.maxHealth,
      maxHealth: ENEMIES.queen.maxHealth,
      phaseRemainingMs: 0,
      nests: [],
      pendingTelegraph: null,
    });

    expect(system.start(Number.NaN, 100)).toBe(false);
    expect(system.start(500, 400)).toBe(true);
    expect(system.start(900, 800)).toBe(false);
    expect(system.snapshot).toMatchObject({
      active: true,
      phase: 'armored',
      x: 500,
      y: 400,
      phaseRemainingMs: QUEEN_ARMORED_DURATION_MS,
    });

    system.update(0, { x: 500, y: 500 }, 0);
    expect(system.snapshot.rotation).toBeCloseTo(Math.PI / 2, 12);
    system.update(QUEEN_ARMORED_DURATION_MS - 1, FAR_PLAYER, 0);
    expect(system.snapshot).toMatchObject({ phase: 'armored', phaseRemainingMs: 1 });
    system.update(1, FAR_PLAYER, 0);
    expect(system.snapshot).toMatchObject({
      phase: 'nest-spawn',
      phaseRemainingMs: QUEEN_NEST_SPAWN_DURATION_MS,
    });
    expect(system.snapshot.nests).toHaveLength(2);

    system.update(QUEEN_NEST_SPAWN_DURATION_MS, FAR_PLAYER, MAX_ACTIVE_ENEMIES);
    expect(system.snapshot).toMatchObject({
      phase: 'vulnerable',
      vulnerable: true,
      phaseRemainingMs: QUEEN_VULNERABLE_DURATION_MS,
    });
    system.update(QUEEN_VULNERABLE_DURATION_MS, FAR_PLAYER, MAX_ACTIVE_ENEMIES);
    expect(system.snapshot).toMatchObject({
      phase: 'armored',
      vulnerable: false,
      phaseRemainingMs: QUEEN_ARMORED_DURATION_MS,
    });
  });

  it('blocks core damage outside vulnerability and derives stages at exact health thresholds', () => {
    const system = new QueenBossSystem();
    system.start(500, 400);

    const blocked = system.applyDamage({ type: 'queen' }, 400);
    expect(blocked).toEqual({
      applied: false,
      blockedByArmor: true,
      damage: 0,
      destroyed: false,
      defeated: false,
      events: [],
    });
    expect(system.snapshot.health).toBe(ENEMIES.queen.maxHealth);

    enterVulnerable(system);
    const twoThirds = ENEMIES.queen.maxHealth * (2 / 3);
    expect(
      system.applyDamage(
        { type: 'queen' },
        ENEMIES.queen.maxHealth - twoThirds,
      ).applied,
    ).toBe(true);
    expect(system.snapshot).toMatchObject({ health: twoThirds, stage: 2 });

    finishVulnerableCycle(system);
    enterVulnerable(system);
    const oneThird = ENEMIES.queen.maxHealth * (1 / 3);
    system.applyDamage({ type: 'queen' }, system.snapshot.health - oneThird);
    expect(system.snapshot).toMatchObject({ health: oneThird, stage: 3 });
  });

  it('defeats the vulnerable queen exactly at zero and emits victory only once', () => {
    const system = new QueenBossSystem();
    system.start(200, 300);
    enterVulnerable(system);

    const nonlethal = system.applyDamage({ type: 'queen' }, 1);
    expect(nonlethal).toMatchObject({
      applied: true,
      damage: 1,
      blockedByArmor: false,
      defeated: false,
    });
    expect(eventsOf(nonlethal.events, 'queen-defeated')).toEqual([]);

    const lethal = system.applyDamage(
      { type: 'queen' },
      system.snapshot.health + 10_000,
    );
    expect(system.snapshot).toMatchObject({
      active: false,
      defeated: true,
      phase: 'defeated',
      health: 0,
      vulnerable: false,
      phaseRemainingMs: 0,
      pendingTelegraph: null,
    });
    expect(lethal).toMatchObject({
      applied: true,
      damage: ENEMIES.queen.maxHealth - 1,
      destroyed: true,
      defeated: true,
    });
    expect(eventsOf(lethal.events, 'queen-defeated')).toEqual([
      expect.objectContaining({
        type: 'queen-defeated',
        x: 200,
        y: 300,
        reward: ENEMIES.queen.creditReward,
      }),
    ]);
    expect(system.applyDamage({ type: 'queen' }, 1).events).toEqual([]);
    expect(system.update(AREA_ATTACK_DELAY_MS, { x: 200, y: 300 }, 0)).toEqual([]);
  });
});

describe('QueenBossSystem nests and global capacity', () => {
  it('creates deterministic stage-scaled nests, preserves survivors, and never duplicates IDs', () => {
    const system = new QueenBossSystem();
    system.start(1_000, 700);
    enterNestSpawn(system);

    const stageOne = system.snapshot.nests;
    expect(stageOne).toHaveLength(2);
    expect(stageOne.map(({ id }) => id)).toEqual([1, 2]);
    expect(stageOne.every(({ health }) => health === NEST_MAX_HEALTH)).toBe(true);
    expect(new Set(stageOne.map(({ x, y }) => `${x}:${y}`)).size).toBe(2);

    system.update(QUEEN_NEST_SPAWN_DURATION_MS, FAR_PLAYER, MAX_ACTIVE_ENEMIES);
    system.applyDamage(
      { type: 'queen' },
      ENEMIES.queen.maxHealth - ENEMIES.queen.maxHealth * (2 / 3),
    );
    finishVulnerableCycle(system);
    enterNestSpawn(system);
    const stageTwo = system.snapshot.nests;
    expect(stageTwo).toHaveLength(4);
    expect(stageTwo.map(({ id }) => id)).toEqual([1, 2, 3, 4]);

    system.update(QUEEN_NEST_SPAWN_DURATION_MS, FAR_PLAYER, MAX_ACTIVE_ENEMIES);
    system.applyDamage(
      { type: 'queen' },
      system.snapshot.health - ENEMIES.queen.maxHealth * (1 / 3),
    );
    finishVulnerableCycle(system);
    enterNestSpawn(system);
    const stageThree = system.snapshot.nests;
    expect(stageThree).toHaveLength(6);
    expect(new Set(stageThree.map(({ id }) => id)).size).toBe(6);
    expect(stageThree.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('keeps stage-driven nest growth inside the shared global enemy cap', () => {
    const system = new QueenBossSystem();
    system.start(1_000, 700);
    system.update(QUEEN_ARMORED_DURATION_MS, FAR_PLAYER, 147);
    expect(system.snapshot.nests).toHaveLength(2);
    expect(147 + 1 + system.snapshot.nests.length).toBe(MAX_ACTIVE_ENEMIES);

    system.update(QUEEN_NEST_SPAWN_DURATION_MS, FAR_PLAYER, 147);
    system.applyDamage({ type: 'queen' }, ENEMIES.queen.maxHealth * 0.4);
    finishVulnerableCycle(system);
    system.update(QUEEN_ARMORED_DURATION_MS, FAR_PLAYER, 147);

    expect(system.snapshot.stage).toBe(2);
    expect(system.snapshot.nests).toHaveLength(2);
    expect(147 + 1 + system.snapshot.nests.length).toBeLessThanOrEqual(
      MAX_ACTIVE_ENEMIES,
    );

    system.update(QUEEN_NEST_SPAWN_DURATION_MS, FAR_PLAYER, 145);
    finishVulnerableCycle(system);
    system.update(QUEEN_ARMORED_DURATION_MS, FAR_PLAYER, 145);

    expect(system.snapshot.nests).toHaveLength(4);
    expect(145 + 1 + system.snapshot.nests.length).toBe(MAX_ACTIVE_ENEMIES);
  });

  it('allows nest damage in every active phase and emits one frozen destruction event', () => {
    const system = new QueenBossSystem();
    system.start(500, 500);
    enterNestSpawn(system);
    const nest = system.snapshot.nests[0];

    const partial = system.applyDamage({ type: 'nest', id: nest.id }, 10);
    expect(partial).toMatchObject({ applied: true, damage: 10, destroyed: false });
    expect(system.snapshot.nests[0].health).toBe(NEST_MAX_HEALTH - 10);

    const destroyed = system.applyDamage(
      { type: 'nest', id: nest.id },
      NEST_MAX_HEALTH,
    );
    expect(destroyed).toMatchObject({
      applied: true,
      damage: NEST_MAX_HEALTH - 10,
      destroyed: true,
      defeated: false,
    });
    expect(eventsOf(destroyed.events, 'nest-destroyed')).toEqual([
      expect.objectContaining({ type: 'nest-destroyed', nestId: nest.id }),
    ]);
    expect(Object.isFrozen(destroyed)).toBe(true);
    expect(Object.isFrozen(destroyed.events)).toBe(true);
    expect(Object.isFrozen(destroyed.events[0])).toBe(true);
    expect(system.snapshot.nests.map(({ id }) => id)).not.toContain(nest.id);
    expect(system.applyDamage({ type: 'nest', id: nest.id }, 1).events).toEqual([]);
  });

  it('emits deterministic crawler requests without exceeding shared enemy capacity', () => {
    const system = new QueenBossSystem();
    system.start(500, 500);
    enterNestSpawn(system);
    const livingNests = system.snapshot.nests.length;
    const fullyOccupied = MAX_ACTIVE_ENEMIES - 1 - livingNests;

    expect(
      eventsOf(
        system.update(
          NEST_SPAWN_COOLDOWN_MS[1],
          FAR_PLAYER,
          fullyOccupied,
        ),
        'minion-spawn-request',
      ),
    ).toEqual([]);

    const oneSlotOccupied = fullyOccupied - 1;
    const first = eventsOf(
      system.update(0, FAR_PLAYER, oneSlotOccupied),
      'minion-spawn-request',
    );
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      type: 'minion-spawn-request',
      nestId: 1,
      enemyType: 'crawler',
      x: system.snapshot.nests[0].x,
      y: system.snapshot.nests[0].y,
    });
    expect(oneSlotOccupied + 1 + livingNests + first.length).toBeLessThanOrEqual(
      MAX_ACTIVE_ENEMIES,
    );

    const second = eventsOf(
      system.update(0, FAR_PLAYER, oneSlotOccupied),
      'minion-spawn-request',
    );
    expect(second).toHaveLength(1);
    expect(second[0].nestId).toBe(2);
    expect(second[0].requestId).not.toBe(first[0].requestId);

    const burst = eventsOf(
      system.update(MAX_QUEEN_UPDATE_DELTA_MS, FAR_PLAYER, 0),
      'minion-spawn-request',
    );
    expect(1 + livingNests + burst.length).toBeLessThanOrEqual(MAX_ACTIVE_ENEMIES);
    expect(new Set(burst.map(({ requestId }) => requestId)).size).toBe(burst.length);
  });
});

describe('QueenBossSystem area telegraph', () => {
  it('telegraphs a locked target before emitting exactly one delayed area attack', () => {
    const system = new QueenBossSystem();
    system.start(400, 400);

    const warningEvents = system.update(0, { x: 450, y: 425 }, 0);
    const warning = eventsOf(warningEvents, 'area-telegraph')[0];
    expect(warning).toMatchObject({
      type: 'area-telegraph',
      x: 450,
      y: 425,
      delayMs: AREA_ATTACK_DELAY_MS,
      damage: ENEMIES.queen.contactDamage,
    });
    expect(eventsOf(warningEvents, 'area-attack')).toEqual([]);
    expect(system.snapshot.pendingTelegraph).toMatchObject({
      id: warning.telegraphId,
      targetX: 450,
      targetY: 425,
      delayRemainingMs: AREA_ATTACK_DELAY_MS,
    });

    const almost = system.update(
      AREA_ATTACK_DELAY_MS - 1,
      { x: 900, y: 900 },
      0,
    );
    expect(eventsOf(almost, 'area-attack')).toEqual([]);
    expect(system.snapshot.pendingTelegraph?.delayRemainingMs).toBe(1);

    const attackEvents = system.update(1, { x: 900, y: 900 }, 0);
    expect(eventsOf(attackEvents, 'area-telegraph')).toEqual([]);
    expect(eventsOf(attackEvents, 'area-attack')).toEqual([
      expect.objectContaining({
        type: 'area-attack',
        telegraphId: warning.telegraphId,
        x: 450,
        y: 425,
        damage: ENEMIES.queen.contactDamage,
      }),
    ]);
    expect(system.snapshot.pendingTelegraph).toBeNull();
    expect(system.update(0, { x: 450, y: 425 }, 0)).toEqual([]);
  });

  it('never creates an area attack outside its finite arena range or in the telegraph update', () => {
    const system = new QueenBossSystem();
    system.start(100, 100);
    expect(system.update(Number.MAX_VALUE, FAR_PLAYER, 0)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'area-telegraph' })]),
    );

    system.reset();
    system.start(100, 100);
    const sameUpdate = system.update(
      MAX_QUEEN_UPDATE_DELTA_MS,
      { x: 100, y: 100 },
      0,
    );
    expect(eventsOf(sameUpdate, 'area-telegraph')).toHaveLength(1);
    expect(eventsOf(sameUpdate, 'area-attack')).toEqual([]);
  });
});

describe('QueenBossSystem state boundary and malformed input', () => {
  it('returns fresh deeply frozen snapshots and frozen event IDs for presentation dedupe', () => {
    const system = new QueenBossSystem();
    system.start(300, 300);
    enterNestSpawn(system);
    const first = system.snapshot;
    const second = system.getSnapshot();

    expect(first).not.toBe(second);
    expect(first.nests).not.toBe(second.nests);
    expect(first.nests[0]).not.toBe(second.nests[0]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.nests)).toBe(true);
    expect(Object.isFrozen(first.nests[0])).toBe(true);
    expect(() => {
      (first.nests as unknown as unknown[]).pop();
    }).toThrow(TypeError);
    expect(() => {
      (first.nests[0] as unknown as { health: number }).health = -1;
    }).toThrow(TypeError);
    expect(system.snapshot.nests).toHaveLength(2);

    system.reset();
    system.start(300, 300);
    const events = system.update(0, { x: 300, y: 300 }, 0);
    expect(Object.isFrozen(events)).toBe(true);
    expect(Object.isFrozen(events[0])).toBe(true);
    expect(events[0]).toMatchObject({ eventId: 1, telegraphId: 1 });
    expect(() => {
      (events as unknown as unknown[]).pop();
    }).toThrow(TypeError);
  });

  it('isolates malformed updates and damage, and caps huge finite deltas', () => {
    const system = new QueenBossSystem();
    system.start(500, 500);
    const before = system.snapshot;

    for (const delta of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(system.update(delta, { x: 500, y: 600 }, Number.NaN)).toEqual([]);
      expect(system.snapshot).toEqual(before);
    }
    expect(() => system.update(100, null as never, Number.NaN)).not.toThrow();
    expect(system.snapshot.rotation).toBe(before.rotation);

    for (const amount of [Number.NaN, Number.POSITIVE_INFINITY, -1, 0]) {
      expect(system.applyDamage({ type: 'queen' }, amount)).toMatchObject({
        applied: false,
        blockedByArmor: false,
        damage: 0,
        events: [],
      });
    }
    expect(system.applyDamage(null as never, 1).applied).toBe(false);
    expect(system.applyDamage({ type: 'nest', id: Number.NaN }, 1).applied).toBe(false);
    expect(system.applyDamage({ type: 'missing' } as never, 1).applied).toBe(false);

    const huge = new QueenBossSystem();
    const capped = new QueenBossSystem();
    huge.start(500, 500);
    capped.start(500, 500);
    const hugeEvents = huge.update(Number.MAX_VALUE, FAR_PLAYER, MAX_ACTIVE_ENEMIES);
    const cappedEvents = capped.update(
      MAX_QUEEN_UPDATE_DELTA_MS,
      FAR_PLAYER,
      MAX_ACTIVE_ENEMIES,
    );
    expect(huge.snapshot).toEqual(capped.snapshot);
    expect(hugeEvents).toEqual(cappedEvents);
  });

  it('reset clears phases, nests, timers, telegraphs, and deterministically restores IDs', () => {
    const system = new QueenBossSystem();
    system.start(600, 600);
    const firstWarning = eventsOf(
      system.update(0, { x: 600, y: 600 }, 0),
      'area-telegraph',
    )[0];
    enterNestSpawn(system);
    expect(system.snapshot.nests.map(({ id }) => id)).toEqual([1, 2]);
    system.update(
      AREA_ATTACK_COOLDOWN_MS[1],
      { x: 600, y: 600 },
      MAX_ACTIVE_ENEMIES,
    );
    expect(system.snapshot.pendingTelegraph).not.toBeNull();

    system.reset();
    expect(system.snapshot).toEqual({
      active: false,
      defeated: false,
      phase: 'idle',
      stage: 1,
      x: 0,
      y: 0,
      rotation: 0,
      health: ENEMIES.queen.maxHealth,
      maxHealth: ENEMIES.queen.maxHealth,
      vulnerable: false,
      phaseRemainingMs: 0,
      nests: [],
      pendingTelegraph: null,
    });

    expect(system.start(600, 600)).toBe(true);
    const replayWarning = eventsOf(
      system.update(0, { x: 600, y: 600 }, 0),
      'area-telegraph',
    )[0];
    expect(replayWarning.eventId).toBe(firstWarning.eventId);
    expect(replayWarning.telegraphId).toBe(firstWarning.telegraphId);
    enterNestSpawn(system);
    expect(system.snapshot.nests.map(({ id }) => id)).toEqual([1, 2]);
  });
});
