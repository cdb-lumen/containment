import { describe, expect, it } from 'vitest';

import { EffectsSystem } from '../../src/game/effects/EffectsSystem';

const addMany = (effects: EffectsSystem, kind: Parameters<EffectsSystem['add']>[0], count: number) => {
  for (let index = 0; index < count; index += 1) effects.add(kind, { label: `${kind}-${index}` });
};

describe('EffectsSystem bounds and retirement', () => {
  it('plans retirement without mutation and commits the exact projected transaction', () => {
    const effects = new EffectsSystem('low');
    addMany(effects, 'decals', effects.limits.decals);
    const before = effects.snapshot('decals');

    const plan = effects.planAtomic([{ kind: 'decals', input: { label: 'replacement' } }])!;

    expect(effects.snapshot('decals')).toEqual(before);
    expect(plan.retiredIds).toEqual([before[0]!.id]);
    expect(plan.added[0]?.label).toBe('replacement');
    expect(effects.commitAtomic(plan)).toBe(true);
    expect(effects.snapshot('decals').at(-1)).toEqual(plan.added[0]);
  });

  it('rejects a stale atomic plan without consuming its projected IDs', () => {
    const effects = new EffectsSystem('low');
    const stale = effects.planAtomic([{ kind: 'decals', input: { label: 'stale' } }])!;
    const intervening = effects.add('particles')!;

    expect(effects.commitAtomic(stale)).toBe(false);
    expect(effects.snapshot('decals')).toEqual([]);
    expect(effects.add('shellCasings')?.id).toBe(intervening.id + 1);
  });

  it('admits a batch atomically without consuming IDs or retiring records on failure', () => {
    const effects = new EffectsSystem('low');
    const first = effects.add('decals', { label: 'first' })!;
    addMany(effects, 'decals', effects.limits.decals - 1);
    for (let index = 0; index < effects.limits.remains; index += 1) {
      effects.add('remains', { label: `protected-${index}`, essential: true });
    }
    const beforeDecals = effects.snapshot('decals');
    const beforeRemains = effects.snapshot('remains');

    expect(effects.addAtomic([
      { kind: 'decals', input: { label: 'blood' } },
      { kind: 'remains', input: { label: 'corpse' } },
    ])).toBeNull();
    expect(effects.snapshot('decals')).toEqual(beforeDecals);
    expect(effects.snapshot('remains')).toEqual(beforeRemains);
    expect(effects.add('particles')?.id).toBe(first.id + effects.limits.decals + effects.limits.remains);
  });

  it('commits all batch retirements and returns frozen records on success', () => {
    const effects = new EffectsSystem('low');
    addMany(effects, 'decals', effects.limits.decals);
    addMany(effects, 'remains', effects.limits.remains);
    const oldDecal = effects.snapshot('decals')[0]!;
    const oldRemains = effects.snapshot('remains')[0]!;

    const admitted = effects.addAtomic([
      { kind: 'decals', input: { label: 'blood' } },
      { kind: 'remains', input: { label: 'corpse', major: true } },
    ]);

    expect(admitted).not.toBeNull();
    expect(Object.isFrozen(admitted)).toBe(true);
    expect(admitted?.every(Object.isFrozen)).toBe(true);
    expect(effects.snapshot('decals').some(({ id }) => id === oldDecal.id)).toBe(false);
    expect(effects.snapshot('remains').some(({ id }) => id === oldRemains.id)).toBe(false);
  });
  it('never exceeds low profile hard caps', () => {
    const effects = new EffectsSystem('low');
    for (const [kind, cap] of Object.entries(effects.limits)) {
      addMany(effects, kind as Parameters<EffectsSystem['add']>[0], cap + 20);
      expect(effects.count(kind as Parameters<EffectsSystem['add']>[0])).toBe(cap);
    }
  });

  it('retires the oldest nonessential effect first at a category cap', () => {
    const effects = new EffectsSystem('low');
    const oldest = effects.add('decals', { label: 'oldest' });
    effects.add('decals', { label: 'essential', essential: true });
    addMany(effects, 'decals', effects.limits.decals - 2);
    const newest = effects.add('decals', { label: 'newest' });

    expect(effects.snapshot('decals').some(({ id }) => id === oldest!.id)).toBe(false);
    expect(effects.snapshot('decals').at(-1)?.id).toBe(newest!.id);
    expect(effects.snapshot('decals').some(({ label }) => label === 'essential')).toBe(true);
  });

  it('preserves major remains over transient remains regardless of age', () => {
    const effects = new EffectsSystem('low');
    const major = effects.add('remains', { label: 'boss', major: true });
    addMany(effects, 'remains', effects.limits.remains - 1);
    effects.add('remains', { label: 'replacement' });

    expect(effects.snapshot('remains').some(({ id }) => id === major!.id)).toBe(true);
    expect(effects.snapshot('remains').map(({ label }) => label)).not.toContain('remains-0');
  });

  it('rejects additions when every item at cap is essential', () => {
    const effects = new EffectsSystem('low');
    for (let index = 0; index < effects.limits.dynamicLights; index += 1) {
      effects.add('dynamicLights', { label: `${index}`, essential: true });
    }
    expect(effects.add('dynamicLights', { label: 'overflow' })).toBeNull();
    expect(effects.count('dynamicLights')).toBe(effects.limits.dynamicLights);
  });

  it('trims oldest nonessential effects when the active profile is lowered', () => {
    const effects = new EffectsSystem('high');
    const major = effects.add('remains', { label: 'major', major: true });
    addMany(effects, 'remains', effects.limits.remains - 1);

    effects.setProfile('low');

    expect(effects.count('remains')).toBe(effects.limits.remains);
    expect(effects.snapshot('remains').some(({ id }) => id === major!.id)).toBe(true);
  });

  it('removes completed transient records and clears every category on reset', () => {
    const effects = new EffectsSystem('low');
    const particle = effects.add('particles');
    expect(effects.remove(particle!.id)).toBe(true);
    expect(effects.remove(particle!.id)).toBe(false);
    addMany(effects, 'decals', 3);
    addMany(effects, 'shellCasings', 2);

    effects.clear();

    expect(
      Object.keys(effects.limits).every(
        (kind) =>
          effects.count(kind as Parameters<EffectsSystem['count']>[0]) === 0,
      ),
    ).toBe(true);
    expect(effects.add('particles')?.id).toBe(1);
  });
});
