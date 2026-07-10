export type PoolHooks<T, TInit> = {
  create(): T;
  activate(item: T, init: TInit): void;
  deactivate(item: T): void;
};

const DUPLICATE_IDENTITY_ERROR =
  'ObjectPool invariant violation: hooks.create() returned a duplicate item identity';

const assertPoolSize = (value: number, name: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a nonnegative safe integer`);
  }
};

export class ObjectPool<T, TInit> {
  readonly #hooks: PoolHooks<T, TInit>;
  readonly #items = new Set<T>();
  readonly #inactive: T[] = [];
  readonly #active = new Set<T>();
  readonly maxSize: number;

  constructor(hooks: PoolHooks<T, TInit>, initialSize: number, maxSize: number) {
    assertPoolSize(initialSize, 'initialSize');
    assertPoolSize(maxSize, 'maxSize');
    if (maxSize < initialSize) {
      throw new RangeError('maxSize must be greater than or equal to initialSize');
    }

    this.#hooks = hooks;
    this.maxSize = maxSize;
    for (let index = 0; index < initialSize; index += 1) {
      const item = hooks.create();
      this.#assertUnique(item);
      this.#items.add(item);
      this.#inactive.push(item);
    }
  }

  get activeCount(): number {
    return this.#active.size;
  }

  get totalCount(): number {
    return this.#items.size;
  }

  acquire(init: TInit): T | null {
    let item: T;
    let reused = false;

    if (this.#inactive.length > 0) {
      item = this.#inactive.pop() as T;
      reused = true;
    } else {
      if (this.#items.size >= this.maxSize) return null;
      item = this.#hooks.create();
      this.#assertUnique(item);
    }

    try {
      this.#hooks.activate(item, init);
    } catch (activationError) {
      let cleanupError: unknown;
      let cleanupFailed = false;
      try {
        this.#hooks.deactivate(item);
      } catch (error) {
        cleanupError = error;
        cleanupFailed = true;
      }

      if (reused) {
        if (cleanupFailed) {
          this.#items.delete(item);
        } else {
          this.#inactive.push(item);
        }
      }
      if (cleanupFailed) {
        throw new AggregateError(
          [activationError, cleanupError],
          'ObjectPool activation and cleanup both failed',
          { cause: activationError },
        );
      }
      throw activationError;
    }

    if (!reused) this.#items.add(item);
    this.#active.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.#items.has(item) || !this.#active.has(item)) return;
    this.#hooks.deactivate(item);
    this.#active.delete(item);
    this.#inactive.push(item);
  }

  clear(): void {
    const errors: unknown[] = [];
    for (const item of [...this.#active]) {
      try {
        this.release(item);
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'ObjectPool clear failed to deactivate every item');
    }
  }

  isActive(item: T): boolean {
    return this.#active.has(item);
  }

  #assertUnique(item: T): void {
    if (this.#items.has(item)) throw new Error(DUPLICATE_IDENTITY_ERROR);
  }
}
