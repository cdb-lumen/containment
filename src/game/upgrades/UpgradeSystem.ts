import { UPGRADES, type UpgradeId } from './catalog';

export const DEFAULT_ARMORY_DURATION_MS = 10_000;

const UPGRADE_IDS = Object.freeze(Object.keys(UPGRADES) as UpgradeId[]);
const MAX_FINITE_VALUE = Number.MAX_SAFE_INTEGER;

export type UpgradeLevels = Readonly<Record<UpgradeId, number>>;

export type UpgradeModifiers = Readonly<{
  damageMultiplier: number;
  penetrationBonus: number;
  spreadMultiplier: number;
  reloadMultiplier: number;
  magazineMultiplier: number;
  movementMultiplier: number;
  maxArmorBonus: number;
  pickupValueMultiplier: number;
  pickupMagnetEnabled: boolean;
}>;

export type UpgradeOffer = Readonly<{
  id: UpgradeId;
  level: number;
  nextLevel: number;
  maxLevel: number;
  cost: number;
  affordable: boolean;
}>;

export type ArmoryContext =
  | string
  | number
  | Readonly<{
      seed?: string | number;
      round?: number;
      armoryId?: string | number;
    }>;

export type ArmorySnapshot = Readonly<{
  open: boolean;
  armoryId: string | null;
  credits: number;
  elapsedMs: number;
  durationMs: number;
  offers: readonly UpgradeOffer[];
}>;

export type UpgradeSnapshot = Readonly<{
  levels: UpgradeLevels;
  modifiers: UpgradeModifiers;
  armory: ArmorySnapshot;
}>;

export type PurchaseFailureReason =
  | 'armory-closed'
  | 'invalid-id'
  | 'invalid-credits'
  | 'max-level'
  | 'not-offered'
  | 'insufficient-credits';

export type PurchaseResult =
  | Readonly<{
      purchased: true;
      reason: 'purchased';
      upgradeId: UpgradeId;
      level: number;
      spent: number;
      remainingCredits: number;
    }>
  | Readonly<{
      purchased: false;
      reason: PurchaseFailureReason;
      spent: 0;
      remainingCredits: number;
    }>;

export type AutomaticResolution =
  | Readonly<{
      automatic: true;
      purchased: true;
      reason: 'purchased';
      upgradeId: UpgradeId;
      level: number;
      spent: number;
      remainingCredits: number;
    }>
  | Readonly<{
      automatic: true;
      purchased: false;
      reason: 'armory-closed' | 'no-affordable-offer';
      spent: 0;
      remainingCredits: number;
    }>;

export type UpgradeSystemOptions = Readonly<{
  armoryDurationMs?: number;
}>;

export type UpgradeListener = (snapshot: UpgradeSnapshot) => void;

const frozenEmptyOffers = Object.freeze([]) as readonly UpgradeOffer[];

const createZeroLevels = (): Record<UpgradeId, number> => ({
  damage: 0,
  penetration: 0,
  spread: 0,
  reload: 0,
  magazine: 0,
  movement: 0,
  armor: 0,
  pickup: 0,
});

const isUpgradeId = (value: unknown): value is UpgradeId =>
  typeof value === 'string' && Object.hasOwn(UPGRADES, value);

const isValidCredits = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const boundedFinite = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(MAX_FINITE_VALUE, value);
};

const boundedResult = (value: number): number =>
  Number.isFinite(value) ? Math.min(MAX_FINITE_VALUE, Math.max(0, value)) : MAX_FINITE_VALUE;

