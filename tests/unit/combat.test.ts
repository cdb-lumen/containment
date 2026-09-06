import { describe, expect, it } from 'vitest';

import { WEAPONS } from '../../src/game/combat/catalog';
import {
  calculateSplashDamage,
  CombatSystem,
  DEFAULT_COMBAT_MODIFIERS,
  ProjectileHitTracker,
} from '../../src/game/combat/CombatSystem';
import type { WeaponId } from '../../src/game/combat/types';

const cadenceMs = (weaponId: WeaponId): number =>
  1_000 / WEAPONS[weaponId].roundsPerSecond;

const emptyCurrentMagazine = (combat: CombatSystem): void => {
  const { weaponId, magazine } = combat.snapshot;
  for (let shot = 0; shot < magazine; shot += 1) {
    expect(combat.fire(0)).toHaveLength(WEAPONS[weaponId].pellets);
    combat.update(cadenceMs(weaponId));
  }
};

const completeReload = (combat: CombatSystem): void => {
  const weaponId = combat.snapshot.weaponId;
  expect(combat.startReload()).toBe(true);
  combat.update(WEAPONS[weaponId].reloadMs);
};

describe('CombatSystem firing', () => {
  it('enforces cadence and decrements the magazine exactly once per trigger pull', () => {
    const combat = new CombatSystem();

    const first = combat.fire(Math.PI / 3);
    expect(first).toEqual([
      {
        weaponId: 'pistol',
        mutationShotId: 'shot-0',
        damage: WEAPONS.pistol.damage,
        speed: WEAPONS.pistol.projectileSpeed,
        radius: WEAPONS.pistol.projectileRadius,
        angle: Math.PI / 3,
        penetration: WEAPONS.pistol.penetration,
        splashRadius: WEAPONS.pistol.splashRadius,
        knockback: WEAPONS.pistol.knockback,
      },
    ]);
    expect(combat.snapshot.magazine).toBe(WEAPONS.pistol.magazine - 1);
    expect(combat.snapshot.fireCooldownRemainingMs).toBe(cadenceMs('pistol'));

    expect(combat.fire(Math.PI / 3)).toEqual([]);
    expect(combat.snapshot.magazine).toBe(WEAPONS.pistol.magazine - 1);
    combat.update(cadenceMs('pistol') - 1);
    expect(combat.fire(Math.PI / 3)).toEqual([]);
    combat.update(1);
    expect(combat.fire(Math.PI / 3)).toHaveLength(1);
    expect(combat.snapshot.magazine).toBe(WEAPONS.pistol.magazine - 2);
  });

  it('does not auto-reload an empty magazine', () => {
    const combat = new CombatSystem();
    emptyCurrentMagazine(combat);

    expect(combat.snapshot.magazine).toBe(0);
    expect(combat.snapshot.reloading).toBe(false);
    expect(combat.fire(0)).toEqual([]);
    expect(combat.snapshot.reloading).toBe(false);
  });

  it('creates exactly eight deterministic symmetric shotgun pellets with bounded gaps', () => {
    const combat = new CombatSystem();
    expect(combat.switchWeapon('shotgun')).toBe(true);

    const pellets = combat.fire(1);
    expect(pellets).toHaveLength(8);
    expect(pellets.every(({ weaponId }) => weaponId === 'shotgun')).toBe(true);
    const angles = pellets.map(({ angle }) => angle);
    expect(angles[0]).toBeCloseTo(1 - WEAPONS.shotgun.spreadRadians / 2, 12);
    expect(angles.at(-1)).toBeCloseTo(1 + WEAPONS.shotgun.spreadRadians / 2, 12);
    for (let index = 0; index < angles.length; index += 1) {
      expect(angles[index] + angles[angles.length - 1 - index]).toBeCloseTo(2, 12);
      if (index > 0) {
        const gap = angles[index] - angles[index - 1];
        expect(gap).toBeGreaterThan(WEAPONS.shotgun.spreadRadians / 7 * .79);
        expect(gap).toBeLessThan(WEAPONS.shotgun.spreadRadians / 7 * 1.21);
      }
    }
    expect(combat.snapshot.magazine).toBe(WEAPONS.shotgun.magazine - 1);
  });
});

