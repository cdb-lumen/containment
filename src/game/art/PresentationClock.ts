/** Gameplay-driven monotonic time used exclusively by character presentation. */
export class PresentationClock {
  #elapsedMs = 0;
  #active = true;

  advance(deltaMs: number): number {
    if (!this.#active || !Number.isFinite(deltaMs) || deltaMs <= 0) {
      return this.#elapsedMs;
    }
    this.#elapsedMs = Math.min(Number.MAX_VALUE, this.#elapsedMs + deltaMs);
    return this.#elapsedMs;
  }

  suspend(): void {
    this.#active = false;
  }

  resume(): void {
    this.#active = true;
  }

  reset(): void {
    this.#elapsedMs = 0;
    this.#active = true;
  }

  snapshot(): number {
    return Number.isFinite(this.#elapsedMs) ? this.#elapsedMs : 0;
  }
}
