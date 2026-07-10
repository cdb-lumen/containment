import { describe, expect, it } from 'vitest';

import { WEAPONS } from '../../src/game/combat/catalog';
import {
  ENEMIES,
  STANDARD_ENEMY_IDS,
} from '../../src/game/enemies/catalog';
import { UPGRADES } from '../../src/game/upgrades/catalog';

const WEAPON_FIELDS = [
  'id',
  'label',
  'damage',
  'roundsPerSecond',
  'magazine',
  'reserve',
  'reloadMs',
  'pellets',
  'spreadRadians',
  'projectileSpeed',
  'projectileRadius',
  'penetration',
  'splashRadius',
  'knockback',
];

const ENEMY_FIELDS = [
  'id',
  'label',
  'maxHealth',
  'speed',
  'radius',
  'contactDamage',
  'attackCooldownMs',
  'creditReward',
  'dropChance',
  'behavior',
];

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

  it('provides complete, usable definitions for every weapon', () => {
    for (const [id, weapon] of Object.entries(WEAPONS)) {
      expect(Object.keys(weapon)).toEqual(WEAPON_FIELDS);
      expect(weapon.id).toBe(id);
      expect(weapon.label.length).toBeGreaterThan(0);
      expect(weapon.damage).toBeGreaterThan(0);
      expect(weapon.roundsPerSecond).toBeGreaterThan(0);
      expect(weapon.projectileSpeed).toBeGreaterThan(0);
      expect(weapon.projectileRadius).toBeGreaterThan(0);
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

  it('provides complete, valid gameplay definitions', () => {
    for (const [id, enemy] of Object.entries(ENEMIES)) {
      expect(Object.keys(enemy)).toEqual(ENEMY_FIELDS);
      expect(enemy.id).toBe(id);
      expect(enemy.label.length).toBeGreaterThan(0);
      expect(enemy.maxHealth).toBeGreaterThan(0);
      expect(enemy.radius).toBeGreaterThan(0);

      for (const value of [
        enemy.maxHealth,
        enemy.speed,
        enemy.radius,
        enemy.contactDamage,
        enemy.attackCooldownMs,
        enemy.creditReward,
        enemy.dropChance,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }

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
      expect(Object.keys(upgrade)).toEqual([
        'id',
        'label',
        'description',
        'cost',
        'kind',
        'value',
      ]);
      expect(upgrade.id).toBe(id);
      expect(upgrade.kind).toBe(id);
      expect(upgrade.label.length).toBeGreaterThan(0);
      expect(upgrade.description.length).toBeGreaterThan(0);
      expect(upgrade.cost).toBeGreaterThan(0);
      expect(upgrade.value).toBeGreaterThan(0);
      expect(Object.isFrozen(upgrade)).toBe(true);
    }
  });
});
