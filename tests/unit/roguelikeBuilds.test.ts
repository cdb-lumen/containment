import { describe, expect, it } from 'vitest';
import {
  addMutation, BUILD_LIMITS, createBuild, createBuildResolutionState, deriveBuildStats,
  draftMutationOffers, isValidBuildEvent, isValidBuildResolutionState, isValidBuildState, resolveBuildEvent,
  type BuildEvent, type BuildResolutionState, type ResourceSnapshot,
} from '../../src/game/roguelike/builds';
import { MUTATION_CATALOG, MUTATION_IDS } from '../../src/game/roguelike/mutationCatalog';
import type { BuildState, MutationId } from '../../src/game/roguelike/types';

const build = (...mutations: MutationId[]): BuildState => ({ mutations });
const resources = (overrides: Partial<ResourceSnapshot> = {}): ResourceSnapshot => ({ weapon: 'shotgun', health: 50, maxHealth: 100, armor: 0, maxArmor: 100, magazine: 4, capacity: 8, reserve: 10, maxReserve: 100, ...overrides });
const envelope = (id = 'event', depth = 0) => ({ id, cause: { chainId: 'root', depth } });
const hit = (chilledStacks = 0): BuildEvent => ({ ...envelope(), type: 'hit', weapon: 'shotgun', targetId: 'enemy', direction: { x: 3, y: 4 }, chilledStacks });

describe('bounded mutation builds and deterministic offers', () => {
  it('requires exact schema, unique known IDs and at most twenty-four mutations', () => {
    expect(isValidBuildState(createBuild())).toBe(true);
    expect(isValidBuildState(build(...MUTATION_IDS))).toBe(true);
    for (const value of [null, [], {}, { mutations: ['unknown'] }, { mutations: ['breacher', 'breacher'] }, { mutations: [], extra: true }, { mutations: Array(13).fill('breacher') }]) expect(isValidBuildState(value)).toBe(false);
  });
  it('adds immutably and rejects duplicate or unknown ownership', () => {
    const initial = Object.freeze({ mutations: Object.freeze([]) });
    expect(addMutation(initial, 'breacher')).toEqual(build('breacher'));
    expect(initial).toEqual(createBuild());
    expect(() => addMutation(build('breacher'), 'breacher')).toThrow();
    expect(() => addMutation(initial, 'unknown' as MutationId)).toThrow();
  });
  it('rejects sparse build and resolution arrays, including inherited elements', () => {
    expect(isValidBuildState({ mutations: Array(1) })).toBe(false);
    const inherited: MutationId[] = [];
    inherited.length = 1;
    Object.setPrototypeOf(inherited, { 0: 'breacher' });
    expect(isValidBuildState({ mutations: inherited })).toBe(false);
    for (const key of ['seenEventIds', 'chains', 'hotWeapons'] as const) {
      const invalid = { ...createBuildResolutionState(), [key]: Array(1) };
      expect(isValidBuildResolutionState(invalid)).toBe(false);
      expect(resolveBuildEvent(build(), invalid, hit()).rejected).toBe('invalid-state');
    }
    expect(isValidBuildResolutionState({ seenEventIds: Array(1), chains: [{ id: 'root', events: 1 }], hotWeapons: [] })).toBe(false);
  });
  it('drafts stable unique unowned offers, independent of ownership order', () => {
    const a = draftMutationOffers(123, build('breacher', 'scavenger'));
    expect(a).toEqual(draftMutationOffers(123, build('scavenger', 'breacher')));
    expect(new Set(a.map((offer) => offer.id)).size).toBe(3);
    expect(a.every((offer) => !['breacher', 'scavenger'].includes(offer.id))).toBe(true);
    expect(draftMutationOffers(123, build(), true).some((offer) => offer.rarity === 'rare')).toBe(true);
    expect(new Set(Array.from({ length: 12 }, (_, seed) => draftMutationOffers(seed, build()).map((offer) => offer.id).join(','))).size).toBeGreaterThan(1);
  });
  it('handles exhausted pools and rejects invalid inputs', () => {
    expect(draftMutationOffers(0, build(...MUTATION_IDS))).toEqual([]);
    expect(draftMutationOffers(0, build(...MUTATION_IDS.slice(1)))).toEqual([MUTATION_CATALOG.breacher]);
    for (const seed of [NaN, Infinity, -1, 1.5, 4294967296]) expect(() => draftMutationOffers(seed, build())).toThrow();
    expect(() => draftMutationOffers(1, { mutations: ['unknown'] } as unknown as BuildState)).toThrow();
  });
  it('offers dependencies only after prerequisites are owned, including rare drafts', () => {
    for (const rare of [false, true]) {
      for (let seed = 0; seed < 64; seed++) {
        expect(draftMutationOffers(seed, build(), rare).every((offer) => offer.id !== 'shattershot' && offer.id !== 'chain-reaction')).toBe(true);
        const offers = draftMutationOffers(seed, build('breacher'), rare);
        expect(offers.every((offer) => offer.id !== 'shattershot')).toBe(true);
      }
    }
    const almostOwned = build(...MUTATION_IDS.filter((mutation) => !['breacher', 'cryogenic', 'chain-reaction', 'shattershot'].includes(mutation)));
    expect(draftMutationOffers(7, almostOwned, true).map((offer) => offer.id).sort()).toEqual(['breacher', 'cryogenic']);
    const withLaunch = addMutation(almostOwned, 'breacher');
    expect(draftMutationOffers(7, withLaunch, true).map((offer) => offer.id)).toEqual(['chain-reaction', 'cryogenic']);
    const withBoth = addMutation(withLaunch, 'cryogenic');
    expect(draftMutationOffers(7, withBoth).map((offer) => offer.id).sort()).toEqual(['chain-reaction', 'shattershot']);
  });
  it('makes numerical tradeoffs executable in base combat stats', () => {
    const stats = deriveBuildStats(build('breacher', 'heavy-pellets', 'cryogenic', 'hot-reload', 'last-shell', 'volatile-remains'), 'shotgun');
    expect(stats.projectileDamageMultiplier).toBeCloseTo(0.9 * 1.35 * 0.9);
    expect(stats.shotIntervalMultiplier).toBe(1.2);
    expect(stats.reloadDurationMultiplier).toBeCloseTo(1.15 * 1.1 * .9);
    expect(stats.incomingDamageMultiplier).toBe(1.1);
    expect(deriveBuildStats(createBuild(), 'pistol').projectileDamageMultiplier).toBe(1);
  });
});