describe('CombatSystem reload and weapon state', () => {
  it('reloads the pistol without decrementing its infinite reserve', () => {
    const combat = new CombatSystem();
    combat.fire(0);
    expect(combat.startReload()).toBe(true);
    combat.update(WEAPONS.pistol.reloadMs);

    expect(combat.snapshot.magazine).toBe(WEAPONS.pistol.magazine);
    expect(combat.snapshot.reserve).toBe(Number.POSITIVE_INFINITY);
    expect(combat.snapshot.reloading).toBe(false);
    expect(combat.snapshot.reloadRemainingMs).toBe(0);
  });

  it('transfers only available finite reserve rounds on reload', () => {
    const combat = new CombatSystem();
    combat.switchWeapon('rifle');

    for (let shot = 0; shot < 5; shot += 1) {
      combat.fire(0);
      combat.update(cadenceMs('rifle'));
    }
    completeReload(combat);
    expect(combat.snapshot.magazine).toBe(WEAPONS.rifle.magazine);
    expect(combat.snapshot.reserve).toBe(55);

    emptyCurrentMagazine(combat);
    completeReload(combat);
    expect(combat.snapshot.reserve).toBe(25);

    emptyCurrentMagazine(combat);
    completeReload(combat);
    expect(combat.snapshot.magazine).toBe(25);
    expect(combat.snapshot.reserve).toBe(0);
    expect(combat.startReload()).toBe(false);
  });

  it('honors reload duration and cancels reload only on an actual swap or death', () => {
    const combat = new CombatSystem();
    combat.fire(0);
    expect(combat.startReload()).toBe(true);
    combat.update(WEAPONS.pistol.reloadMs - 1);
    expect(combat.snapshot).toMatchObject({ reloading: true, reloadRemainingMs: 1 });

    expect(combat.fire(0)).toEqual([]);
    expect(combat.snapshot.reloading).toBe(true);
    combat.update(1);
    expect(combat.snapshot.reloading).toBe(false);
    expect(combat.snapshot.magazine).toBe(WEAPONS.pistol.magazine);

    combat.fire(0);
    combat.startReload();
    expect(combat.switchWeapon('rifle')).toBe(true);
    expect(combat.snapshot).toMatchObject({
      weaponId: 'rifle',
      reloading: false,
      reloadRemainingMs: 0,
    });

    combat.fire(0);
    combat.startReload();
    expect(combat.switchWeapon('rifle')).toBe(false);
    expect(combat.snapshot.reloading).toBe(true);
    combat.applyDamage(1_000);
    expect(combat.snapshot).toMatchObject({
      dead: true,
      reloading: false,
      reloadRemainingMs: 0,
    });
  });

  it('preserves independent weapon ammo and cooldown state across swaps', () => {
    const combat = new CombatSystem();
    combat.fire(0);
    const pistolCooldown = combat.snapshot.fireCooldownRemainingMs;
    combat.switchWeapon('rifle');
    combat.fire(0);

    expect(combat.snapshot.magazine).toBe(WEAPONS.rifle.magazine - 1);
    combat.switchWeapon('pistol');
    expect(combat.snapshot.magazine).toBe(WEAPONS.pistol.magazine - 1);
    expect(combat.snapshot.fireCooldownRemainingMs).toBe(pistolCooldown);
  });
});

