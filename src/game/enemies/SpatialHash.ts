export type SpatialItem = { readonly id: string; x: number; y: number };

type Entry<T> = {
  item: T;
  cellKey: string;
  x: number;
  y: number;
  order: number;
};

const MUTATED_ID_ERROR =
  'SpatialHash invariant violation: an indexed item id was mutated';

export class SpatialHash<T extends SpatialItem> {
  readonly #cellSize: number;
  readonly #entries = new Map<string, Entry<T>>();
  readonly #cells = new Map<string, Set<string>>();
  #identityIds = new WeakMap<T, string>();
  #nextOrder = 0;

  constructor(cellSize = 128) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) {
      throw new RangeError('cellSize must be a positive finite number');
    }
    this.#cellSize = cellSize;
  }

  get size(): number {
    return this.#entries.size;
  }

  /** Coordinate mutations are not indexed until this method or update() is called. */
  insert(item: T): void {
    this.#assertValidItem(item);
    const stableId = this.#identityIds.get(item);
    if (stableId !== undefined && stableId !== item.id) {
      throw new Error(MUTATED_ID_ERROR);
    }

    const existing = this.#entries.get(item.id);
    const cellKey = this.#cellKey(item.x, item.y);
    if (existing) {
      this.#removeFromCell(item.id, existing.cellKey);
      if (existing.item !== item) this.#identityIds.delete(existing.item);
      existing.item = item;
      existing.cellKey = cellKey;
      existing.x = item.x;
      existing.y = item.y;
      this.#identityIds.set(item, item.id);
      this.#addToCell(item.id, cellKey);
      return;
    }

    this.#entries.set(item.id, {
      item,
      cellKey,
      x: item.x,
      y: item.y,
      order: this.#nextOrder++,
    });
    this.#identityIds.set(item, item.id);
    this.#addToCell(item.id, cellKey);
  }

  /** Re-indexes the item's current finite coordinates. */
  update(item: T): void {
    this.insert(item);
  }

  remove(idOrItem: string | T): void {
    const id =
      typeof idOrItem === 'string'
        ? idOrItem
        : (this.#identityIds.get(idOrItem) ?? idOrItem.id);
    const entry = this.#entries.get(id);
    if (!entry) return;

    this.#removeFromCell(id, entry.cellKey);
    this.#entries.delete(id);
    this.#identityIds.delete(entry.item);
  }

  queryRadius(x: number, y: number, radius: number): T[] {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(radius) ||
      radius < 0
    ) {
      return [];
    }

    const minCellX = Math.floor((x - radius) / this.#cellSize);
    const maxCellX = Math.floor((x + radius) / this.#cellSize);
    const minCellY = Math.floor((y - radius) / this.#cellSize);
    const maxCellY = Math.floor((y + radius) / this.#cellSize);
    const cellCount = (maxCellX - minCellX + 1) * (maxCellY - minCellY + 1);
    const candidateIds = new Set<string>();

    if (!Number.isSafeInteger(cellCount) || cellCount > this.#cells.size * 4 + 16) {
      for (const id of this.#entries.keys()) candidateIds.add(id);
    } else {
      for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
          const cell = this.#cells.get(`${cellX},${cellY}`);
          if (!cell) continue;
          for (const id of cell) candidateIds.add(id);
        }
      }
    }

    return [...candidateIds]
      .map((id) => this.#entries.get(id))
      .filter((entry): entry is Entry<T> => {
        if (!entry) return false;
        return Math.hypot(entry.x - x, entry.y - y) <= radius;
      })
      .sort((left, right) => left.order - right.order)
      .map(({ item }) => item);
  }

  clear(): void {
    this.#entries.clear();
    this.#cells.clear();
    this.#identityIds = new WeakMap<T, string>();
    this.#nextOrder = 0;
  }

  #assertValidItem(item: T): void {
    if (typeof item.id !== 'string' || item.id.trim().length === 0) {
      throw new RangeError('SpatialHash item id must be a nonempty, non-whitespace string');
    }
    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) {
      throw new RangeError('SpatialHash item coordinates must be finite numbers');
    }
  }

  #cellKey(x: number, y: number): string {
    return `${Math.floor(x / this.#cellSize)},${Math.floor(y / this.#cellSize)}`;
  }

  #addToCell(id: string, cellKey: string): void {
    let cell = this.#cells.get(cellKey);
    if (!cell) {
      cell = new Set<string>();
      this.#cells.set(cellKey, cell);
    }
    cell.add(id);
  }

  #removeFromCell(id: string, cellKey: string): void {
    const cell = this.#cells.get(cellKey);
    if (!cell) return;
    cell.delete(id);
    if (cell.size === 0) this.#cells.delete(cellKey);
  }
}
