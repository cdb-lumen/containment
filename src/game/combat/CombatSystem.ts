import { WEAPONS } from './catalog';
import type { WeaponId } from './types';
import { createBuild, BuildEventResolver, deriveBuildStats, isValidBuildState, type BuildEvent, type BuildResolution, type ResourceSnapshot } from '../roguelike/builds';
import { isValidRunResources } from '../roguelike/checkpoints';
import type { BuildState, RunResources } from '../roguelike/types';

const WEAPON_IDS = Object.freeze(Object.keys(WEAPONS) as WeaponId[]);
const INITIAL_WEAPON: WeaponId = 'pistol';
const INITIAL_GRENADES = 3;
const MAX_GRENADES = 6;
const GRENADE_COOLDOWN_MS = 1_200;
const INITIAL_MEDKITS = 2;
const MEDKIT_HEALING = 50;
const INITIAL_HEALTH = 100;
const INITIAL_ARMOR = 50;
const INITIAL_MAX_ARMOR = 100;

export type CombatModifiers = Readonly<{
  damageMultiplier: number;
  penetrationBonus: number;
  spreadMultiplier: number;
  reloadMultiplier: number;
  magazineMultiplier: number;
  maxArmorBonus: number;
}>;

export const DEFAULT_COMBAT_MODIFIERS: CombatModifiers = Object.freeze({
  damageMultiplier: 1,
  penetrationBonus: 0,
  spreadMultiplier: 1,
  reloadMultiplier: 1,
  magazineMultiplier: 1,
  maxArmorBonus: 0,
});

const MODIFIER_BOUNDS = Object.freeze({
  damageMultiplier: Object.freeze([0.1, 10] as const),
  penetrationBonus: Object.freeze([0, 100] as const),
  spreadMultiplier: Object.freeze([0.05, 10] as const),
  reloadMultiplier: Object.freeze([0.05, 10] as const),
  magazineMultiplier: Object.freeze([0.1, 10] as const),
  maxArmorBonus: Object.freeze([0, 1_000] as const),
});

export type ProjectileRequest = Readonly<{
  weaponId: WeaponId;
  /** Shared across pellets so mutations resolve once per shot/target. */
  mutationShotId?: string;
  primed?:boolean;
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
  magazineCapacity: number;
  reserve: number;
  reloading: boolean;
  reloadDurationMs: number;
  reloadRemainingMs: number;
  fireCooldownRemainingMs: number;
  grenades: number;
  grenadeCooldownRemainingMs: number;
  medkits: number;
  health: number;
  armor: number;
  maxArmor: number;
  dead: boolean;
  credits: number;
  wave: number;
  objective: string | null;
}>;

export type CombatListener = (snapshot: CombatSnapshot) => void;
export type ProjectileTargetId = string | number;