describe('CombatSystem upgrade modifiers', () => {
  it('starts with frozen defaults and exposes current capacity bounds', () => {
    const combat = new CombatSystem();

    expect(DEFAULT_COMBAT_MODIFIERS).toEqual({
      damageMultiplier: 1,
      penetrationBonus: 0,
      spreadMultiplier: 1,
      reloadMultiplier: 1,
      magazineMultiplier: 1,
      maxArmorBonus: 0,
    });
    expect(Object.isFrozen(DEFAULT_COMBAT_MODIFIERS)).toBe(true);
    expect(combat.modifiers).toBe(DEFAULT_COMBAT_MODIFIERS);
    expect(combat.snapshot).toMatchObject({
      magazineCapacity: WEAPONS.pistol.magazine,
      maxArmor: 100,
    });
  });

  it('applies damage, integer penetration, centered spread, and reload timing', () => {
    const combat = new CombatSystem();
    combat.switchWeapon('shotgun');

    expect(
      combat.setModifiers({
        damageMultiplier: 1.5,
        penetrationBonus: 2,
        spreadMultiplier: 0.5,
        reloadMultiplier: 0.5,
        magazineMultiplier: 1.5,
        maxArmorBonus: 20,
      }),
    ).toBe(true);
    expect(combat.snapshot).toMatchObject({
      magazine: 12,
      magazineCapacity: 12,
      armor: 70,
      maxArmor: 120,
    });

    const pellets = combat.fire(1);
    expect(pellets).toHaveLength(WEAPONS.shotgun.pellets);
    expect(pellets.every(({ damage }) => damage === WEAPONS.shotgun.damage * 1.5)).toBe(
      true,
    );
    expect(pellets.every(({ penetration }) => penetration === 3)).toBe(true);
    expect(pellets[0].angle).toBeCloseTo(
      1 - (WEAPONS.shotgun.spreadRadians * 0.5) / 2,
      12,
    );
    expect(pellets.at(-1)?.angle).toBeCloseTo(
      1 + (WEAPONS.shotgun.spreadRadians * 0.5) / 2,
      12,
    );
    for (let index = 0; index < pellets.length; index += 1) {
      expect(pellets[index].angle + pellets[pellets.length - 1 - index].angle).toBeCloseTo(
        2,
        12,
      );
    }

    combat.update(cadenceMs('shotgun'));
    expect(combat.startReload()).toBe(true);
    expect(combat.snapshot.reloadRemainingMs).toBe(WEAPONS.shotgun.reloadMs * 0.5);
    combat.update(WEAPONS.shotgun.reloadMs * 0.5);
    expect(combat.snapshot).toMatchObject({
      magazine: 12,
      magazineCapacity: 12,
      reloading: false,
    });
  });

  it('recalculates every magazine from the catalog base, grants only gains, and clamps shrinkage', () => {
    const combat = new CombatSystem();
    combat.fire(0);
    combat.update(cadenceMs('pistol'));
    combat.fire(0);
    expect(combat.snapshot.magazine).toBe(10);

    expect(combat.setModifiers({ magazineMultiplier: 1.5 })).toBe(true);
    expect(combat.snapshot).toMatchObject({ magazine: 16, magazineCapacity: 18 });
    combat.switchWeapon('rifle');
    expect(combat.snapshot).toMatchObject({ magazine: 45, magazineCapacity: 45 });
    combat.switchWeapon('rocket');
    expect(combat.snapshot).toMatchObject({ magazine: 2, magazineCapacity: 2 });

    expect(combat.setModifiers({ magazineMultiplier: 1 })).toBe(true);
    expect(combat.snapshot).toMatchObject({ magazine: 1, magazineCapacity: 1 });
    combat.switchWeapon('pistol');
    expect(combat.snapshot).toMatchObject({
      magazine: WEAPONS.pistol.magazine,
      magazineCapacity: WEAPONS.pistol.magazine,
    });
    combat.switchWeapon('rifle');
    expect(combat.snapshot).toMatchObject({
      magazine: WEAPONS.rifle.magazine,
      magazineCapacity: WEAPONS.rifle.magazine,
    });
  });

  it('grants only newly gained armor capacity and safely clamps a later reduction', () => {
    const combat = new CombatSystem();

    expect(combat.setModifiers({ maxArmorBonus: 20 })).toBe(true);
    expect(combat.snapshot).toMatchObject({ armor: 70, maxArmor: 120 });
    expect(combat.restoreArmor(1_000)).toBe(50);
    expect(combat.snapshot.armor).toBe(120);
    expect(combat.setModifiers({ maxArmorBonus: 40 })).toBe(true);
    expect(combat.snapshot).toMatchObject({ armor: 140, maxArmor: 140 });
    expect(combat.setModifiers({ maxArmorBonus: 0 })).toBe(true);
    expect(combat.snapshot).toMatchObject({ armor: 100, maxArmor: 100 });
  });

  it('rejects malformed or incoherent modifier sets atomically without publishing', () => {
    const combat = new CombatSystem();
    let publications = 0;
    combat.subscribe(() => {
      publications += 1;
    });

    expect(combat.setModifiers({ damageMultiplier: 1.25 })).toBe(true);
    expect(publications).toBe(1);
    const validState = combat.snapshot;
    const validModifiers = combat.modifiers;

    const malformed = [
      { damageMultiplier: Number.NaN },
      { penetrationBonus: 1.5 },
      { penetrationBonus: -1 },
      { spreadMultiplier: 0 },
      { reloadMultiplier: Number.POSITIVE_INFINITY },
      { magazineMultiplier: -1 },
      { maxArmorBonus: Number.MAX_VALUE },
      { maxArmorBonus: 2.5 },
    ];
    for (const modifiers of malformed) {
      expect(combat.setModifiers(modifiers)).toBe(false);
      expect(combat.snapshot).toEqual(validState);
      expect(combat.modifiers).toBe(validModifiers);
    }
    expect(publications).toBe(1);

    expect(combat.setModifiers({ damageMultiplier: 1.25 })).toBe(true);
    expect(publications).toBe(1);
  });
});

