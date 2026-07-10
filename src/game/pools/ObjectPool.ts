export type PoolHooks<T, TInit> = {
  create(): T;
  activate(item: T, init: TInit): void;
  deactivate(item: T): void;
};

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
    let item = this.#inactive.shift();
    if (item === undefined) {
      if (this.#items.size >= this.maxSize) return null;
      item = this.#hooks.create();
      this.#items.add(item);
    }

    this.#active.add(item);
    this.#hooks.activate(item, init);
    return item;
  }

  release(item: T): void {
    if (!this.#items.has(item) || !this.#active.delete(item)) return;
    this.#hooks.deactivate(item);
    this.#inactive.push(item);
  }

  clear(): void {
    for (const item of [...this.#active]) this.release(item);
  }

  isActive(item: T): boolean {
    return this.#active.has(item);
  }
}