const hashString = (value: string): number => {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

const contextParts = (context: ArmoryContext): Readonly<{
  id: string;
  seed: string;
  round: number;
}> => {
  if (typeof context === 'object' && context !== null) {
    const seed = String(context.seed ?? context.armoryId ?? 'default');
    const rawRound = context.round;
    const round = Number.isSafeInteger(rawRound) && (rawRound ?? 0) >= 0 ? rawRound! : 0;
    return Object.freeze({
      id: String(context.armoryId ?? `${seed}:${round}`),
      seed,
      round,
    });
  }
  const value = String(context);
  return Object.freeze({ id: value, seed: value, round: 0 });
};

const freezeOffer = (offer: UpgradeOffer): UpgradeOffer => Object.freeze(offer);

export class UpgradeSystem {
  readonly #durationMs: number;
  readonly #listeners = new Set<UpgradeListener>();
  #levels: Record<UpgradeId, number> = createZeroLevels();
  #creditsValid = true;
  #armory: ArmorySnapshot;

  constructor(options: UpgradeSystemOptions = {}) {
    const requestedDuration = options.armoryDurationMs;
    this.#durationMs =
      typeof requestedDuration === 'number' &&
      Number.isFinite(requestedDuration) &&
      requestedDuration > 0
        ? Math.min(MAX_FINITE_VALUE, requestedDuration)
        : DEFAULT_ARMORY_DURATION_MS;
    this.#armory = this.#closedArmory(0);
  }

  get levels(): UpgradeLevels {
    return Object.freeze({ ...this.#levels });
  }

  get modifiers(): UpgradeModifiers {
    const levels = this.#levels;
    return Object.freeze({
      damageMultiplier: 1 + levels.damage * UPGRADES.damage.value,
      penetrationBonus: levels.penetration * UPGRADES.penetration.value,
      spreadMultiplier: Math.max(0.2, 1 - levels.spread * UPGRADES.spread.value),
      reloadMultiplier: Math.max(0.25, 1 - levels.reload * UPGRADES.reload.value),
      magazineMultiplier: 1 + levels.magazine * UPGRADES.magazine.value,
      movementMultiplier: 1 + levels.movement * UPGRADES.movement.value,
      maxArmorBonus: levels.armor * UPGRADES.armor.value,
      pickupValueMultiplier: 1 + levels.pickup * UPGRADES.pickup.value,
      pickupMagnetEnabled: levels.pickup > 0,
    });
  }

  get armory(): ArmorySnapshot {
    return this.#armory;
  }

  get snapshot(): UpgradeSnapshot {
    return Object.freeze({
      levels: this.levels,
      modifiers: this.modifiers,
      armory: this.#armory,
    });
  }

  beginArmory(credits: number, context: ArmoryContext = 'default'): ArmorySnapshot {
    if (this.#armory.open) return this.#armory;

    this.#creditsValid = isValidCredits(credits);
    const safeCredits = this.#creditsValid ? credits : 0;
    const parts = contextParts(context);
    const eligible = UPGRADE_IDS.filter(
      (id) => this.#levels[id] < UPGRADES[id].maxLevel,
    );
    const affordable = eligible.filter(
      (id) => this.#costAtLevel(id, this.#levels[id]) <= safeCredits,
    );
    const locked = eligible.filter((id) => !affordable.includes(id));
    const selected =
      affordable.length >= 3
        ? this.#selectOffers(affordable, parts.seed, parts.round, 3)
        : [
            ...this.#selectOffers(
              affordable,
              parts.seed,
              parts.round,
              affordable.length,
            ),
            ...this.#selectOffers(
              locked,
              `${parts.seed}:locked`,
              parts.round,
              3 - affordable.length,
            ),
          ];
    const offers = Object.freeze(
      selected.map((id) => {
        const level = this.#levels[id];
        const cost = this.#costAtLevel(id, level);
        return freezeOffer({
          id,
          level,
          nextLevel: level + 1,
          maxLevel: UPGRADES[id].maxLevel,
          cost,
          affordable: this.#creditsValid && cost <= safeCredits,
        });
      }),
    );

    this.#armory = Object.freeze({
      open: true,
      armoryId: parts.id,
      credits: safeCredits,
      elapsedMs: 0,
      durationMs: this.#durationMs,
      offers,
    });
    this.#notify();
    return this.#armory;
  }

  purchase(id: UpgradeId): PurchaseResult {
    if (!isUpgradeId(id)) return this.#failure('invalid-id');
    if (!this.#armory.open) return this.#failure('armory-closed');
    if (!this.#creditsValid) return this.#failure('invalid-credits');
    if (this.#levels[id] >= UPGRADES[id].maxLevel) return this.#failure('max-level');

    const offer = this.#armory.offers.find((candidate) => candidate.id === id);
    if (!offer) return this.#failure('not-offered');
    if (offer.cost > this.#armory.credits) return this.#failure('insufficient-credits');

    const remainingCredits = this.#armory.credits - offer.cost;
    const level = this.#levels[id] + 1;
    this.#levels = { ...this.#levels, [id]: level };
    this.#armory = this.#closedArmory(remainingCredits);
    const result: PurchaseResult = Object.freeze({
      purchased: true,
      reason: 'purchased',
      upgradeId: id,
      level,
      spent: offer.cost,
      remainingCredits,
    });
    this.#notify();
    return result;
  }

  select(id: UpgradeId): PurchaseResult {
    return this.purchase(id);
  }

  update(deltaMs: number): AutomaticResolution | null {
    if (
      !this.#armory.open ||
      !Number.isFinite(deltaMs) ||
      deltaMs < 0
    ) {
      return null;
    }
    const elapsedMs = Math.min(
      this.#durationMs,
      boundedResult(this.#armory.elapsedMs + deltaMs),
    );
    if (elapsedMs >= this.#durationMs) return this.timeout();

    this.#armory = Object.freeze({ ...this.#armory, elapsedMs });
    this.#notify();
    return null;
  }

  timeout(): AutomaticResolution {
    if (!this.#armory.open) {
      return Object.freeze({
        automatic: true,
        purchased: false,
        reason: 'armory-closed',
        spent: 0,
        remainingCredits: this.#armory.credits,
      });
    }

    const offer = this.#armory.offers.find(({ affordable }) => affordable);
    if (!offer) {
      const remainingCredits = this.#armory.credits;
      this.#armory = this.#closedArmory(remainingCredits);
      this.#notify();
      return Object.freeze({
        automatic: true,
        purchased: false,
        reason: 'no-affordable-offer',
        spent: 0,
        remainingCredits,
      });
    }

    const purchased = this.purchase(offer.id);
    if (!purchased.purchased) {
      const remainingCredits = this.#armory.credits;
      this.#armory = this.#closedArmory(remainingCredits);
      this.#notify();
      return Object.freeze({
        automatic: true,
        purchased: false,
        reason: 'no-affordable-offer',
        spent: 0,
        remainingCredits,
      });
    }
    return Object.freeze({ ...purchased, automatic: true });
  }

  reset(): void {
    this.#levels = createZeroLevels();
    this.#creditsValid = true;
    this.#armory = this.#closedArmory(0);
    this.#notify();
  }

  subscribe(listener: UpgradeListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  applyDamage(baseDamage: number): number {
    return this.#multiply(baseDamage, this.modifiers.damageMultiplier);
  }

  applyPenetration(basePenetration: number): number {
    const base = Math.floor(boundedFinite(basePenetration));
    return Math.floor(boundedResult(base + this.modifiers.penetrationBonus));
  }

  applySpread(baseSpread: number): number {
    return this.#multiply(baseSpread, this.modifiers.spreadMultiplier);
  }

  applyReloadDuration(baseDurationMs: number): number {
    return this.#multiply(baseDurationMs, this.modifiers.reloadMultiplier);
  }

  applyReload(baseDurationMs: number): number {
    return this.applyReloadDuration(baseDurationMs);
  }

  applyMagazineCapacity(baseCapacity: number): number {
    const base = boundedFinite(baseCapacity);
    return Math.ceil(boundedResult(base * this.modifiers.magazineMultiplier));
  }

  applyMagazine(baseCapacity: number): number {
    return this.applyMagazineCapacity(baseCapacity);
  }

  applyMovementSpeed(baseSpeed: number): number {
    return this.#multiply(baseSpeed, this.modifiers.movementMultiplier);
  }

  applyMovement(baseSpeed: number): number {
    return this.applyMovementSpeed(baseSpeed);
  }

  applySpeed(baseSpeed: number): number {
    return this.applyMovementSpeed(baseSpeed);
  }

  applyMaxArmor(baseMaxArmor: number): number {
    return boundedResult(boundedFinite(baseMaxArmor) + this.modifiers.maxArmorBonus);
  }

  applyArmor(baseMaxArmor: number): number {
    return this.applyMaxArmor(baseMaxArmor);
  }

  applyPickupValue(baseValue: number): number {
    return this.#multiply(baseValue, this.modifiers.pickupValueMultiplier);
  }

  #multiply(baseValue: number, multiplier: number): number {
    return boundedResult(boundedFinite(baseValue) * multiplier);
  }

  #failure(reason: PurchaseFailureReason): PurchaseResult {
    return Object.freeze({
      purchased: false,
      reason,
      spent: 0,
      remainingCredits: this.#armory.credits,
    });
  }

  #costAtLevel(id: UpgradeId, level: number): number {
    const definition = UPGRADES[id];
    const escalated = Math.round(
      definition.cost * definition.costMultiplier ** level,
    );
    return Math.max(1, Math.min(MAX_FINITE_VALUE, escalated));
  }

  #selectOffers(
    pool: readonly UpgradeId[],
    seed: string,
    round: number,
    count: number,
  ): UpgradeId[] {
    if (pool.length === 0) return [];
    const ordered = [...pool].sort((left, right) => {
      const leftHash = hashString(`${seed}:${left}`);
      const rightHash = hashString(`${seed}:${right}`);
      return leftHash - rightHash || left.localeCompare(right);
    });
    const start = (hashString(seed) + round) % ordered.length;
    const selected: UpgradeId[] = [];
    for (let index = 0; index < Math.min(count, ordered.length); index += 1) {
      selected.push(ordered[(start + index) % ordered.length]);
    }
    return selected;
  }

  #closedArmory(credits: number): ArmorySnapshot {
    return Object.freeze({
      open: false,
      armoryId: null,
      credits,
      elapsedMs: 0,
      durationMs: this.#durationMs,
      offers: frozenEmptyOffers,
    });
  }

  #notify(): void {
    const snapshot = this.snapshot;
    for (const listener of [...this.#listeners]) {
      try {
        listener(snapshot);
      } catch {
        // Listener failures must not interrupt deterministic state changes.
      }
    }
  }
}