describe('projectile helpers', () => {
  it('counts plasma penetration once per unique target and reports exhaustion', () => {
    const tracker = new ProjectileHitTracker(WEAPONS.plasma.penetration);

    expect(tracker.hit('alien-a')).toEqual({
      applied: true,
      remainingPenetration: 2,
      exhausted: false,
    });
    expect(tracker.hit('alien-a')).toEqual({
      applied: false,
      remainingPenetration: 2,
      exhausted: false,
    });
    expect(tracker.hit('alien-b').applied).toBe(true);
    expect(tracker.hit('alien-c')).toEqual({
      applied: true,
      remainingPenetration: 0,
      exhausted: true,
    });
    expect(tracker.hit('alien-d')).toEqual({
      applied: false,
      remainingPenetration: 0,
      exhausted: true,
    });
    expect(tracker.hit('alien-b').applied).toBe(false);
  });

  it('calculates bounded linear splash damage and rejects malformed values', () => {
    expect(calculateSplashDamage(120, 0, 100)).toBe(120);
    expect(calculateSplashDamage(120, 25, 100)).toBe(90);
    expect(calculateSplashDamage(120, 50, 100)).toBe(60);
    expect(calculateSplashDamage(120, 99, 100)).toBeCloseTo(1.2, 12);
    expect(calculateSplashDamage(120, 100, 100)).toBe(0);
    expect(calculateSplashDamage(120, 101, 100)).toBe(0);

    const malformedInputs: ReadonlyArray<readonly [number, number, number]> = [
      [Number.NaN, 0, 100],
      [120, Number.NaN, 100],
      [120, 0, Number.POSITIVE_INFINITY],
      [-1, 0, 100],
      [120, -1, 100],
      [120, 0, 0],
      [120, 0, -1],
    ];
    for (const args of malformedInputs) {
      const result = calculateSplashDamage(...args);
      expect(result).toBe(0);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('CombatSystem consumables and survivability', () => {
  it('throws three grenades at a fixed cadence and decrements once per success', () => {
    const combat = new CombatSystem();

    const first = combat.throwGrenade(Math.PI / 4);
    expect(first).toEqual({
      angle: Math.PI / 4,
      damage: 100,
      splashRadius: 120,
      knockback: 80,
      speed: 420,
    });
    expect(combat.snapshot).toMatchObject({
      grenades: 2,
      grenadeCooldownRemainingMs: 1_200,
    });
    expect(combat.throwGrenade(Math.PI / 4)).toBeNull();
    expect(combat.snapshot.grenades).toBe(2);

    combat.update(1_199);
    expect(combat.throwGrenade(0)).toBeNull();
    combat.update(1);
    expect(combat.throwGrenade(0)).not.toBeNull();
    combat.update(1_200);
    expect(combat.throwGrenade(0)).not.toBeNull();
    expect(combat.snapshot.grenades).toBe(0);
    combat.update(1_200);
    expect(combat.throwGrenade(0)).toBeNull();
  });

  it('consumes armor before health, clamps damage, and marks death once', () => {
    const combat = new CombatSystem();

    expect(combat.applyDamage(30)).toEqual({
      absorbedByArmor: 30,
      healthDamage: 0,
      died: false,
    });
    expect(combat.snapshot).toMatchObject({ armor: 20, health: 100, dead: false });
    expect(combat.applyDamage(50)).toEqual({
      absorbedByArmor: 20,
      healthDamage: 30,
      died: false,
    });
    expect(combat.snapshot).toMatchObject({ armor: 0, health: 70, dead: false });
    expect(combat.applyDamage(1_000)).toEqual({
      absorbedByArmor: 0,
      healthDamage: 70,
      died: true,
    });
    expect(combat.snapshot).toMatchObject({ armor: 0, health: 0, dead: true });
    expect(combat.applyDamage(10)).toEqual({
      absorbedByArmor: 0,
      healthDamage: 0,
      died: false,
    });
    expect(combat.fire(0)).toEqual([]);
    expect(combat.throwGrenade(0)).toBeNull();
  });

  it('uses medkits only while alive and injured, with bounded healing', () => {
    const combat = new CombatSystem();

    expect(combat.consumeMedkit()).toBe(false);
    expect(combat.snapshot.medkits).toBe(2);
    combat.applyDamage(70);
    expect(combat.snapshot.health).toBe(80);
    expect(combat.consumeMedkit()).toBe(true);
    expect(combat.snapshot).toMatchObject({ health: 100, medkits: 1 });
    expect(combat.consumeMedkit()).toBe(false);
    expect(combat.snapshot.medkits).toBe(1);
    combat.applyDamage(1_000);
    expect(combat.consumeMedkit()).toBe(false);
    expect(combat.snapshot.medkits).toBe(1);
  });

  it('applies explicit pickup rewards with caps, integerization, and finite reserve safety', () => {
    const combat = new CombatSystem();
    combat.applyDamage(80);
    expect(combat.snapshot).toMatchObject({ health: 70, armor: 0 });

    expect(combat.restoreHealth(15.9)).toBe(15);
    expect(combat.restoreHealth(100)).toBe(15);
    expect(combat.restoreHealth(1)).toBe(0);
    expect(combat.restoreArmor(12.9)).toBe(12);
    expect(combat.restoreArmor(1_000)).toBe(88);
    expect(combat.snapshot).toMatchObject({ health: 100, armor: 100, maxArmor: 100 });

    expect(combat.addReserveAmmo(20)).toBe(0);
    expect(combat.snapshot.reserve).toBe(Number.POSITIVE_INFINITY);
    combat.switchWeapon('rifle');
    expect(combat.addReserveAmmo(10.9)).toBe(10);
    expect(combat.snapshot.reserve).toBe(WEAPONS.rifle.reserve + 10);

    expect(combat.addGrenades(10)).toBe(3);
    expect(combat.snapshot.grenades).toBe(6);
    expect(combat.addGrenades(1)).toBe(0);
  });

  it('rejects malformed pickup values and all rewards after death without events or corruption', () => {
    const combat = new CombatSystem();
    let publications = 0;
    combat.subscribe(() => {
      publications += 1;
    });
    const initial = combat.snapshot;

    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.MAX_VALUE,
      -1,
      0,
      0.5,
    ]) {
      expect(combat.restoreHealth(value)).toBe(0);
      expect(combat.restoreArmor(value)).toBe(0);
      expect(combat.addReserveAmmo(value)).toBe(0);
      expect(combat.addGrenades(value)).toBe(0);
    }
    expect(combat.snapshot).toEqual(initial);
    expect(publications).toBe(0);

    combat.applyDamage(1_000);
    const dead = combat.snapshot;
    const afterDeathPublication = publications;
    expect(combat.restoreHealth(10)).toBe(0);
    expect(combat.restoreArmor(10)).toBe(0);
    expect(combat.addReserveAmmo(10)).toBe(0);
    expect(combat.addGrenades(1)).toBe(0);
    expect(combat.snapshot).toEqual(dead);
    expect(publications).toBe(afterDeathPublication);
  });
});

describe('CombatSystem state boundary', () => {
  it('resets every run resource, weapon state, timer, and HUD field', () => {
    const combat = new CombatSystem();
    combat.fire(0);
    combat.switchWeapon('rifle');
    combat.fire(0);
    combat.startReload();
    combat.throwGrenade(0);
    combat.applyDamage(70);
    combat.consumeMedkit();
    combat.setCredits(900);
    combat.setWave(6);
    combat.setObjective('Contain the queen');
    combat.setModifiers({
      damageMultiplier: 2,
      magazineMultiplier: 2,
      maxArmorBonus: 40,
    });

    combat.reset();
    expect(combat.snapshot).toEqual({
      weaponId: 'pistol',
      magazine: WEAPONS.pistol.magazine,
      magazineCapacity: WEAPONS.pistol.magazine,
      reserve: Number.POSITIVE_INFINITY,
      reloading: false,
      reloadDurationMs: 0,
      reloadRemainingMs: 0,
      fireCooldownRemainingMs: 0,
      bloomRadians: 0,
      grenades: 3,
      grenadeCooldownRemainingMs: 0,
      medkits: 2,
      health: 100,
      armor: 50,
      maxArmor: 100,
      dead: false,
      credits: 0,
      wave: 0,
      objective: null,
    });
    combat.switchWeapon('rifle');
    expect(combat.snapshot).toMatchObject({
      magazine: WEAPONS.rifle.magazine,
      magazineCapacity: WEAPONS.rifle.magazine,
      reserve: WEAPONS.rifle.reserve,
      fireCooldownRemainingMs: 0,
      bloomRadians: 0,
    });
    expect(combat.modifiers).toBe(DEFAULT_COMBAT_MODIFIERS);
  });

  it('returns fresh frozen snapshots that cannot corrupt internal state', () => {
    const combat = new CombatSystem();
    const first = combat.snapshot;
    const second = combat.snapshot;

    expect(first).not.toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(() => {
      (first as unknown as { health: number }).health = -100;
    }).toThrow(TypeError);
    expect(() => {
      (first as unknown as { weaponId: string }).weaponId = 'rocket';
    }).toThrow(TypeError);
    expect(combat.snapshot).toMatchObject({ health: 100, weaponId: 'pistol' });
  });

  it('publishes frozen fresh state after mutations, isolates listener errors, and unsubscribes', () => {
    const combat = new CombatSystem();
    const observed: Array<ReturnType<typeof combat.getSnapshot>> = [];
    combat.subscribe(() => {
      throw new Error('broken HUD');
    });
    const unsubscribe = combat.subscribe((snapshot) => {
      observed.push(snapshot);
    });

    expect(() => combat.fire(0)).not.toThrow();
    expect(observed).toHaveLength(1);
    expect(observed[0]).toMatchObject({ magazine: 11 });
    expect(Object.isFrozen(observed[0])).toBe(true);
    expect(observed[0]).not.toBe(combat.snapshot);

    combat.reset();
    expect(observed).toHaveLength(2);
    expect(observed[1]).toMatchObject({ magazine: 12, health: 100 });
    unsubscribe();
    unsubscribe();
    combat.setCredits(10);
    expect(observed).toHaveLength(2);
  });

  it('updates validated HUD integration fields and ignores malformed numeric input', () => {
    const combat = new CombatSystem();
    combat.setCredits(42.9);
    combat.setWave(3.8);
    combat.setObjective('  Reach the armory  ');
    expect(combat.snapshot).toMatchObject({
      credits: 42,
      wave: 3,
      objective: 'Reach the armory',
    });

    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_VALUE,
      -1,
    ]) {
      expect(combat.setCredits(value)).toBe(false);
      expect(combat.setWave(value)).toBe(false);
    }
    expect(combat.setObjective('   ')).toBe(true);
    expect(combat.snapshot.objective).toBeNull();
  });

  it('exposes the effective upgraded reload duration for accurate HUD progress', () => {
    const combat = new CombatSystem();
    expect(
      combat.setModifiers({
        ...DEFAULT_COMBAT_MODIFIERS,
        reloadMultiplier: 0.65,
      }),
    ).toBe(true);
    expect(combat.fire(0)).toHaveLength(1);
    expect(combat.startReload()).toBe(true);

    const effectiveDuration = WEAPONS.pistol.reloadMs * 0.65;
    expect(combat.snapshot).toMatchObject({
      reloading: true,
      reloadDurationMs: effectiveDuration,
      reloadRemainingMs: effectiveDuration,
    });
    combat.update(effectiveDuration / 2);
    expect(combat.snapshot.reloadRemainingMs).toBe(effectiveDuration / 2);
  });

  it('ignores malformed numeric inputs without corrupting state and caps huge updates', () => {
    const combat = new CombatSystem();
    const initial = combat.snapshot;

    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      combat.update(value);
      expect(combat.fire(value)).toEqual([]);
      expect(combat.throwGrenade(value)).toBeNull();
      expect(combat.applyDamage(value)).toEqual({
        absorbedByArmor: 0,
        healthDamage: 0,
        died: false,
      });
    }
    combat.update(-1);
    expect(combat.applyDamage(-1)).toEqual({
      absorbedByArmor: 0,
      healthDamage: 0,
      died: false,
    });
    expect(combat.switchWeapon('invalid' as WeaponId)).toBe(false);
    expect(combat.snapshot).toEqual(initial);

    combat.fire(0);
    combat.startReload();
    combat.throwGrenade(0);
    combat.update(Number.MAX_VALUE);
    expect(combat.snapshot).toMatchObject({
      magazine: WEAPONS.pistol.magazine,
      reloading: false,
      reloadRemainingMs: 0,
      fireCooldownRemainingMs: 0,
      bloomRadians: 0,
      grenadeCooldownRemainingMs: 0,
    });
  });
});
