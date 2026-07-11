import { describe, expect, it, vi } from 'vitest';

import { UpgradeSystem } from '../../src/game/upgrades/UpgradeSystem';
import { UPGRADES, type UpgradeId } from '../../src/game/upgrades/catalog';

const IDS = Object.keys(UPGRADES) as UpgradeId[];

const buyUntilLevel = (
  system: UpgradeSystem,
  id: UpgradeId,
  targetLevel: number,
): void => {
  let credits = Number.MAX_SAFE_INTEGER;
  for (let round = 0; system.levels[id] < targetLevel && round < 200; round += 1) {
    const armory = system.beginArmory(credits, { seed: 'test-run', round });
    const wanted = armory.offers.find((offer) => offer.id === id);
    const result = wanted
      ? system.purchase(id)
      : system.purchase(armory.offers[0].id);
    expect(result.purchased).toBe(true);
    credits = result.remainingCredits;
  }
  expect(system.levels[id]).toBeGreaterThanOrEqual(targetLevel);
};

describe('UpgradeSystem armory', () => {
  it('starts at zero and returns three distinct frozen relevant offers', () => {
    const system = new UpgradeSystem();

    expect(system.levels).toEqual(Object.fromEntries(IDS.map((id) => [id, 0])));
    const armory = system.beginArmory(0, { seed: 41, round: 1 });

    expect(armory.open).toBe(true);
    expect(armory.offers).toHaveLength(3);
    expect(new Set(armory.offers.map(({ id }) => id)).size).toBe(3);
    expect(armory.offers.every(({ affordable }) => !affordable)).toBe(true);
    expect(Object.isFrozen(armory)).toBe(true);
    expect(Object.isFrozen(armory.offers)).toBe(true);
    expect(armory.offers.every(Object.isFrozen)).toBe(true);
  });

  it('prefers affordable offers when at least three are affordable', () => {
    const system = new UpgradeSystem();
    const armory = system.beginArmory(125, 'affordable-round');

    expect(armory.offers).toHaveLength(3);
    expect(armory.offers.every(({ affordable, cost }) => affordable && cost <= 125)).toBe(true);
  });

  it('rejects an offered unaffordable purchase without changing any state', () => {
    const system = new UpgradeSystem();
    const armory = system.beginArmory(100, 'mostly-locked');
    expect(armory.offers.filter(({ affordable }) => affordable).map(({ id }) => id)).toEqual([
      'spread',
    ]);
    const locked = armory.offers.find(({ affordable }) => !affordable);
    expect(locked).toBeDefined();
    const before = system.snapshot;

    const result = system.purchase(locked!.id);

    expect(result).toMatchObject({
      purchased: false,
      reason: 'insufficient-credits',
      spent: 0,
      remainingCredits: 100,
    });
    expect(system.snapshot).toEqual(before);
    expect(system.armory.open).toBe(true);
  });

  it('is idempotent while an armory is open and rotates deterministically by round', () => {
    const a = new UpgradeSystem();
    const b = new UpgradeSystem();

    const aRound1 = a.beginArmory(0, { seed: 'run-a', round: 1 });
    expect(a.beginArmory(999, { seed: 'ignored', round: 99 })).toBe(aRound1);
    const bRound1 = b.beginArmory(0, { seed: 'run-a', round: 1 });
    expect(bRound1.offers.map(({ id }) => id)).toEqual(aRound1.offers.map(({ id }) => id));

    a.timeout();
    b.timeout();
    const aRound2 = a.beginArmory(0, { seed: 'run-a', round: 2 });
    const bRound2 = b.beginArmory(0, { seed: 'run-a', round: 2 });
    expect(aRound2.offers.map(({ id }) => id)).toEqual(bRound2.offers.map(({ id }) => id));
    expect(aRound2.offers.map(({ id }) => id)).not.toEqual(aRound1.offers.map(({ id }) => id));
  });

  it('purchases an offered upgrade, accounts for credits, and closes', () => {
    const system = new UpgradeSystem();
    const armory = system.beginArmory(500, 'purchase');
    const offer = armory.offers[1];

    const result = system.select(offer.id);

    expect(result).toEqual({
      purchased: true,
      reason: 'purchased',
      upgradeId: offer.id,
      level: 1,
      spent: offer.cost,
      remainingCredits: 500 - offer.cost,
    });
    expect(system.levels[offer.id]).toBe(1);
    expect(system.armory.open).toBe(false);
    expect(system.purchase(offer.id).reason).toBe('armory-closed');
  });

  it('excludes maxed upgrades and uses finite escalating costs', () => {
    const system = new UpgradeSystem();
    const id: UpgradeId = 'damage';
    buyUntilLevel(system, id, UPGRADES[id].maxLevel);

    expect(system.levels[id]).toBe(UPGRADES[id].maxLevel);
    const armory = system.beginArmory(Number.MAX_SAFE_INTEGER, 'after-max');
    expect(armory.offers.some((offer) => offer.id === id)).toBe(false);
    expect(armory.offers.every((offer) => Number.isSafeInteger(offer.cost))).toBe(true);
  });

  it('automatically purchases deterministically at timeout, or closes when none is affordable', () => {
    const a = new UpgradeSystem({ armoryDurationMs: 1_000 });
    const b = new UpgradeSystem({ armoryDurationMs: 1_000 });
    const aOffers = a.beginArmory(500, 'timeout');
    b.beginArmory(500, 'timeout');

    expect(a.update(999)).toBeNull();
    const resolvedA = a.update(1);
    const resolvedB = b.timeout();
    expect(resolvedA).toMatchObject({ automatic: true, purchased: true, reason: 'purchased' });
    expect(resolvedB).toEqual(resolvedA);
    if (!resolvedA || !('upgradeId' in resolvedA)) {
      throw new Error('expected an automatic purchase');
    }
    expect(aOffers.offers.map(({ id }) => id)).toContain(resolvedA.upgradeId);
    expect(a.armory.open).toBe(false);

    const locked = new UpgradeSystem();
    locked.beginArmory(0, 'no-money');
    expect(locked.timeout()).toEqual({
      automatic: true,
      purchased: false,
      reason: 'no-affordable-offer',
      spent: 0,
      remainingCredits: 0,
    });
    expect(locked.armory.open).toBe(false);
  });

  it('rejects unknown ids and malformed credit/time inputs safely', () => {
    const system = new UpgradeSystem();
    system.beginArmory(Number.NaN, 'bad-credits');
    expect(system.purchase('bogus' as UpgradeId).reason).toBe('invalid-id');
    expect(system.purchase('damage').reason).toBe('invalid-credits');
    expect(system.update(Number.NaN)).toBeNull();
    expect(system.update(Number.POSITIVE_INFINITY)).toBeNull();
    expect(system.update(-1)).toBeNull();
    expect(JSON.stringify(system.snapshot)).not.toMatch(/NaN|Infinity/);
  });
});

