import { describe, expect, it } from 'vitest';

import {
  SpatialHash,
  type SpatialItem,
} from '../../src/game/enemies/SpatialHash';

type Point = { readonly id: string; x: number; y: number; label?: string };

const point = (id: string, x: number, y: number): Point => ({ id, x, y });

describe('SpatialHash', () => {
  it('publishes item IDs as readonly', () => {
    const mutateId = (item: SpatialItem): void => {
      // @ts-expect-error SpatialHash identities must not be mutated.
      item.id = 'changed';
    };

    expect(mutateId).toBeTypeOf('function');
  });

  it('validates custom cell sizes', () => {
    expect(() => new SpatialHash<Point>(0)).toThrow(RangeError);
    expect(() => new SpatialHash<Point>(-1)).toThrow(RangeError);
    expect(() => new SpatialHash<Point>(Number.NaN)).toThrow(RangeError);
    expect(() => new SpatialHash<Point>(Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
    expect(() => new SpatialHash<Point>(64)).not.toThrow();
  });

  it('finds true radius matches across same and neighboring default cells', () => {
    const hash = new SpatialHash<Point>();
    const origin = point('origin', 127, 127);
    const neighbor = point('neighbor', 129, 127);
    const far = point('far', 400, 400);
    hash.insert(origin);
    hash.insert(neighbor);
    hash.insert(far);

    expect(hash.queryRadius(128, 127, 2)).toEqual([origin, neighbor]);
  });

  it('includes exact-boundary matches and excludes points just outside', () => {
    const hash = new SpatialHash<Point>();
    const boundary = point('boundary', 3, 4);
    hash.insert(boundary);
    hash.insert(point('outside', 3, 4.001));

    expect(hash.queryRadius(0, 0, 5)).toEqual([boundary]);
  });

  it('relocates and replaces an existing ID without changing size', () => {
    const hash = new SpatialHash<Point>();
    const original = point('moving', 0, 0);
    hash.insert(original);

    original.x = 500;
    original.y = 500;
    hash.update(original);
    expect(hash.queryRadius(0, 0, 10)).toEqual([]);
    expect(hash.queryRadius(500, 500, 0)).toEqual([original]);

    const replacement = { ...point('moving', -300, -300), label: 'new' };
    hash.insert(replacement);
    expect(hash.size).toBe(1);
    expect(hash.queryRadius(500, 500, 1)).toEqual([]);
    expect(hash.queryRadius(-300, -300, 0)).toEqual([replacement]);
  });

  it('uses indexed coordinate snapshots until update relocates an item', () => {
    const hash = new SpatialHash<Point>();
    const moving = point('moving', 0, 0);
    hash.insert(moving);

    moving.x = 500;
    moving.y = 500;
    expect(hash.queryRadius(0, 0, 0)).toEqual([moving]);
    expect(hash.queryRadius(500, 500, 0)).toEqual([]);

    hash.update(moving);
    expect(hash.queryRadius(0, 0, 0)).toEqual([]);
    expect(hash.queryRadius(500, 500, 0)).toEqual([moving]);
  });

  it.each(['insert', 'update'] as const)(
    'rejects mutated owned IDs during %s and removes by the original identity',
    (method) => {
      const hash = new SpatialHash<Point>();
      const item = point('stable', 10, 20);
      hash.insert(item);
      (item as { id: string }).id = 'mutated';

      expect(() => hash[method](item)).toThrow(
        'SpatialHash invariant violation: an indexed item id was mutated',
      );
      expect(hash.size).toBe(1);
      expect(hash.queryRadius(10, 20, 0)).toEqual([item]);

      hash.remove(item);
      expect(hash.size).toBe(0);
    },
  );

  it.each([
    ['insert', point('   ', 0, 0)],
    ['update', point('', 0, 0)],
    ['insert', point('bad-x', Number.NaN, 0)],
    ['update', point('bad-x', Number.POSITIVE_INFINITY, 0)],
    ['insert', point('bad-y', 0, Number.NEGATIVE_INFINITY)],
    ['update', point('bad-y', 0, Number.NaN)],
  ] as const)('rejects malformed items in %s before mutating indexes', (method, malformed) => {
    const hash = new SpatialHash<Point>();
    const existing = point('existing', 1, 1);
    hash.insert(existing);

    expect(() => hash[method](malformed)).toThrow(RangeError);
    expect(hash.size).toBe(1);
    expect(hash.queryRadius(1, 1, 0)).toEqual([existing]);
  });

  it('treats update of an unknown ID as an insertion', () => {
    const hash = new SpatialHash<Point>();
    const item = point('new', 10, 20);

    hash.update(item);

    expect(hash.size).toBe(1);
    expect(hash.queryRadius(10, 20, 0)).toEqual([item]);
  });

  it('removes by ID or item idempotently and ignores unknown values', () => {
    const hash = new SpatialHash<Point>();
    const first = point('first', 0, 0);
    const second = point('second', 1, 1);
    hash.insert(first);
    hash.insert(second);

    hash.remove(first);
    hash.remove(first);
    hash.remove('unknown');
    expect(hash.size).toBe(1);

    hash.remove('second');
    expect(hash.size).toBe(0);
  });

  it('clears every index and can be reused', () => {
    const hash = new SpatialHash<Point>();
    const first = point('a', -1_000, 1_000);
    hash.insert(first);
    hash.insert(point('b', 1_000, -1_000));
    (first as { id: string }).id = 'reusable-after-clear';

    hash.clear();
    expect(hash.size).toBe(0);
    expect(hash.queryRadius(0, 0, 10_000)).toEqual([]);

    first.x = 2;
    first.y = 2;
    hash.insert(first);
    expect(hash.queryRadius(2, 2, 0)).toEqual([first]);
  });

  it('never returns duplicate IDs and preserves deterministic insertion order', () => {
    const hash = new SpatialHash<Point>(10);
    const first = point('first', 9, 0);
    const second = point('second', 11, 0);
    const third = point('third', -1, 0);
    hash.insert(first);
    hash.insert(second);
    hash.insert(third);
    hash.update(second);
    hash.insert(first);

    expect(hash.queryRadius(0, 0, 20)).toEqual([first, second, third]);
    expect(new Set(hash.queryRadius(0, 0, 20).map(({ id }) => id)).size).toBe(3);
  });

  it('returns no matches for malformed query inputs', () => {
    const hash = new SpatialHash<Point>();
    hash.insert(point('item', 0, 0));

    expect(hash.queryRadius(Number.NaN, 0, 1)).toEqual([]);
    expect(hash.queryRadius(0, Number.POSITIVE_INFINITY, 1)).toEqual([]);
    expect(hash.queryRadius(0, 0, -1)).toEqual([]);
    expect(hash.queryRadius(0, 0, Number.NaN)).toEqual([]);
    expect(hash.queryRadius(0, 0, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it('does not false-match huge finite opposite coordinates through overflow', () => {
    const hash = new SpatialHash<Point>();
    const far = point('far', Number.MAX_VALUE, 0);
    hash.insert(far);

    expect(hash.queryRadius(-Number.MAX_VALUE, 0, Number.MAX_VALUE)).toEqual([]);
  });
});
