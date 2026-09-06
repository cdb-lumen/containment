import { describe, expect, it, vi } from 'vitest';
import {
  CHECKPOINT_RESOURCE_LIMITS,
  CHECKPOINT_STORAGE_KEY,
  MAX_CHECKPOINT_LENGTH,
  clearCheckpoint,
  isValidRunResources,
  loadCheckpoint,
  parseCheckpoint,
  saveCheckpoint,
  serializeCheckpoint,
} from '../../src/game/roguelike/checkpoints';
import type { StorageLike } from '../../src/game/roguelike/checkpoints';
import { createBuild } from '../../src/game/roguelike/builds';
import { clearRoom, createRun, endRun, enterRoom, finishReward, generateRun } from '../../src/game/roguelike/run';
import type { RunCheckpoint, RunResources, RunState } from '../../src/game/roguelike/types';

function resources(): RunResources {
  return {
    health: 93.5, armor: 25, credits: 100, grenades: 2, medkits: 1, weapon: 'pistol',
    ammo: {
      pistol: { magazine: 12, reserve: -1 }, rifle: { magazine: 30, reserve: 90 },
      shotgun: { magazine: 8, reserve: 24 }, plasma: { magazine: 20, reserve: 60 },
      rocket: { magazine: 1, reserve: 4 },
    },
  };
}

function checkpoint(run = clearRoom(createRun(42))): RunCheckpoint {
  return { version: 1, savedAt: 1_800_000_000_000, run, build: createBuild(), resources: resources() };
}

function memoryStorage() {
  const entries = new Map<string, string>();
  const storage: StorageLike = {
    getItem: vi.fn((key: string) => entries.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { entries.set(key, value); }),
    removeItem: vi.fn((key: string) => { entries.delete(key); }),
  };
  return { storage, entries };
}

function raw(value: unknown): string { return JSON.stringify(value); }

