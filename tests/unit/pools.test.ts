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

  it('rejects duplicate identities during initial preallocation', () => {
    const duplicate: PooledItem = { serial: 1, value: '', active: false };
    const hooks: PoolHooks<PooledItem, Init> = {
      create: vi.fn(() => duplicate),
      activate: vi.fn(),
      deactivate: vi.fn(),
    };

    expect(() => new ObjectPool(hooks, 2, 2)).toThrow(
      'ObjectPool invariant violation: hooks.create() returned a duplicate item identity',
    );
    expect(hooks.create).toHaveBeenCalledTimes(2);
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

  it('rejects an active identity returned again during growth without changing counts', () => {
    const duplicate: PooledItem = { serial: 1, value: '', active: false };
    const hooks: PoolHooks<PooledItem, Init> = {
      create: vi.fn(() => duplicate),
      activate: vi.fn((item) => {
        item.active = true;
      }),
      deactivate: vi.fn(),
    };
    const pool = new ObjectPool(hooks, 1, 2);
    const active = pool.acquire({ value: 'active' });

    expect(() => pool.acquire({ value: 'duplicate' })).toThrow(
      'ObjectPool invariant violation: hooks.create() returned a duplicate item identity',
    );
    expect(active).toBe(duplicate);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
    expect(pool.maxSize).toBe(2);
    expect(pool.isActive(duplicate)).toBe(true);
  });

  it('rejects an inactive identity returned during reentrant growth without corrupting reuse', () => {
    const duplicate: PooledItem = { serial: 1, value: '', active: false };
    const poolRef: { current?: ObjectPool<PooledItem, Init> } = {};
    let createCount = 0;
    const hooks: PoolHooks<PooledItem, Init> = {
      create: vi.fn(() => {
        createCount += 1;
        if (createCount === 2) poolRef.current!.release(duplicate);
        return duplicate;
      }),
      activate: vi.fn((item) => {
        item.active = true;
      }),
      deactivate: vi.fn((item) => {
        item.active = false;
      }),
    };
    const pool = new ObjectPool(hooks, 1, 2);
    poolRef.current = pool;
    pool.acquire({ value: 'active' });

    expect(() => pool.acquire({ value: 'duplicate' })).toThrow(
      'ObjectPool invariant violation: hooks.create() returned a duplicate item identity',
    );
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(1);
    expect(pool.acquire({ value: 'reused' })).toBe(duplicate);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
  });

  it('reserves a new identity before activation can reenter acquisition', () => {
    const shared: PooledItem = { serial: 1, value: '', active: false };
    const poolRef: { current?: ObjectPool<PooledItem, Init> } = {};
    let shouldReenter = true;
    let concurrentActivations = 0;
    let maxConcurrentActivations = 0;
    const hooks: PoolHooks<PooledItem, Init> = {
      create: vi.fn(() => shared),
      activate: vi.fn((item, init) => {
        concurrentActivations += 1;
        maxConcurrentActivations = Math.max(maxConcurrentActivations, concurrentActivations);
        try {
          item.value = init.value;
          item.active = true;
          if (shouldReenter) {
            shouldReenter = false;
            poolRef.current!.acquire({ value: 'nested' });
          }
        } finally {
          concurrentActivations -= 1;
        }
      }),
      deactivate: vi.fn((item) => {
        item.value = '';
        item.active = false;
      }),
    };
    const pool = new ObjectPool(hooks, 0, 2);
    poolRef.current = pool;

    expect(() => pool.acquire({ value: 'outer' })).toThrow(
      'ObjectPool invariant violation: hooks.create() returned a duplicate item identity',
    );
    expect(maxConcurrentActivations).toBe(1);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(0);

    const retried = pool.acquire({ value: 'retried' });
    expect(retried).toBe(shared);
    expect(pool.isActive(shared)).toBe(true);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);

    pool.release(shared);
    expect(pool.activeCount).toBe(0);
    expect(pool.acquire({ value: 'reused' })).toBe(shared);
    expect(hooks.create).toHaveBeenCalledTimes(3);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
  });

  it('leaves state unchanged when create throws', () => {
    const createError = new Error('create failed');
    const hooks: PoolHooks<PooledItem, Init> = {
      create: vi.fn(() => {
        throw createError;
      }),
      activate: vi.fn(),
      deactivate: vi.fn(),
    };
    const pool = new ObjectPool(hooks, 0, 1);

    expect(() => pool.acquire({ value: 'failed' })).toThrow(createError);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(0);
    expect(hooks.activate).not.toHaveBeenCalled();
    expect(hooks.deactivate).not.toHaveBeenCalled();
  });

  it('cleans up and restores a reused item when activation throws, then allows retry', () => {
    const { hooks, activate, deactivate } = setup();
    const activationError = new Error('activate failed');
    activate.mockImplementationOnce((item) => {
      item.active = true;
      throw activationError;
    });
    const pool = new ObjectPool(hooks, 1, 1);

    expect(() => pool.acquire({ value: 'failed' })).toThrow(activationError);
    expect(activate).toHaveBeenCalledTimes(1);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(1);

    const retried = pool.acquire({ value: 'retried' });
    expect(retried?.serial).toBe(1);
    expect(retried?.active).toBe(true);
    expect(activate).toHaveBeenCalledTimes(2);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
  });

  it('does not adopt a newly created item when activation throws', () => {
    const { hooks, activate, deactivate, create } = setup();
    const activationError = new Error('activate failed');
    activate.mockImplementationOnce((item) => {
      item.active = true;
      throw activationError;
    });
    const pool = new ObjectPool(hooks, 0, 1);

    expect(() => pool.acquire({ value: 'failed' })).toThrow(activationError);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(0);

    const retried = pool.acquire({ value: 'retried' });
    expect(retried?.serial).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
  });

  it('aggregates activation and cleanup failures while quarantining a reused item', () => {
    let serial = 0;
    let poisoned: PooledItem | undefined;
    const activationError = new Error('activate failed');
    const cleanupError = new Error('cleanup failed');
    const create = vi.fn(() => {
      const item = { serial: ++serial, value: '', active: false };
      poisoned ??= item;
      return item;
    });
    const hooks: PoolHooks<PooledItem, Init> = {
      create,
      activate: vi
        .fn<(item: PooledItem, init: Init) => void>()
        .mockImplementationOnce(() => {
          throw activationError;
        })
        .mockImplementation((item, init) => {
          item.value = init.value;
          item.active = true;
        }),
      deactivate: vi
        .fn<(item: PooledItem) => void>()
        .mockImplementationOnce(() => {
          throw cleanupError;
        })
        .mockImplementation((item) => {
          item.value = '';
          item.active = false;
        }),
    };
    const pool = new ObjectPool(hooks, 1, 1);

    let caught: unknown;
    try {
      pool.acquire({ value: 'failed' });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toEqual([activationError, cleanupError]);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(0);
    expect(hooks.activate).toHaveBeenCalledTimes(1);
    expect(hooks.deactivate).toHaveBeenCalledTimes(1);

    const replacement = pool.acquire({ value: 'replacement' });
    expect(replacement).not.toBe(poisoned);
    expect(replacement).toEqual({ serial: 2, value: 'replacement', active: true });
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
    expect(hooks.create).toHaveBeenCalledTimes(2);
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

  it('keeps an item active when deactivation fails so release can be retried', () => {
    const { hooks, deactivate } = setup();
    const deactivationError = new Error('deactivate failed');
    deactivate.mockImplementationOnce(() => {
      throw deactivationError;
    });
    const pool = new ObjectPool(hooks, 1, 1);
    const item = pool.acquire({ value: 'active' })!;

    expect(() => pool.release(item)).toThrow(deactivationError);
    expect(pool.isActive(item)).toBe(true);
    expect(pool.activeCount).toBe(1);
    expect(pool.totalCount).toBe(1);
    expect(pool.acquire({ value: 'blocked' })).toBeNull();

    pool.release(item);
    expect(deactivate).toHaveBeenCalledTimes(2);
    expect(pool.isActive(item)).toBe(false);
    expect(pool.activeCount).toBe(0);
    expect(pool.acquire({ value: 'retried' })).toBe(item);
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

  it('continues clearing after failures, releases successes, and aggregates errors', () => {
    const { hooks, deactivate } = setup();
    const firstError = new Error('first failed');
    const thirdError = new Error('third failed');
    deactivate
      .mockImplementationOnce(() => {
        throw firstError;
      })
      .mockImplementationOnce((item) => {
        item.active = false;
      })
      .mockImplementationOnce(() => {
        throw thirdError;
      });
    const pool = new ObjectPool(hooks, 0, 3);
    const first = pool.acquire({ value: 'first' })!;
    const second = pool.acquire({ value: 'second' })!;
    const third = pool.acquire({ value: 'third' })!;

    let caught: unknown;
    try {
      pool.clear();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toEqual([firstError, thirdError]);
    expect(deactivate).toHaveBeenCalledTimes(3);
    expect(pool.isActive(first)).toBe(true);
    expect(pool.isActive(second)).toBe(false);
    expect(pool.isActive(third)).toBe(true);
    expect(pool.activeCount).toBe(2);
    expect(pool.totalCount).toBe(3);

    pool.clear();
    expect(deactivate).toHaveBeenCalledTimes(5);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(3);
  });
});

describe('named pools', () => {
  it.each([
    ['ProjectilePool', ProjectilePool],
    ['EnemyPool', EnemyPool],
  ] as const)('%s shares ObjectPool behavior without a duplicated contract', (_name, Pool) => {
    const { hooks, create, deactivate } = setup();
    const pool = new Pool<PooledItem, Init>(hooks, 1, 1);
    expect(pool.activeCount).toBe(0);
    expect(pool.totalCount).toBe(1);
    expect(pool.maxSize).toBe(1);

    const item = pool.acquire({ value: 'active' });
    expect(item?.active).toBe(true);
    expect(pool.isActive(item!)).toBe(true);
    expect(pool.activeCount).toBe(1);
    expect(pool.acquire({ value: 'blocked' })).toBeNull();
    pool.release(item!);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(pool.isActive(item!)).toBe(false);
    expect(pool.activeCount).toBe(0);
    expect(pool.acquire({ value: 'reused' })).toBe(item);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
