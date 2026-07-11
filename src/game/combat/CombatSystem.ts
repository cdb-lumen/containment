import { WEAPONS } from './catalog';
import type { WeaponId } from './types';

const WEAPON_IDS = Object.freeze(Object.keys(WEAPONS) as WeaponId[]);
const INITIAL_WEAPON: WeaponId = 'pistol';
const INITIAL_GRENADES = 3;
const GRENADE_COOLDOWN_MS = 1_200;
const INITIAL_MEDKITS = 2;
const MEDKIT_HEALING = 50;
const INITIAL_HEALTH = 100;
const INITIAL_ARMOR = 50;

export type ProjectileRequest = Readonly<{
  weaponId: WeaponId;
  damage: number;
  speed: number;
  radius: number;
  angle: number;
  penetration: number;
  splashRadius: number;
  knockback: number;
}>;

export type GrenadeThrowRequest = Readonly<{
  angle: number;
  damage: number;
  splashRadius: number;
  knockback: number;
  speed: number;
}>;

export type DamageResult = Readonly<{
  absorbedByArmor: number;
  healthDamage: number;
  died: boolean;
}>;

export type ProjectileHitResult = Readonly<{
  applied: boolean;
  remainingPenetration: number;
  exhausted: boolean;
}>;

export type CombatSnapshot = Readonly<{
  weaponId: WeaponId;
  magazine: number;
  reserve: number;
  reloading: boolean;
  reloadRemainingMs: number;
  fireCooldownRemainingMs: number;
  grenades: number;
  grenadeCooldownRemainingMs: number;
  medkits: number;
  health: number;
  armor: number;
  dead: boolean;
  credits: number;
  wave: number;
  objective: string | null;
}>;

export type CombatListener = (snapshot: CombatSnapshot) => void;
export type ProjectileTargetId = string | number;

type WeaponAmmoState = {
  magazine: number;
  reserve: number;
  cooldownRemainingMs: number;
};

const noDamage = (): DamageResult =>
  Object.freeze({ absorbedByArmor: 0, healthDamage: 0, died: false });

const hitResult = (
  applied: boolean,
  remainingPenetration: number,
): ProjectileHitResult =>
  Object.freeze({
    applied,
    remainingPenetration,
    exhausted: remainingPenetration === 0,
  });

const isWeaponId = (value: unknown): value is WeaponId =>
  typeof value === 'string' && Object.hasOwn(WEAPONS, value);

const createAmmoState = (): Record<WeaponId, WeaponAmmoState> =>
  Object.fromEntries(
    WEAPON_IDS.map((weaponId) => [
      weaponId,
      {
        magazine: WEAPONS[weaponId].magazine,
        reserve: WEAPONS[weaponId].reserve,
        cooldownRemainingMs: 0,
      },
    ]),
  ) as Record<WeaponId, WeaponAmmoState>;

/**
 * Calculates linear splash falloff. Invalid, negative, or out-of-range input
 * cannot produce damage.
 */
export const calculateSplashDamage = (
  baseDamage: number,
  distance: number,
  radius: number,
): number => {
  if (
    !Number.isFinite(baseDamage) ||
    !Number.isFinite(distance) ||
    !Number.isFinite(radius) ||
    baseDamage < 0 ||
    distance < 0 ||
    radius <= 0 ||
    distance >= radius
  ) {
    return 0;
  }

  return Math.max(0, baseDamage * (1 - distance / radius));
};

/** Tracks unique targets for one projectile without engine object coupling. */
export class ProjectileHitTracker {
  readonly #hitTargets = new Set<ProjectileTargetId>();
  #remainingPenetration: number;

  constructor(penetration: number) {
    this.#remainingPenetration =
      Number.isFinite(penetration) && penetration > 0
        ? Math.floor(penetration)
        : 0;
  }

  get remainingPenetration(): number {
    return this.#remainingPenetration;
  }

