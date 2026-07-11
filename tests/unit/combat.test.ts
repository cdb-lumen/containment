import { describe, expect, it } from 'vitest';

import { WEAPONS } from '../../src/game/combat/catalog';
import {
  calculateSplashDamage,
  CombatSystem,
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

  it('creates exactly eight deterministic symmetric shotgun pellets', () => {
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
        expect(angles[index] - angles[index - 1]).toBeCloseTo(
          WEAPONS.shotgun.spreadRadians / 7,
          12,
        );
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
    expect(combat.snapshot.reserve).toBe(175);

    for (let reload = 0; reload < 5; reload += 1) {
      emptyCurrentMagazine(combat);
      completeReload(combat);
    }
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

    combat.reset();
    expect(combat.snapshot).toEqual({
      weaponId: 'pistol',
      magazine: WEAPONS.pistol.magazine,
      reserve: Number.POSITIVE_INFINITY,
      reloading: false,
      reloadRemainingMs: 0,
      fireCooldownRemainingMs: 0,
      grenades: 3,
      grenadeCooldownRemainingMs: 0,
      medkits: 2,
      health: 100,
      armor: 50,
      dead: false,
      credits: 0,
      wave: 0,
      objective: null,
    });
    combat.switchWeapon('rifle');
    expect(combat.snapshot).toMatchObject({
      magazine: WEAPONS.rifle.magazine,
      reserve: WEAPONS.rifle.reserve,
      fireCooldownRemainingMs: 0,
    });
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
      grenadeCooldownRemainingMs: 0,
    });
  });
});