describe('UpgradeSystem effects', () => {
  it('applies all eight upgrade effects to observable finite values', () => {
    const system = new UpgradeSystem();
    for (const id of IDS) buyUntilLevel(system, id, 1);

    const modifiers = system.modifiers;
    expect(modifiers.damageMultiplier).toBeGreaterThan(1);
    expect(modifiers.penetrationBonus).toBeGreaterThanOrEqual(1);
    expect(Number.isInteger(modifiers.penetrationBonus)).toBe(true);
    expect(modifiers.spreadMultiplier).toBeGreaterThan(0);
    expect(modifiers.spreadMultiplier).toBeLessThan(1);
    expect(modifiers.reloadMultiplier).toBeGreaterThan(0);
    expect(modifiers.reloadMultiplier).toBeLessThan(1);
    expect(modifiers.magazineMultiplier).toBeGreaterThan(1);
    expect(modifiers.movementMultiplier).toBeGreaterThan(1);
    expect(modifiers.maxArmorBonus).toBeGreaterThan(0);
    expect(modifiers.pickupValueMultiplier).toBeGreaterThan(1);
    expect(modifiers.pickupMagnetEnabled).toBe(true);

    expect(system.applyDamage(20)).toBeGreaterThan(20);
    expect(system.applyPenetration(1)).toBeGreaterThan(1);
    expect(system.applySpread(0.5)).toBeLessThan(0.5);
    expect(system.applyReloadDuration(1_000)).toBeLessThan(1_000);
    expect(system.applyMagazineCapacity(10)).toBeGreaterThan(10);
    expect(system.applyMovementSpeed(200)).toBeGreaterThan(200);
    expect(system.applySpeed(200)).toBe(system.applyMovementSpeed(200));
    expect(system.applyMaxArmor(100)).toBeGreaterThan(100);
    expect(system.applyPickupValue(10)).toBeGreaterThan(10);
  });

  it('gates pickup magnet until pickup efficiency has a level', () => {
    const system = new UpgradeSystem();
    expect(system.modifiers.pickupMagnetEnabled).toBe(false);
    buyUntilLevel(system, 'pickup', 1);
    expect(system.modifiers.pickupMagnetEnabled).toBe(true);
  });

  it('never returns NaN or infinity from malformed transform inputs', () => {
    const system = new UpgradeSystem();
    const values = [
      system.applyDamage(Number.NaN),
      system.applyPenetration(Number.POSITIVE_INFINITY),
      system.applySpread(Number.NEGATIVE_INFINITY),
      system.applyReloadDuration(-10),
      system.applyMagazineCapacity(Number.MAX_VALUE),
      system.applyMovementSpeed(Number.MAX_VALUE),
      system.applyMaxArmor(Number.MAX_VALUE),
      system.applyPickupValue(Number.MAX_VALUE),
    ];

    expect(values.every(Number.isFinite)).toBe(true);
    expect(values.every((value) => value >= 0)).toBe(true);
  });

  it('returns deeply immutable snapshots and isolates listener failures', () => {
    const system = new UpgradeSystem();
    const goodListener = vi.fn();
    system.subscribe(() => {
      throw new Error('listener failure');
    });
    const unsubscribe = system.subscribe(goodListener);

    expect(() => system.beginArmory(500, 'listeners')).not.toThrow();
    expect(goodListener).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(system.snapshot)).toBe(true);
    expect(Object.isFrozen(system.snapshot.levels)).toBe(true);
    expect(Object.isFrozen(system.snapshot.modifiers)).toBe(true);
    expect(Object.isFrozen(system.snapshot.armory.offers)).toBe(true);

    unsubscribe();
    system.timeout();
    expect(goodListener).toHaveBeenCalledTimes(1);
  });

  it('reset clears levels, modifiers, credits, timers, and the open armory', () => {
    const system = new UpgradeSystem();
    const offer = system.beginArmory(500, 'before-reset').offers[0];
    system.purchase(offer.id);
    system.beginArmory(400, 'open-before-reset');
    system.update(250);

    system.reset();

    expect(system.levels).toEqual(Object.fromEntries(IDS.map((id) => [id, 0])));
    expect(system.modifiers.pickupMagnetEnabled).toBe(false);
    expect(system.armory).toMatchObject({
      open: false,
      credits: 0,
      elapsedMs: 0,
      offers: [],
    });
  });
});