  hit(targetId: ProjectileTargetId): ProjectileHitResult {
    if (
      this.#remainingPenetration === 0 ||
      this.#hitTargets.has(targetId)
    ) {
      return hitResult(false, this.#remainingPenetration);
    }

    this.#hitTargets.add(targetId);
    this.#remainingPenetration -= 1;
    return hitResult(true, this.#remainingPenetration);
  }
}

/** Framework-free, deterministic state owner for player combat. */
export class CombatSystem {
  #weaponId: WeaponId = INITIAL_WEAPON;
  #ammo = createAmmoState();
  #reloading = false;
  #reloadRemainingMs = 0;
  #grenades = INITIAL_GRENADES;
  #grenadeCooldownRemainingMs = 0;
  #medkits = INITIAL_MEDKITS;
  #health = INITIAL_HEALTH;
  #armor = INITIAL_ARMOR;
  #dead = false;
  #credits = 0;
  #wave = 0;
  #objective: string | null = null;
  readonly #listeners = new Set<CombatListener>();

  get snapshot(): CombatSnapshot {
    return this.getSnapshot();
  }

  getSnapshot(): CombatSnapshot {
    const ammo = this.#ammo[this.#weaponId];
    return Object.freeze({
      weaponId: this.#weaponId,
      magazine: ammo.magazine,
      reserve: ammo.reserve,
      reloading: this.#reloading,
      reloadRemainingMs: this.#reloadRemainingMs,
      fireCooldownRemainingMs: ammo.cooldownRemainingMs,
      grenades: this.#grenades,
      grenadeCooldownRemainingMs: this.#grenadeCooldownRemainingMs,
      medkits: this.#medkits,
      health: this.#health,
      armor: this.#armor,
      dead: this.#dead,
      credits: this.#credits,
      wave: this.#wave,
      objective: this.#objective,
    });
  }

  subscribe(listener: CombatListener): () => void {
    this.#listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.#listeners.delete(listener);
    };
  }

  update(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) return;

    let changed = false;
    for (const weaponId of WEAPON_IDS) {
      const ammo = this.#ammo[weaponId];
      if (ammo.cooldownRemainingMs > 0 && deltaMs > 0) {
        ammo.cooldownRemainingMs = Math.max(
          0,
          ammo.cooldownRemainingMs - deltaMs,
        );
        changed = true;
      }
    }

    if (this.#grenadeCooldownRemainingMs > 0 && deltaMs > 0) {
      this.#grenadeCooldownRemainingMs = Math.max(
        0,
        this.#grenadeCooldownRemainingMs - deltaMs,
      );
      changed = true;
    }

    if (this.#reloading && deltaMs > 0) {
      this.#reloadRemainingMs = Math.max(0, this.#reloadRemainingMs - deltaMs);
      changed = true;
      if (this.#reloadRemainingMs === 0) this.#completeReload();
    }

    if (changed) this.#emit();
  }

