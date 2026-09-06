import {describe, expect, it} from 'vitest';
import {CombatSystem} from '../../src/game/combat/CombatSystem';
import {WEAPONS} from '../../src/game/combat/catalog';
import {DepthGame} from '../../src/DepthGame';
import type {WeaponId} from '../../src/game/combat/types';

const cadence = (id: WeaponId) => 1000 / WEAPONS[id].roundsPerSecond;
const rifle = () => {const c = new CombatSystem(); c.switchWeapon('rifle'); return c;};
const hold = (c: CombatSystem, count: number) => {
  const angles: number[] = [];
  for(let i=0;i<count;i++){angles.push(c.fire(0)[0].angle); c.update(cadence('rifle'), true);}
  return angles;
};

describe('weapon spread', () => {
  it('starts the rifle tight, blooms only on accepted shots and caps sustained fire', () => {
    const c=rifle();
    const first=c.fire(0)[0];
    expect(Math.abs(first.angle)).toBeGreaterThan(0);
    expect(Math.abs(first.angle)).toBeLessThanOrEqual(.006);
    expect(c.snapshot.bloomRadians).toBeCloseTo(.008);
    const state=c.snapshot;
    expect(c.fire(0)).toEqual([]);
    expect(c.fire(NaN)).toEqual([]);
    expect(c.snapshot).toEqual(state);
    c.update(cadence('rifle'),true);
    const sustained=hold(c,20);
    expect(c.snapshot.bloomRadians).toBeCloseTo(.058);
    expect(Math.max(...sustained.map(Math.abs))).toBeGreaterThan(.02);
    expect(sustained.every(a=>Math.abs(a)<=.035)).toBe(true);
    expect(sustained.some(a=>a<0)&&sustained.some(a=>a>0)).toBe(true);
  });

  it('recovers immediately off trigger, within 350 ms, independently of frame partition', () => {
    const a=rifle(),b=rifle();hold(a,12);hold(b,12);
    a.update(175,false);
    expect(a.snapshot.bloomRadians).toBeCloseTo(.029);
    for(let i=0;i<7;i++)b.update(25,false);
    expect(b.snapshot.bloomRadians).toBeCloseTo(a.snapshot.bloomRadians);
    a.update(175,false);b.update(175,false);
    expect(a.snapshot.bloomRadians).toBe(0);
    const recovered = a.fire(0);
    expect(recovered).toHaveLength(1);
    expect(recovered).toEqual(b.fire(0));
    expect(Math.abs(recovered[0].angle)).toBeLessThanOrEqual(.006);
  });

  it('keeps bloom per weapon, preserves it across instant swaps and recovers holstered/reloading weapons', () => {
    const c=rifle();hold(c,12);c.switchWeapon('pistol');
    expect(c.snapshot.bloomRadians).toBe(0);c.switchWeapon('rifle');
    expect(c.snapshot.bloomRadians).toBeCloseTo(.058);
    c.switchWeapon('pistol');c.update(350,true);c.switchWeapon('rifle');
    expect(c.snapshot.bloomRadians).toBe(0);
    hold(c,6);expect(c.startReload()).toBe(true);c.update(350,true);
    expect(c.snapshot.bloomRadians).toBe(0);
  });

  it('applies spread modifiers to the rifle base cone and capped bloom without changing recovery', () => {
    const a=rifle(),b=rifle();b.setModifiers({spreadMultiplier:.5});
    for(let i=0;i<15;i++){
      expect(b.fire(.3)[0].angle-.3).toBeCloseTo((a.fire(.3)[0].angle-.3)*.5,12);
      expect(b.snapshot.bloomRadians).toBe(a.snapshot.bloomRadians);
      a.update(cadence('rifle'),true);b.update(cadence('rifle'),true);
    }
    a.update(350);b.update(350);expect(a.snapshot.bloomRadians).toBe(0);expect(b.snapshot.bloomRadians).toBe(0);
  });

  it('ignores invalid time and zero time without letting rejected fire grow bloom', () => {
    const c=rifle();hold(c,3);const before=c.snapshot;
    for(const ms of [NaN,Infinity,-1,0])c.update(ms,false);
    expect(c.snapshot).toEqual(before);
    c.startReload();const reloading=c.snapshot;c.fire(0);expect(c.snapshot).toEqual(reloading);
  });

  it.each(['pistol','plasma','rocket'] as const)('keeps %s exactly on aim', id => {
    const c=new CombatSystem();c.switchWeapon(id);
    for(let i=0;i<5;i++){
      expect(c.fire(1.23)[0].angle).toBe(1.23);
      expect(c.snapshot.bloomRadians).toBe(0);
      c.update(cadence(id),true);c.startReload();c.update(3000,true);
    }
  });

  it('varies shotgun inner pellets without changing endpoints, symmetry or leaving unlucky gaps', () => {
    const a=new CombatSystem(),b=new CombatSystem();a.switchWeapon('shotgun');b.switchWeapon('shotgun');
    const fans:number[][]=[];
    for(let shot=0;shot<8;shot++){
      const fan=a.fire(0).map(p=>p.angle);expect(fan).toEqual(b.fire(0).map(p=>p.angle));fans.push(fan);
      expect(fan).toHaveLength(8);expect(fan[0]).toBeCloseTo(-.12);expect(fan[7]).toBeCloseTo(.12);
      for(let i=0;i<8;i++){
        expect(fan[i]+fan[7-i]).toBeCloseTo(0,12);
        if(i) {expect(fan[i]-fan[i-1]).toBeGreaterThan(.24/7*.79);expect(fan[i]-fan[i-1]).toBeLessThan(.24/7*1.21);}
      }
      a.update(cadence('shotgun'));b.update(cadence('shotgun'));
    }
    expect(fans[0]).not.toEqual(fans[1]);
  });

  it('does not let mutation event IDs, movement or rejected trigger polls perturb spread', () => {
    const a=rifle(),b=rifle();b.nextMutationEventId('hit');b.nextMutationEventId('pickup');
    expect(a.fire(.4)).toMatchObject(b.fire(.4).map(({angle})=>({angle})));
    for(let i=0;i<10;i++)b.fire(.4);
    a.update(cadence('rifle'),true);b.update(cadence('rifle'),true);
    expect(a.fire(.4)[0].angle).toBe(b.fire(.4)[0].angle);
    const games=[new DepthGame(),new DepthGame()];
    for(const g of games){g.newRun(1729);g.status='playing';g.switchWeapon('rifle');}
    for(let i=0;i<12;i++){
      games[0].update(20,{x:0,y:0,fire:true,angle:0,autoAim:false});
      games[1].update(20,{x:1,y:0,fire:true,angle:0,autoAim:false});
    }
    expect(games[0].combat.snapshot.bloomRadians).toBeGreaterThan(.008);
    expect(games[0].combat.snapshot).toEqual(games[1].combat.snapshot);
    expect(games[0].bullets.map(b=>b.request.angle)).toEqual(games[1].bullets.map(b=>b.request.angle));
  });

  it('freezes on pause, recovers after release and clears on new run, restore and encounter reset', () => {
    const g=new DepthGame();g.newRun(1729);g.status='playing';g.switchWeapon('rifle');
    for(let i=0;i<25;i++)g.update(20,{x:0,y:0,fire:true,angle:0,autoAim:false});
    expect(g.combat.snapshot.bloomRadians).toBeGreaterThan(0);
    g.pause();const paused=g.combat.snapshot;for(let i=0;i<30;i++)g.update(50);
    expect(g.combat.snapshot).toEqual(paused);g.resume();for(let i=0;i<7;i++)g.update(50);
    expect(g.combat.snapshot.bloomRadians).toBe(0);
    const c=rifle(),fresh=rifle();const first=fresh.fire(0)[0].angle;
    for(const reset of [()=>c.resetMutationEncounter(),()=>c.restoreRunResources(c.getRunResources()),()=>{c.reset();c.switchWeapon('rifle');}]){
      hold(c,4);reset();c.update(cadence('rifle'),true);expect(c.snapshot.bloomRadians).toBe(0);expect(c.fire(0)[0].angle).toBe(first);c.update(cadence('rifle'),true);
    }
    g.newRun(1729);expect(g.combat.snapshot.bloomRadians).toBe(0);
  });
});