type WeaponAmmoState = {
  magazine: number;
  capacity: number;
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

const isBounded = (value: number, minimum: number, maximum: number): boolean =>
  Number.isFinite(value) && value >= minimum && value <= maximum;

const isValidModifiers = (modifiers: CombatModifiers): boolean =>
  isBounded(modifiers.damageMultiplier, ...MODIFIER_BOUNDS.damageMultiplier) &&
  Number.isInteger(modifiers.penetrationBonus) &&
  isBounded(modifiers.penetrationBonus, ...MODIFIER_BOUNDS.penetrationBonus) &&
  isBounded(modifiers.spreadMultiplier, ...MODIFIER_BOUNDS.spreadMultiplier) &&
  isBounded(modifiers.reloadMultiplier, ...MODIFIER_BOUNDS.reloadMultiplier) &&
  isBounded(modifiers.magazineMultiplier, ...MODIFIER_BOUNDS.magazineMultiplier) &&
  Number.isInteger(modifiers.maxArmorBonus) &&
  isBounded(modifiers.maxArmorBonus, ...MODIFIER_BOUNDS.maxArmorBonus);

const magazineCapacity = (weaponId: WeaponId, multiplier: number): number =>
  Math.ceil(WEAPONS[weaponId].magazine * multiplier);

const positiveInteger = (amount: number): number => {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const integer = Math.floor(amount);
  return Number.isSafeInteger(integer) && integer > 0 ? integer : 0;
};

const createAmmoState = (): Record<WeaponId, WeaponAmmoState> =>
  Object.fromEntries(
    WEAPON_IDS.map((weaponId) => [
      weaponId,
      {
        magazine: WEAPONS[weaponId].magazine,
        capacity: WEAPONS[weaponId].magazine,
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
  #reloadDurationMs = 0;
  #reloadRemainingMs = 0;
  #grenades = INITIAL_GRENADES;
  #grenadeCooldownRemainingMs = 0;
  #medkits = INITIAL_MEDKITS;
  #health = INITIAL_HEALTH;
  #armor = INITIAL_ARMOR;
  #modifiers = DEFAULT_COMBAT_MODIFIERS;
  #dead = false;
  #credits = 0;
  #wave = 0;
  #objective: string | null = null;
  readonly #listeners = new Set<CombatListener>();
  #supplyClock=0;
  #healListener:(()=>void)|null=null;
  onHealing(listener:(()=>void)|null){this.#healListener=listener;}
  hasMutation(id:import('../roguelike/types').MutationId){return this.#build.mutations.includes(id);}
  replenishReserves(){for(const [id,amount]of Object.entries({rifle:240,shotgun:64,plasma:140,rocket:12})){const key=id as WeaponId;this.#ammo[key].reserve=Math.max(amount,this.#ammo[key].reserve);}this.#supplyClock=0;this.#rocketSupply=0;this.#emit();}
  regenerateReserves(deltaMs:number){if(this.#dead||!Number.isFinite(deltaMs)||deltaMs<=0)return;this.#supplyClock+=deltaMs;const ticks=Math.min(5,Math.floor(this.#supplyClock/1000));if(!ticks)return;this.#supplyClock-=ticks*1000;for(const [id,rate,cap]of [['rifle',6,240],['shotgun',1,64],['plasma',3,140],['rocket',.5,12]] as const){const ammo=this.#ammo[id];if(ammo.reserve<cap){if(id==='rocket'){this.#rocketSupply+=ticks*.5;const gain=Math.floor(this.#rocketSupply);this.#rocketSupply-=gain;ammo.reserve=Math.min(cap,ammo.reserve+gain);}else ammo.reserve=Math.min(cap,ammo.reserve+ticks*rate);}}this.#emit();}
  #rocketSupply=0;
  collectAmmoPack(){for(const [id,n]of [['rifle',60],['shotgun',12],['plasma',30],['rocket',2]] as const)this.#ammo[id].reserve=Math.min(100000,this.#ammo[id].reserve+n);const id=this.nextMutationEventId('ammo-pack');this.resolveMutationEvent({id,cause:{chainId:id,depth:0},type:'pickup',kind:'ammo',resources:this.mutationResources()});this.#emit();}
  #build: BuildState = createBuild();
  #mutationState = new BuildEventResolver();
  #mutationSequence = 0;
  #cycleCharged = false;
  #cyclePrimed = false;

  setBuild(build: BuildState): boolean {
    if (!isValidBuildState(build)) return false;
    this.#build = { mutations: [...build.mutations] };
    this.#emit();
    return true;
  }

  get build(): BuildState { return { mutations: [...this.#build.mutations] }; }

  nextMutationEventId(prefix = 'event'): string {
    return `${prefix.slice(0, 32)}-${this.#mutationSequence++}`;
  }

  resetMutationEncounter(): void {
    this.#mutationState.reset();
    this.#cycleCharged = this.#cyclePrimed = false;
    // Keep IDs monotonic: in-flight requests from an old encounter cannot alias.
  }

  mutationResources(weapon: WeaponId = this.#weaponId): ResourceSnapshot {
    const ammo = this.#ammo[weapon];
    return { weapon, health: this.#health, maxHealth: INITIAL_HEALTH, armor: this.#armor,
      maxArmor: this.#maxArmor, magazine: ammo.magazine, capacity: ammo.capacity,
      reserve: ammo.reserve === Infinity ? -1 : ammo.reserve, maxReserve: 100_000 };
  }

  resolveMutationEvent(event: BuildEvent): Omit<BuildResolution, 'state'> {
    const result = this.#mutationState.resolve(this.#build, event);
    let changed = false;
    for (const command of result.commands) {
      if (command.type !== 'resources' || this.#dead) continue;
      const ammo = this.#ammo[command.weapon];
      const beforeHealth=this.#health;this.#health = Math.max(1, Math.min(INITIAL_HEALTH, this.#health + command.healthDelta));if(this.#health>beforeHealth)this.#healListener?.();
      this.#armor = Math.max(0, Math.min(this.#maxArmor, this.#armor + command.armorDelta));
      ammo.magazine = Math.max(0, Math.min(ammo.capacity, ammo.magazine + command.magazineDelta));
      if (ammo.reserve !== Infinity) ammo.reserve = Math.max(0, Math.min(100_000, ammo.reserve + command.reserveDelta));
      changed = true;
    }
    if (changed) this.#emit();
    return result;
  }

  getRunResources(): RunResources {
    return { health: this.#health, armor: this.#armor, credits: this.#credits, grenades: this.#grenades,
      medkits: this.#medkits, weapon: this.#weaponId,
      ammo: Object.fromEntries(WEAPON_IDS.map((weapon) => [weapon, {
        magazine: this.#ammo[weapon].magazine,
        reserve: this.#ammo[weapon].reserve === Infinity ? -1 : this.#ammo[weapon].reserve,
      }])) as RunResources['ammo'] };
  }

  /** Atomic restoration: restore upgrade modifiers first if capacities were upgraded. */
  restoreRunResources(value: unknown): boolean {
    if (!isValidRunResources(value) || value.health > INITIAL_HEALTH || value.armor > this.#maxArmor ||
      value.grenades > MAX_GRENADES || WEAPON_IDS.some((weapon) => value.ammo[weapon].magazine > this.#ammo[weapon].capacity)) return false;
    this.#supplyClock=0;this.#rocketSupply=0;
    this.#health = value.health;
    this.#armor = value.armor;
    this.#credits = value.credits;
    this.#grenades = value.grenades;
    this.#medkits = value.medkits;
    this.#weaponId = value.weapon;
    for (const weapon of WEAPON_IDS) {
      this.#ammo[weapon].magazine = value.ammo[weapon].magazine;
      this.#ammo[weapon].reserve = value.ammo[weapon].reserve === -1 ? Infinity : value.ammo[weapon].reserve;
      this.#ammo[weapon].cooldownRemainingMs = 0;
    }
    this.#dead = value.health === 0;
    this.#grenadeCooldownRemainingMs = 0;
    this.#cancelReload();
    this.resetMutationEncounter();
    this.#emit();
    return true;
  }

  get snapshot(): CombatSnapshot {
    return this.getSnapshot();
  }

  get modifiers(): CombatModifiers {
    return this.#modifiers;
  }

  getSnapshot(): CombatSnapshot {
    const ammo = this.#ammo[this.#weaponId];
    return Object.freeze({
      weaponId: this.#weaponId,
      magazine: ammo.magazine,
      magazineCapacity: ammo.capacity,
      reserve: ammo.reserve,
      reloading: this.#reloading,
      reloadDurationMs: this.#reloadDurationMs,
      reloadRemainingMs: this.#reloadRemainingMs,
      fireCooldownRemainingMs: ammo.cooldownRemainingMs,
      grenades: this.#grenades,
      grenadeCooldownRemainingMs: this.#grenadeCooldownRemainingMs,
      medkits: this.#medkits,
      health: this.#health,
      armor: this.#armor,
      maxArmor: this.#maxArmor,
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

  setModifiers(modifiers: Partial<CombatModifiers>): boolean {
    if (
      typeof modifiers !== 'object' ||
      modifiers === null ||
      Array.isArray(modifiers)
    ) {
      return false;
    }

    const next: CombatModifiers = {
      damageMultiplier: Object.hasOwn(modifiers, 'damageMultiplier')
        ? modifiers.damageMultiplier!
        : this.#modifiers.damageMultiplier,
      penetrationBonus: Object.hasOwn(modifiers, 'penetrationBonus')
        ? modifiers.penetrationBonus!
        : this.#modifiers.penetrationBonus,
      spreadMultiplier: Object.hasOwn(modifiers, 'spreadMultiplier')
        ? modifiers.spreadMultiplier!
        : this.#modifiers.spreadMultiplier,
      reloadMultiplier: Object.hasOwn(modifiers, 'reloadMultiplier')
        ? modifiers.reloadMultiplier!
        : this.#modifiers.reloadMultiplier,
      magazineMultiplier: Object.hasOwn(modifiers, 'magazineMultiplier')
        ? modifiers.magazineMultiplier!
        : this.#modifiers.magazineMultiplier,
      maxArmorBonus: Object.hasOwn(modifiers, 'maxArmorBonus')
        ? modifiers.maxArmorBonus!
        : this.#modifiers.maxArmorBonus,
    };
    if (!isValidModifiers(next)) return false;

    const keys = Object.keys(DEFAULT_COMBAT_MODIFIERS) as (keyof CombatModifiers)[];
    if (keys.every((key) => next[key] === this.#modifiers[key])) return true;

    for (const weaponId of WEAPON_IDS) {
      const ammo = this.#ammo[weaponId];
      const nextCapacity = magazineCapacity(weaponId, next.magazineMultiplier);
      const gainedCapacity = Math.max(0, nextCapacity - ammo.capacity);
      ammo.magazine =
        gainedCapacity > 0
          ? Math.min(nextCapacity, ammo.magazine + gainedCapacity)
          : Math.min(nextCapacity, ammo.magazine);
      ammo.capacity = nextCapacity;
    }

    const previousMaxArmor = this.#maxArmor;
    const nextMaxArmor = INITIAL_MAX_ARMOR + next.maxArmorBonus;
    this.#armor =
      nextMaxArmor > previousMaxArmor
        ? Math.min(nextMaxArmor, this.#armor + nextMaxArmor - previousMaxArmor)
        : Math.min(nextMaxArmor, this.#armor);
    this.#modifiers = Object.freeze(next);
    this.#emit();
    return true;
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
    const spreadRadians = weapon.spreadRadians * this.#modifiers.spreadMultiplier;
    const stats = deriveBuildStats(this.#build, this.#weaponId);
    const mutationShotId = this.nextMutationEventId('shot');
    const cyclePrimed=this.hasMutation('magnetic-feed')&&this.#cyclePrimed;
    const resolution = this.resolveMutationEvent({ id: mutationShotId, cause: { chainId: mutationShotId, depth: 0 },
      type: 'shot', weapon: this.#weaponId, magazineBefore: ammo.magazine });
    const reloadBonus = resolution.commands.reduce((factor, command) => command.type === 'shot-bonus' ? factor * command.damageMultiplier : factor, 1);
    const shotBonus = reloadBonus * (cyclePrimed ? 1.5 : 1);
    const primed = shotBonus > 1;
    this.#cyclePrimed = false;
    this.#cycleCharged = this.hasMutation('magnetic-feed') && !primed;
    ammo.magazine -= 1;
    ammo.cooldownRemainingMs = 1_000 / weapon.roundsPerSecond * stats.shotIntervalMultiplier;

    const requests = Array.from({ length: weapon.pellets }, (_, index) => {
      const spreadOffset =
        weapon.pellets === 1
          ? 0
          : -spreadRadians / 2 +
            (spreadRadians * index) / (weapon.pellets - 1);
      return Object.freeze({
        weaponId: this.#weaponId,
        mutationShotId,...(primed?{primed:true}:{}),
        damage: weapon.damage * this.#modifiers.damageMultiplier * stats.projectileDamageMultiplier * shotBonus,
        speed: weapon.projectileSpeed,
        radius: weapon.projectileRadius,
        angle: aimAngle + spreadOffset,
        penetration: weapon.penetration + this.#modifiers.penetrationBonus + stats.penetrationBonus,
        splashRadius: weapon.splashRadius,
        knockback: weapon.knockback,
      });
    });

    this.#emit();
    return Object.freeze(requests);
  }

  /** Called by the play loop, so empty magazines reload even after Fire lifts. */
  reloadIfEmpty(): boolean {
    return this.#ammo[this.#weaponId].magazine === 0 && this.startReload();
  }

  startReload(): boolean {
    const ammo = this.#ammo[this.#weaponId];
    const weapon = WEAPONS[this.#weaponId];
    if (
      this.#dead ||
      this.#reloading ||
      ammo.magazine >= ammo.capacity ||
      ammo.reserve <= 0
    ) {
      return false;
    }

    this.#reloading = true;
    this.#reloadDurationMs = weapon.reloadMs * this.#modifiers.reloadMultiplier * deriveBuildStats(this.#build, this.#weaponId).reloadDurationMultiplier;
    this.#reloadRemainingMs = this.#reloadDurationMs;
    this.#emit();
    return true;
  }

  switchWeapon(weaponId: WeaponId): boolean {
    if (!isWeaponId(weaponId) || weaponId === this.#weaponId) return false;

    this.#cancelReload();
    if(this.hasMutation('magnetic-feed') && this.#cycleCharged){this.#cyclePrimed=true;this.#cycleCharged=false;}
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

    amount *= deriveBuildStats(this.#build, this.#weaponId).incomingDamageMultiplier;
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
    this.#mutationHeal(MEDKIT_HEALING);
    this.#emit();
    return true;
  }

  restoreHealth(amount: number): number {
    const reward = positiveInteger(amount);
    if (this.#dead || reward === 0) return 0;

    const restored = Math.min(reward, INITIAL_HEALTH - this.#health);
    this.#health += restored;if(restored>0)this.#healListener?.();
    this.#mutationHeal(reward);
    this.#emit();
    return restored;
  }

  restoreArmor(amount: number): number {
    const reward = positiveInteger(amount);
    if (this.#dead || reward === 0 || this.#armor >= this.#maxArmor) return 0;

    const restored = Math.min(reward, this.#maxArmor - this.#armor);
    this.#armor += restored;
    this.#emit();
    return restored;
  }

  addReserveAmmo(amount: number): number {
    const reward = positiveInteger(amount);
    const ammo = this.#ammo[this.#weaponId];
    if (
      this.#dead ||
      reward === 0 ||
      (ammo.reserve !== Infinity && !Number.isSafeInteger(ammo.reserve + reward))
    ) {
      return 0;
    }

    const added = ammo.reserve === Infinity ? 0 : Math.min(reward, 100_000 - ammo.reserve);
    if (ammo.reserve !== Infinity) ammo.reserve += added;
    const id = this.nextMutationEventId('pickup');
    this.resolveMutationEvent({ id, cause: { chainId: id, depth: 0 }, type: 'pickup', kind: 'ammo', resources: this.mutationResources() });
    this.#emit();
    return added;
  }

  addGrenades(amount: number): number {
    const reward = positiveInteger(amount);
    if (this.#dead || reward === 0 || this.#grenades >= MAX_GRENADES) return 0;

    const added = Math.min(reward, MAX_GRENADES - this.#grenades);
    this.#grenades += added;
    this.#emit();
    return added;
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
    this.#supplyClock=0;this.#rocketSupply=0;
    this.#weaponId = INITIAL_WEAPON;
    this.#ammo = createAmmoState();
    this.#reloading = false;
    this.#reloadDurationMs = 0;
    this.#reloadRemainingMs = 0;
    this.#grenades = INITIAL_GRENADES;
    this.#grenadeCooldownRemainingMs = 0;
    this.#medkits = INITIAL_MEDKITS;
    this.#health = INITIAL_HEALTH;
    this.#armor = INITIAL_ARMOR;
    this.#modifiers = DEFAULT_COMBAT_MODIFIERS;
    this.#dead = false;
    this.#credits = 0;
    this.#wave = 0;
    this.#objective = null;
    this.#build = createBuild();
    this.resetMutationEncounter();
    this.#emit();
  }

  get #maxArmor(): number {
    return INITIAL_MAX_ARMOR + this.#modifiers.maxArmorBonus;
  }

  #completeReload(): void {
    const ammo = this.#ammo[this.#weaponId];
    const missingRounds = ammo.capacity - ammo.magazine;
    const transferred =
      ammo.reserve === Number.POSITIVE_INFINITY
        ? missingRounds
        : Math.min(missingRounds, ammo.reserve);
    ammo.magazine += transferred;
    if (ammo.reserve !== Number.POSITIVE_INFINITY) ammo.reserve -= transferred;
    const id = this.nextMutationEventId('reload');
    this.resolveMutationEvent({ id, cause: { chainId: id, depth: 0 }, type: 'reload', weapon: this.#weaponId, roundsLoaded: transferred });
    this.#reloading = false;
    this.#reloadDurationMs = 0;
    this.#reloadRemainingMs = 0;
  }

  #mutationHeal(amount: number): void {
    const id = this.nextMutationEventId('heal');
    this.resolveMutationEvent({ id, cause: { chainId: id, depth: 0 }, type: 'heal', amount, resources: this.mutationResources() });
  }

  #cancelReload(): void {
    this.#reloading = false;
    this.#reloadDurationMs = 0;
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