  fire(aimAngle: number): readonly ProjectileRequest[] {
    const ammo = this.#ammo[this.#weaponId];
    if (
      !Number.isFinite(aimAngle) ||
      this.#dead ||
      this.#reloading ||
      ammo.cooldownRemainingMs > 0 ||
      ammo.magazine === 0
    ) {
      return Object.freeze([]);
    }

    const weapon = WEAPONS[this.#weaponId];
    ammo.magazine -= 1;
    ammo.cooldownRemainingMs = 1_000 / weapon.roundsPerSecond;

    const requests = Array.from({ length: weapon.pellets }, (_, index) => {
      const spreadOffset =
        weapon.pellets === 1
          ? 0
          : -weapon.spreadRadians / 2 +
            (weapon.spreadRadians * index) / (weapon.pellets - 1);
      return Object.freeze({
        weaponId: this.#weaponId,
        damage: weapon.damage,
        speed: weapon.projectileSpeed,
        radius: weapon.projectileRadius,
        angle: aimAngle + spreadOffset,
        penetration: weapon.penetration,
        splashRadius: weapon.splashRadius,
        knockback: weapon.knockback,
      });
    });

    this.#emit();
    return Object.freeze(requests);
  }

  startReload(): boolean {
    const ammo = this.#ammo[this.#weaponId];
    const weapon = WEAPONS[this.#weaponId];
    if (
      this.#dead ||
      this.#reloading ||
      ammo.magazine >= weapon.magazine ||
      ammo.reserve <= 0
    ) {
      return false;
    }

    this.#reloading = true;
    this.#reloadRemainingMs = weapon.reloadMs;
    this.#emit();
    return true;
  }

  switchWeapon(weaponId: WeaponId): boolean {
    if (!isWeaponId(weaponId) || weaponId === this.#weaponId) return false;

    this.#cancelReload();
    this.#weaponId = weaponId;
    this.#emit();
    return true;
  }

  throwGrenade(aimAngle: number): GrenadeThrowRequest | null {
    if (
      !Number.isFinite(aimAngle) ||
      this.#dead ||
      this.#grenades === 0 ||
      this.#grenadeCooldownRemainingMs > 0
    ) {
      return null;
    }

    this.#grenades -= 1;
    this.#grenadeCooldownRemainingMs = GRENADE_COOLDOWN_MS;
    const request = Object.freeze({
      angle: aimAngle,
      damage: 100,
      splashRadius: 120,
      knockback: 80,
      speed: 420,
    });
    this.#emit();
    return request;
  }

  applyDamage(amount: number): DamageResult {
    if (!Number.isFinite(amount) || amount <= 0 || this.#dead) return noDamage();

    const absorbedByArmor = Math.min(this.#armor, amount);
    this.#armor = Math.max(0, this.#armor - absorbedByArmor);
    const healthDamage = Math.min(this.#health, amount - absorbedByArmor);
    this.#health = Math.max(0, this.#health - healthDamage);
    const died = this.#health === 0;
    if (died) {
      this.#dead = true;
      this.#cancelReload();
    }

    const result = Object.freeze({ absorbedByArmor, healthDamage, died });
    this.#emit();
    return result;
  }

  consumeMedkit(): boolean {
    if (
      this.#dead ||
      this.#medkits === 0 ||
      this.#health >= INITIAL_HEALTH
    ) {
      return false;
    }

    this.#medkits -= 1;
    this.#health = Math.min(INITIAL_HEALTH, this.#health + MEDKIT_HEALING);
    this.#emit();
    return true;
  }

  setCredits(credits: number): boolean {
    const nextCredits = Math.floor(credits);
    if (credits < 0 || !Number.isSafeInteger(nextCredits)) return false;
    if (nextCredits !== this.#credits) {
      this.#credits = nextCredits;
      this.#emit();
    }
    return true;
  }

  setWave(wave: number): boolean {
    const nextWave = Math.floor(wave);
    if (wave < 0 || !Number.isSafeInteger(nextWave)) return false;
    if (nextWave !== this.#wave) {
      this.#wave = nextWave;
      this.#emit();
    }
    return true;
  }

  setObjective(objective: string | null): boolean {
    if (objective !== null && typeof objective !== 'string') return false;
    const nextObjective = objective?.trim() || null;
    if (nextObjective !== this.#objective) {
      this.#objective = nextObjective;
      this.#emit();
    }
    return true;
  }

  reset(): void {
    this.#weaponId = INITIAL_WEAPON;
    this.#ammo = createAmmoState();
    this.#reloading = false;
    this.#reloadRemainingMs = 0;
    this.#grenades = INITIAL_GRENADES;
    this.#grenadeCooldownRemainingMs = 0;
    this.#medkits = INITIAL_MEDKITS;
    this.#health = INITIAL_HEALTH;
    this.#armor = INITIAL_ARMOR;
    this.#dead = false;
    this.#credits = 0;
    this.#wave = 0;
    this.#objective = null;
    this.#emit();
  }

  #completeReload(): void {
    const ammo = this.#ammo[this.#weaponId];
    const missingRounds = WEAPONS[this.#weaponId].magazine - ammo.magazine;
    const transferred =
      ammo.reserve === Number.POSITIVE_INFINITY
        ? missingRounds
        : Math.min(missingRounds, ammo.reserve);
    ammo.magazine += transferred;
    if (ammo.reserve !== Number.POSITIVE_INFINITY) ammo.reserve -= transferred;
    this.#reloading = false;
    this.#reloadRemainingMs = 0;
  }

  #cancelReload(): void {
    this.#reloading = false;
    this.#reloadRemainingMs = 0;
  }

  #emit(): void {
    for (const listener of [...this.#listeners]) {
      try {
        listener(this.getSnapshot());
      } catch {
        // A display adapter cannot be allowed to interrupt combat state changes.
      }
    }
  }
}