describe('versioned room-boundary checkpoints', () => {
  it('validates resource snapshots independently, including terminal zero health', () => {
    expect(isValidRunResources(resources())).toBe(true);
    expect(isValidRunResources({ ...resources(), health: 0 })).toBe(true);
    expect(isValidRunResources({ ...resources(), health: Infinity })).toBe(false);
    expect(isValidRunResources({ ...resources(), extra: true })).toBe(false);
    expect(isValidRunResources(null)).toBe(false);
  });
  it('round-trips unresolved reward and route phases with deterministic snapshots', () => {
    for (const run of [clearRoom(createRun(42)), finishReward(clearRoom(createRun(42)))]) {
      const original = checkpoint(run);
      const encoded = serializeCheckpoint(original);
      expect(encoded).not.toBeNull();
      expect(serializeCheckpoint(original)).toBe(encoded);
      expect(parseCheckpoint(encoded)).toEqual(original);
      expect(parseCheckpoint(encoded)?.run.phase).toBe(run.phase);
      expect(parseCheckpoint(encoded)).not.toBe(original);
      expect(encoded).toContain('"reserve":-1');
      expect(encoded).not.toContain('Infinity');
    }
  });

  it('saves and loads using the injected key without touching unrelated data', () => {
    const { storage, entries } = memoryStorage();
    entries.set('settings', 'keep');
    expect(saveCheckpoint(storage, checkpoint())).toEqual({ status: 'saved' });
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(entries.has(CHECKPOINT_STORAGE_KEY)).toBe(true);
    expect(loadCheckpoint(storage)).toEqual(checkpoint());
    expect(clearCheckpoint(storage)).toBe(true);
    expect(loadCheckpoint(storage)).toBeNull();
    expect(entries.get('settings')).toBe('keep');
  });

  it('rejects combat serialization and preserves the completed-room save during combat', () => {
    const { storage, entries } = memoryStorage();
    saveCheckpoint(storage, checkpoint());
    const before = entries.get(CHECKPOINT_STORAGE_KEY);
    const combat = checkpoint(createRun(42));
    expect(serializeCheckpoint(combat)).toBeNull();
    expect(parseCheckpoint(raw(combat))).toBeNull();
    expect(saveCheckpoint(storage, combat)).toEqual({ status: 'skipped' });
    expect(entries.get(CHECKPOINT_STORAGE_KEY)).toBe(before);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('clears death even with a zero-health terminal snapshot', () => {
    const { storage } = memoryStorage();
    saveCheckpoint(storage, checkpoint());
    const dead = { ...checkpoint(endRun(createRun(42))), resources: { ...resources(), health: 0 } };
    expect(serializeCheckpoint(dead)).toBeNull();
    expect(saveCheckpoint(storage, dead)).toEqual({ status: 'cleared' });
    expect(loadCheckpoint(storage)).toBeNull();
  });

  it('clears a completed boss run instead of loading the previous room', () => {
    const { storage } = memoryStorage();
    saveCheckpoint(storage, checkpoint());
    const graph = generateRun(42);
    let run: RunState = createRun(42);
    for (let room = 0; room < 12 && run.phase !== 'complete'; room += 1) {
      run = clearRoom(run);
      if (run.phase === 'reward') run = finishReward(run);
      if (run.phase === 'route') {
        const next = graph.nodes.find((node) => node.id === run.currentNodeId)?.next[0];
        if (next) run = enterRoom(run, next);
      }
    }
    expect(run.phase).toBe('complete');
    expect(saveCheckpoint(storage, checkpoint(run))).toEqual({ status: 'cleared' });
    expect(loadCheckpoint(storage)).toBeNull();
  });

  it('rejects cross-seed, unknown-node, duplicate and impossible completed paths', () => {
    const original = checkpoint();
    const invalidRuns = [
      { ...original.run, seed: 43 },
      { ...original.run, currentNodeId: 'unknown' },
      { ...original.run, completedNodeIds: [] },
      { ...original.run, completedNodeIds: [original.run.currentNodeId, original.run.currentNodeId] },
      { ...original.run, completedNodeIds: Array.from({ length: 7 }, () => original.run.currentNodeId) },
    ];
    for (const run of invalidRuns) expect(parseCheckpoint(raw({ ...original, run }))).toBeNull();
  });

  it('rejects unsupported versions and extra or missing nested fields', () => {
    const original = checkpoint();
    const invalid = [
      { ...original, version: 2 }, { ...original, extra: true },
      { ...original, savedAt: undefined },
      { ...original, run: { ...original.run, extra: true } },
      { ...original, build: { ...original.build, extra: true } },
      { ...original, resources: { ...original.resources, extra: true } },
      { ...original, resources: { ...original.resources, ammo: { ...original.resources.ammo, laser: { magazine: 1, reserve: 1 } } } },
      { ...original, resources: { ...original.resources, ammo: { ...original.resources.ammo, pistol: { magazine: 1, reserve: -1, extra: 1 } } } },
      { ...original, build: { mutations: ['breacher', 'breacher'] } },
      { ...original, build: { mutations: ['unknown'] } },
    ];
    for (const value of invalid) {
      expect(serializeCheckpoint(value)).toBeNull();
      expect(parseCheckpoint(raw(value))).toBeNull();
    }
  });

  it('requires a finite nonnegative safe-integer timestamp', () => {
    for (const savedAt of [-1, 0.5, Infinity, -Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '1']) {
      expect(serializeCheckpoint({ ...checkpoint(), savedAt })).toBeNull();
    }
    expect(serializeCheckpoint({ ...checkpoint(), savedAt: 0 })).not.toBeNull();
  });

  it('enforces finite bounded health, armor and integer inventories', () => {
    const invalidResources = [
      { health: 0 }, { health: -1 }, { health: Infinity }, { armor: NaN }, { armor: -1 },
      { health: CHECKPOINT_RESOURCE_LIMITS.health + 1 }, { armor: CHECKPOINT_RESOURCE_LIMITS.armor + 1 },
      { credits: -1 }, { credits: 0.5 }, { credits: CHECKPOINT_RESOURCE_LIMITS.credits + 1 },
      { grenades: -1 }, { grenades: 0.5 }, { grenades: CHECKPOINT_RESOURCE_LIMITS.grenades + 1 },
      { medkits: -1 }, { medkits: 0.5 }, { medkits: CHECKPOINT_RESOURCE_LIMITS.medkits + 1 },
      { weapon: 'laser' },
    ];
    for (const patch of invalidResources) {
      expect(serializeCheckpoint({ ...checkpoint(), resources: { ...resources(), ...patch } })).toBeNull();
    }
  });

  it('allows -1 only in pistol reserve and rejects JSON-null Infinity coercion', () => {
    for (const weapon of ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'] as const) {
      for (const field of ['magazine', 'reserve'] as const) {
        for (const amount of [-1, -2, Infinity, NaN, 0.5, 100_001]) {
          const original = checkpoint();
          const changed = { ...original, resources: { ...original.resources, ammo: {
            ...original.resources.ammo,
            [weapon]: { ...original.resources.ammo[weapon], [field]: amount },
          } } };
          if (weapon === 'pistol' && field === 'reserve' && amount === -1) {
            expect(serializeCheckpoint(changed)).not.toBeNull();
          } else {
            expect(serializeCheckpoint(changed)).toBeNull();
            expect(parseCheckpoint(raw(changed))).toBeNull();
          }
        }
      }
    }
  });

  it('bounds payloads and safely rejects malformed, hostile or corrupt input', () => {
    for (const value of [null, undefined, {}, '', '{', 'null', '[]', '"x"', ' '.repeat(MAX_CHECKPOINT_LENGTH + 1)]) {
      expect(parseCheckpoint(value)).toBeNull();
    }
    const { storage, entries } = memoryStorage();
    entries.set(CHECKPOINT_STORAGE_KEY, '{broken');
    expect(loadCheckpoint(storage)).toBeNull();
    const throwing = Object.defineProperty({}, 'version', { get() { throw new Error('getter'); } });
    expect(serializeCheckpoint(throwing)).toBeNull();
    const cyclic: Record<string, unknown> = { ...checkpoint() };
    cyclic.resources = cyclic;
    expect(serializeCheckpoint(cyclic)).toBeNull();
  });

  it('preserves the prior save on invalid input or quota failure and reports failures', () => {
    const { storage, entries } = memoryStorage();
    saveCheckpoint(storage, checkpoint());
    const before = entries.get(CHECKPOINT_STORAGE_KEY);
    expect(saveCheckpoint(storage, { ...checkpoint(), version: 2 })).toEqual({ status: 'invalid' });
    expect(entries.get(CHECKPOINT_STORAGE_KEY)).toBe(before);
    storage.setItem = () => { throw new Error('quota'); };
    expect(saveCheckpoint(storage, checkpoint())).toEqual({ status: 'unavailable' });
    expect(entries.get(CHECKPOINT_STORAGE_KEY)).toBe(before);
    storage.getItem = () => { throw new Error('security'); };
    expect(loadCheckpoint(storage)).toBeNull();
    storage.removeItem = () => { throw new Error('security'); };
    expect(clearCheckpoint(storage)).toBe(false);
    expect(saveCheckpoint(storage, checkpoint(endRun(createRun(42))))).toEqual({ status: 'unavailable' });
  });

  it('works when storage is unavailable and does not clear saves for fabricated terminal states', () => {
    expect(loadCheckpoint(null)).toBeNull();
    expect(clearCheckpoint(undefined)).toBe(false);
    expect(saveCheckpoint(null, checkpoint())).toEqual({ status: 'unavailable' });
    const { storage } = memoryStorage();
    saveCheckpoint(storage, checkpoint());
    const fabricated = { ...checkpoint(), run: { ...checkpoint().run, phase: 'complete' } };
    expect(saveCheckpoint(storage, fabricated)).toEqual({ status: 'invalid' });
    expect(loadCheckpoint(storage)).not.toBeNull();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});