describe('pure mutation event commands', () => {
  it('resolves empty builds and unknown events without effects', () => {
    const empty = createBuildResolutionState();
    expect(resolveBuildEvent(createBuild(), empty, hit()).commands).toEqual([]);
    const invalid = resolveBuildEvent(build('breacher'), empty, { ...envelope(), type: 'unknown' } as unknown as BuildEvent);
    expect(invalid.rejected).toBe('invalid-event');
    expect(invalid.state).toBe(empty);
    expect(isValidBuildEvent(null)).toBe(false);
    expect(isValidBuildEvent({ ...hit(), chilledStacks: 4 })).toBe(false);
  });
  it('launches with normalized force and resolves bounded wall and body collisions', () => {
    const b = build('breacher', 'heavy-pellets', 'chain-reaction');
    const first = resolveBuildEvent(b, createBuildResolutionState(), hit());
    expect(first.commands[0]).toMatchObject({ type: 'impulse', x: 162, y: 216, cause: { chainId: 'root', depth: 1 } });
    const wall = resolveBuildEvent(b, first.state, { ...envelope('wall', 1), type: 'wall-hit', targetId: 'enemy', impulse: 10000 });
    expect(wall.commands[0]).toMatchObject({ type: 'damage', amount: 36, source: 'secondary' });
    const collision = resolveBuildEvent(b, wall.state, { ...envelope('body', 2), type: 'body-collision', targetId: 'enemy2', impulse: 270, direction: { x: 1, y: 0 } });
    expect(collision.commands[0]).toMatchObject({ type: 'damage', amount: 21.6 });
    expect(collision.commands[1]).toMatchObject({ type: 'impulse', x: 148.5, cause: { depth: 3 } });
    const terminal = resolveBuildEvent(b, collision.state, { ...envelope('terminal', 3), type: 'body-collision', targetId: 'enemy3', impulse: 148.5, direction: { x: 1, y: 0 } });
    expect(terminal.commands).toEqual([]);
  });
  it('handles zero direction without non-finite force', () => {
    const event = { ...hit(), direction: { x: 0, y: 0 } } as BuildEvent;
    expect(resolveBuildEvent(build('breacher'), createBuildResolutionState(), event).commands).toEqual([]);
  });
  it('chills then consumes prior chill for a bounded shatter, without reapplying chill', () => {
    const b = build('cryogenic', 'shattershot');
    const first = resolveBuildEvent(b, createBuildResolutionState(), hit(1));
    expect(first.commands[0]).toMatchObject({ type: 'chill', stacks: 2, slowFraction: 0.3 });
    const shattered = resolveBuildEvent(b, first.state, { ...hit(2), id: 'shatter' });
    expect(shattered.commands.map((command) => command.type)).toEqual(['chill', 'damage', 'explosion']);
    expect(shattered.commands[0]).toMatchObject({ stacks: 0 });
    expect(shattered.commands[2]).toMatchObject({ maxTargets: 6, damage: 16, source: 'secondary' });
  });
  it('caps explosion depth and refuses excess events in a chain', () => {
    const b = build('volatile-remains');
    let state = createBuildResolutionState();
    for (let depth = 0; depth <= 3; depth++) {
      const result = resolveBuildEvent(b, state, { ...envelope(`kill-${depth}`, depth), type: 'kill', targetId: `enemy-${depth}`, source: 'secondary', resources: resources() });
      expect(result.commands.length).toBe(depth < 3 ? 1 : 0);
      state = result.state;
    }
    expect(resolveBuildEvent(b, state, { ...hit(), id: 'too-deep', cause: { chainId: 'root', depth: 4 } }).rejected).toBe('depth-limit');
    for (let i = 4; i < BUILD_LIMITS.maxEventsPerChain; i++) state = resolveBuildEvent(b, state, { ...hit(), id: `event-${i}` }).state;
    expect(resolveBuildEvent(b, state, { ...hit(), id: 'overflow' }).rejected).toBe('chain-limit');
  });
  it('deduplicates events and leaves frozen input state untouched', () => {
    const initial = Object.freeze({ seenEventIds: Object.freeze([]), chains: Object.freeze([]), hotWeapons: Object.freeze([]) });
    const b = build('breacher');
    const first = resolveBuildEvent(b, initial, hit());
    expect(initial).toEqual(createBuildResolutionState());
    expect(resolveBuildEvent(b, initial, hit())).toEqual(first);
    const duplicate = resolveBuildEvent(b, first.state, hit());
    expect(duplicate.commands).toEqual([]);
    expect(duplicate.rejected).toBe('duplicate');
    expect(duplicate.state).toBe(first.state);
  });
  it('never evicts the dedupe ledger when the encounter is full', () => {
    const state: BuildResolutionState = { seenEventIds: Array.from({ length: 2048 }, (_, i) => `e${i}`), chains: Array.from({ length: 64 }, (_, i) => ({ id: `c${i}`, events: 32 })), hotWeapons: [] };
    expect(isValidBuildResolutionState(state)).toBe(true);
    expect(resolveBuildEvent(build(), state, hit()).rejected).toBe('encounter-limit');
    expect(isValidBuildResolutionState({ ...state, chains: [] })).toBe(false);
  });
  it('recovers ammo with proportional blood cost, preserving health floor and resource caps', () => {
    const b = build('scavenger', 'blood-price');
    const kill = (r: ResourceSnapshot, source: 'direct' | 'secondary' = 'direct') => resolveBuildEvent(b, createBuildResolutionState(), { ...envelope(), type: 'kill', targetId: 'enemy', source, resources: r });
    expect(kill(resources()).commands[0]).toMatchObject({ reserveDelta: 4, healthDelta: -2 });
    expect(kill(resources({ reserve: 98 })).commands[0]).toMatchObject({ reserveDelta: 2, healthDelta: -2 / 3 });
    expect(kill(resources({ health: 1 })).commands[0]).toMatchObject({ reserveDelta: 1, healthDelta: 0 });
    expect(kill(resources({ health: 2 })).commands[0]).toMatchObject({ reserveDelta: 2, healthDelta: -2 / 3 });
    expect(kill(resources({ reserve: 100 })).commands).toEqual([]);
    expect(kill(resources({ weapon: 'pistol', reserve: -1 })).commands).toEqual([]);
    expect(kill(resources(), 'secondary').commands).toEqual([]);
    expect(kill(resources({ health: 0 })).commands).toEqual([]);
    expect(kill(resources({ reserve: Infinity })).rejected).toBe('invalid-event');
    expect(kill(resources({ reserve: -1 })).rejected).toBe('invalid-event');
  });
  it('primes a reload once and composes the last-shell shot exactly once', () => {
    const b = build('hot-reload', 'last-shell');
    const reload: BuildEvent = { ...envelope('reload'), type: 'reload', weapon: 'shotgun', roundsLoaded: 1 };
    const first = resolveBuildEvent(b, createBuildResolutionState(), reload);
    const second = resolveBuildEvent(b, first.state, { ...reload, id: 'reload-again' });
    expect(second.state.hotWeapons).toEqual(['shotgun']);
    const shot: BuildEvent = { ...envelope('shot'), type: 'shot', weapon: 'shotgun', magazineBefore: 1 };
    const fired = resolveBuildEvent(b, second.state, shot);
    expect(fired.commands[0]).toMatchObject({ type: 'shot-bonus', damageMultiplier: 1.5 * 1.6 });
    expect(fired.state.hotWeapons).toEqual([]);
    expect(resolveBuildEvent(b, fired.state, { ...shot, id: 'next-shot', magazineBefore: 4 }).commands).toEqual([]);
    expect(resolveBuildEvent(b, createBuildResolutionState(), { ...reload, roundsLoaded: 0 }).state.hotWeapons).toEqual([]);
  });
  it('bounds pickup bonuses and healing overflow using post-base snapshots', () => {
    const b = build('magnetic-feed', 'field-medic');
    const pickup: BuildEvent = { ...envelope(), type: 'pickup', kind: 'ammo', resources: resources({ magazine: 7 }) };
    expect(resolveBuildEvent(b, createBuildResolutionState(), pickup).commands[0]).toMatchObject({ magazineDelta: 1 });
    expect(resolveBuildEvent(b, createBuildResolutionState(), { ...pickup, resources: resources({ magazine: 8 }) }).commands).toEqual([]);
    const heal: BuildEvent = { ...envelope(), type: 'heal', amount: 100, resources: resources({ health: 95, armor: 98 }) };
    expect(resolveBuildEvent(b, createBuildResolutionState(), heal).commands[0]).toMatchObject({ healthDelta: 5, armorDelta: 2 });
    expect(resolveBuildEvent(b, createBuildResolutionState(), { ...heal, amount: 0 }).commands).toEqual([]);
  });
});
