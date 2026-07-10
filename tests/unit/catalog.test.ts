import { describe, expect, it } from 'vitest';

import { WEAPONS } from '../../src/game/combat/catalog';
import {
  ENEMIES,
  STANDARD_ENEMY_IDS,
} from '../../src/game/enemies/catalog';
import { UPGRADES } from '../../src/game/upgrades/catalog';

const UPGRADE_IDS = [
  'damage',
  'penetration',
  'spread',
  'reload',
  'magazine',
  'movement',
  'armor',
  'pickup',
];

describe('weapon catalog', () => {
  it('publishes the stable weapon IDs in deterministic order', () => {
    expect(Object.keys(WEAPONS)).toEqual([
      'pistol',
      'rifle',
      'shotgun',
      'plasma',
      'rocket',
    ]);
  });

  it('provides immutable, complete, usable definitions for every weapon', () => {
    expect(Object.isFrozen(WEAPONS)).toBe(true);

    for (const [id, weapon] of Object.entries(WEAPONS)) {
      expect(weapon.id).toBe(id);
      expect(weapon.label.length).toBeGreaterThan(0);
      expect(Object.isFrozen(weapon)).toBe(true);

      for (const value of [
        weapon.damage,
        weapon.roundsPerSecond,
        weapon.reloadMs,
        weapon.projectileSpeed,
        weapon.projectileRadius,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }

      for (const value of [weapon.magazine, weapon.pellets, weapon.penetration]) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }

      for (const value of [
        weapon.spreadRadians,
        weapon.splashRadius,
        weapon.knockback,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }

      expect(weapon.reserve).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(weapon.reserve) || weapon.reserve === Infinity).toBe(
        true,
      );
    }
  });

  it('uses the original weapon labels and required balance anchors', () => {
    expect(Object.values(WEAPONS).map(({ label }) => label)).toEqual([
      'Service pistol',
      'Assault rifle',
      'Combat shotgun',
      'Plasma projector',
      'Rocket launcher',
    ]);
    expect(WEAPONS.pistol.reserve).toBe(Number.POSITIVE_INFINITY);
    expect(WEAPONS.shotgun.pellets).toBe(8);
    expect(WEAPONS.plasma.penetration).toBe(3);
    expect(WEAPONS.rocket.splashRadius).toBe(132);
    expect(WEAPONS.rocket.splashRadius).toBeGreaterThan(
      WEAPONS.shotgun.projectileRadius,
    );
    expect(WEAPONS.rifle.damage * WEAPONS.rifle.roundsPerSecond).toBeGreaterThan(
      WEAPONS.pistol.damage * WEAPONS.pistol.roundsPerSecond,
    );
  });
});

describe('enemy catalog', () => {
  it('publishes exactly five standard enemies plus the queen', () => {
    expect(STANDARD_ENEMY_IDS).toEqual([
      'crawler',
      'brute',
      'spitter',
      'stalker',
      'carrier',
    ]);
    expect(Object.keys(ENEMIES)).toEqual([...STANDARD_ENEMY_IDS, 'queen']);
  });

  it('freezes the standard enemy ID tuple against runtime mutation', () => {
    expect(Object.isFrozen(STANDARD_ENEMY_IDS)).toBe(true);
    expect(() => {
      (STANDARD_ENEMY_IDS as unknown as string[]).push('queen');
    }).toThrow(TypeError);
    expect(STANDARD_ENEMY_IDS).toEqual([
      'crawler',
      'brute',
      'spitter',
      'stalker',
      'carrier',
    ]);
  });

  it('provides immutable, complete, valid gameplay definitions', () => {
    expect(Object.isFrozen(ENEMIES)).toBe(true);

    for (const [id, enemy] of Object.entries(ENEMIES)) {
      expect(enemy.id).toBe(id);
      expect(enemy.label.length).toBeGreaterThan(0);
      expect(Object.isFrozen(enemy)).toBe(true);

      for (const value of [
        enemy.maxHealth,
        enemy.speed,
        enemy.radius,
        enemy.contactDamage,
        enemy.attackCooldownMs,
        enemy.creditReward,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
      }

      expect(Number.isFinite(enemy.dropChance)).toBe(true);
      expect(enemy.dropChance).toBeGreaterThanOrEqual(0);
      expect(enemy.dropChance).toBeLessThanOrEqual(1);
    }
  });

  it('retains meaningful distinct behaviors and boss dominance', () => {
    expect(STANDARD_ENEMY_IDS.map((id) => ENEMIES[id].behavior)).toEqual([
      'pursuit',
      'armored-charge',
      'ranged-hazard',
      'flank-camouflage',
      'spawn-on-death',
    ]);
    expect(ENEMIES.queen.behavior).toBe('boss-phases');
    expect(ENEMIES.queen.maxHealth).toBeGreaterThan(
      Math.max(...STANDARD_ENEMY_IDS.map((id) => ENEMIES[id].maxHealth)),
    );
  });
});

describe('upgrade catalog', () => {
  it('covers each observable modifier with typed immutable definitions', () => {
    expect(Object.keys(UPGRADES)).toEqual(UPGRADE_IDS);
    expect(Object.isFrozen(UPGRADES)).toBe(true);

    for (const [id, upgrade] of Object.entries(UPGRADES)) {
      expect(upgrade.id).toBe(id);
      expect(upgrade.kind).toBe(id);
      expect(upgrade.label.length).toBeGreaterThan(0);
      expect(upgrade.description.length).toBeGreaterThan(0);
      expect(Number.isFinite(upgrade.cost)).toBe(true);
      expect(upgrade.cost).toBeGreaterThan(0);
      expect(Number.isFinite(upgrade.value)).toBe(true);
      expect(upgrade.value).toBeGreaterThan(0);
      expect(Object.isFrozen(upgrade)).toBe(true);
    }
  });
});
