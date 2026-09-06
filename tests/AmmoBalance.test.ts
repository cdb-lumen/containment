import {describe, expect, it} from 'vitest';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {WEAPONS} from '../src/game/combat/catalog';
import {PickupSystem} from '../src/game/pickups/PickupSystem';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {progressionFor} from '../src/game/roguelike/progression';

const weapons = ['rifle', 'shotgun', 'plasma', 'rocket'] as const;
const reserves = (combat: CombatSystem) => weapons.map(id => combat.getRunResources().ammo[id].reserve);
function emptyReserves(combat: CombatSystem) {
  const r = combat.getRunResources();
  expect(combat.restoreRunResources({...r, ammo: {
    ...r.ammo, ...Object.fromEntries(weapons.map(id => [id, {...r.ammo[id], reserve: 0}]))
  }})).toBe(true);
}

describe('one-third ammo economy', () => {
  it('reduces starting reserves and reset without changing magazines or other resources', () => {
    const c = new CombatSystem();
    expect(reserves(c)).toEqual([60, 16, 33, 3]);
    expect(c.getRunResources()).toMatchObject({health: 100, armor: 50, credits: 0, grenades: 3, medkits: 2,
      ammo: {pistol: {magazine: 12, reserve: -1}, rifle: {magazine: 30}, shotgun: {magazine: 8}, plasma: {magazine: 20}, rocket: {magazine: 1}}});
    c.collectAmmoPack(); c.reset();
    expect(reserves(c)).toEqual([60, 16, 33, 3]);
  });

  it('replenishes to reduced room floors without removing stockpiled ammo', () => {
    const c = new CombatSystem(); emptyReserves(c); c.replenishReserves();
    expect(reserves(c)).toEqual([80, 21, 47, 4]);
    c.collectAmmoPack(); const before = c.getRunResources(); c.replenishReserves();
    expect(c.getRunResources()).toEqual(before);
    const g = new DepthGame(); g.newRun(137); g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);
    expect(reserves(g.combat)).toEqual([80, 21, 47, 4]);
  });

  it('regenerates integer rounds at one third of the old rates and stops at reduced caps', () => {
    const c = new CombatSystem(); emptyReserves(c);
    const before = c.getRunResources();
    c.regenerateReserves(999); expect(reserves(c)).toEqual([0, 0, 0, 0]);
    c.regenerateReserves(1); expect(reserves(c)).toEqual([2, 0, 1, 0]);
    c.regenerateReserves(2000); expect(reserves(c)).toEqual([6, 1, 3, 0]);
    c.regenerateReserves(3000); expect(reserves(c)).toEqual([12, 2, 6, 1]);
    for (let i = 0; i < 100; i++) c.regenerateReserves(1000);
    expect(reserves(c)).toEqual([80, 21, 47, 4]);
    expect(weapons.map(id => c.getRunResources().ammo[id].magazine)).toEqual(weapons.map(id => before.ammo[id].magazine));
    expect(c.getRunResources().grenades).toBe(before.grenades);
  });

  it.each(['reset', 'replenishReserves'] as const)('%s clears partial slow-ammo regeneration', reset => {
    const c = new CombatSystem(); emptyReserves(c); c.regenerateReserves(2000);
    c[reset]();
    for (const id of ['shotgun', 'rocket'] as const) {
      c.switchWeapon(id); c.fire(0); c.startReload(); c.update(WEAPONS[id].reloadMs);
    }
    const before = reserves(c); c.regenerateReserves(1000);
    expect(reserves(c)).toEqual(before.map((n, i) => n + (reset === 'reset' ? [2,0,1,0][i] : 0)));
  });

  it('grants reduced pickup packs but preserves explicit grants and old save values', () => {
    const c = new CombatSystem(); emptyReserves(c); const before = c.getRunResources();
    c.collectAmmoPack(); expect(reserves(c)).toEqual([20, 4, 10, 1]);
    expect(c.getRunResources()).toMatchObject({...before, ammo: c.getRunResources().ammo});
    c.switchWeapon('rifle'); expect(c.addReserveAmmo(600)).toBe(600);
    expect(c.snapshot.reserve).toBe(620);
    const r = c.getRunResources();
    expect(c.restoreRunResources({...r, ammo: {...r.ammo, rifle: {magazine: 30, reserve: 100000}}})).toBe(true);
    c.collectAmmoPack(); expect(c.snapshot.reserve).toBe(100000);
  });

  it('reduces authored random ammo drop values without changing non-ammo drops', () => {
    const p = new PickupSystem(73), values = new Map<string, Set<number>>();
    for (let i = 0; i < 4000; i++) {
      const result = p.rollEnemyDrop('brute', 300, 400);
      if (!result.dropped) continue;
      const {kind, value, id} = result.pickup;
      if (!values.has(kind)) values.set(kind, new Set());
      values.get(kind)!.add(value); p.remove(id);
    }
    expect([...values.get('ammo')!].sort((a,b) => a-b)).toEqual([4, 8, 12]);
    expect([...values.get('health')!].sort((a,b) => a-b)).toEqual([10, 20, 30]);
    expect([...values.get('armor')!].sort((a,b) => a-b)).toEqual([8, 15, 25]);
    expect([...values.get('grenade')!]).toEqual([1]);
  });

  it.each([null, 'ammo'] as const)('scales free and purchased room ammo in every act, purchase=%s', purchase => {
    const graph = generateRun(137);
    const seen = new Set<number>();
    for (const node of graph.nodes.filter(n => n.reward === 'supplies')) {
      const g = new DepthGame(); const act = progressionFor(node).act; seen.add(act);
      emptyReserves(g.combat); g.combat.setCredits(500);
      g.node = node; g.status = 'reward';
      g.expedition = {...g.expedition, run: {...g.expedition.run, seed: 137, currentNodeId: node.id,
        completedNodeIds: graph.nodes.filter(n => n.depth <= node.depth).map(n => n.id), phase: 'reward'}, resources: g.combat.getRunResources()};
      const free = [[20,6,8,1], [25,8,10,1], [30,10,12,1]][act];
      const paid = [[13,4,5,1], [16,5,7,1], [20,7,8,1]][act];
      g.claimResources(purchase);
      expect(reserves(g.combat)).toEqual(free.map((n, i) => n + (purchase ? paid[i] : 0)));
      expect(g.combat.getRunResources()).toMatchObject({health: 100, armor: 50, grenades: 4, medkits: 2, credits: purchase ? 400 : 500});
      const receipt = g.combat.getRunResources(); g.claimResources(purchase);
      expect(g.combat.getRunResources()).toEqual(receipt);
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });

  it('keeps fire cadence, damage, one-round consumption and full-magazine reloads', () => {
    const c = new CombatSystem(); c.switchWeapon('rifle');
    expect(c.fire(0)[0].damage).toBe(16); expect(c.snapshot.magazine).toBe(29);
    expect(c.fire(0)).toEqual([]); expect(c.snapshot.fireCooldownRemainingMs).toBe(1000 / 9);
    c.startReload(); c.update(WEAPONS.rifle.reloadMs);
    expect(c.snapshot).toMatchObject({magazine: 30, reserve: 59});
  });
});
