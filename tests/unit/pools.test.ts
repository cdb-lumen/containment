import { describe, expect, it, vi } from 'vitest';

import { ProjectilePool } from '../../src/game/combat/ProjectilePool';
import { EnemyPool } from '../../src/game/enemies/EnemyPool';
import { ObjectPool, type PoolHooks } from '../../src/game/pools/ObjectPool';

type PooledItem = { serial: number; value: string; active: boolean };
type Init = { value: string };

const setup = () => {
  let serial = 0;
  const create = vi.fn((): PooledItem => ({
    serial: ++serial,
    value: '',
    active: false,
  }));
  const activate = vi.fn((item: PooledItem, init: Init) => {
    item.value = init.value;
    item.active = true;
  });
  const deactivate = vi.fn((item: PooledItem) => {
    item.value = '';
    item.active = false;
  });
  const hooks: PoolHooks<PooledItem, Init> = { create, activate, deactivate };
  return { hooks, create, activate, deactivate };
};

describe('ObjectPool', () => {
  it('validates initial and maximum size ranges', () => {
    const { hooks } = setup();
    for (const invalid of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new ObjectPool(hooks, invalid, 2)).toThrow(RangeError);
      expect(() => new ObjectPool(hooks, 0, invalid)).toThrow(RangeError);
    }
    expect(() => new ObjectPool(hooks, 2, 1)).toThrow(RangeError);
    expect(() => new ObjectPool(hooks, 0, 0)).not.toThrow();
  });

  it('preallocates inactive items and exposes counts', () => {
    const { hooks, create, activate } = setup();
    const pool = new ObjectPool(hooks, 2, 4);

    expect(create).toHaveBeenCalledTimes(2);
    expect(activate).not.toHaveBeenCalled();
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(2);
    expect(pool.maxSize).toBe(4);
  });

  it('reuses inactive items before creating and activates exactly once', () => {
    const { hooks, create, activate } = setup();
    const pool = new ObjectPool(hooks, 1, 2);

    const first = pool.acquire({ value: 'first' });
    const second = pool.acquire({ value: 'second' });

    expect(first?.serial).toBe(1);
    expect(first?.value).toBe('first');
    expect(second?.serial).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
    expect(activate).toHaveBeenCalledTimes(2);
    expect(pool.activeCount).toBe(2);
    expect(pool.totalCount).toBe(2);
  });

  it('returns null at cap without invoking hooks', () => {
    const { hooks, create, activate } = setup();
    const pool = new ObjectPool(hooks, 0, 1);
    pool.acquire({ value: 'only' });

    expect(pool.acquire({ value: 'overflow' })).toBeNull();
    expect(create).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it('deactivates once on release and resets through activate when reused', () => {
    const { hooks, activate, deactivate } = setup();
    const pool = new ObjectPool(hooks, 1, 1);
    const item = pool.acquire({ value: 'before' });
    expect(item).not.toBeNull();

    pool.release(item!);
    pool.release(item!);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(pool.activeCount).toBe(0);
    expect(item?.value).toBe('');

    const reused = pool.acquire({ value: 'after' });
    expect(reused).toBe(item);
    expect(reused?.value).toBe('after');
    expect(activate).toHaveBeenCalledTimes(2);
  });

  it('ignores foreign and merely inactive items', () => {
    const { hooks, deactivate } = setup();
    const pool = new ObjectPool(hooks, 1, 1);
    const foreign: PooledItem = { serial: 99, value: 'foreign', active: true };

    pool.release(foreign);

    expect(deactivate).not.toHaveBeenCalled();
    expect(foreign.active).toBe(true);
    expect(pool.totalCount).toBe(1);
  });

  it('clears all active items once and preserves allocated capacity for reuse', () => {
    const { hooks, create, deactivate } = setup();
    const pool = new ObjectPool(hooks, 0, 3);
    const first = pool.acquire({ value: 'a' });
    const second = pool.acquire({ value: 'b' });
    pool.acquire({ value: 'c' });

    expect(pool.isActive(first!)).toBe(true);
    expect(pool.isActive(second!)).toBe(true);
    pool.clear();
    pool.clear();

    expect(deactivate).toHaveBeenCalledTimes(3);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(3);
    pool.acquire({ value: 'reused' });
    expect(create).toHaveBeenCalledTimes(3);
  });
});

describe('named pools', () => {
  it.each([
    ['ProjectilePool', ProjectilePool],
    ['EnemyPool', EnemyPool],
  ] as const)('%s shares ObjectPool behavior without a duplicated contract', (_name, Pool) => {
    const { hooks, create, deactivate } = setup();
    const pool = new Pool<PooledItem, Init>(hooks, 1, 1);
    expect(pool).toBeInstanceOf(ObjectPool);

    const item = pool.acquire({ value: 'active' });
    expect(item?.active).toBe(true);
    expect(pool.acquire({ value: 'blocked' })).toBeNull();
    pool.release(item!);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(pool.acquire({ value: 'reused' })).toBe(item);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
