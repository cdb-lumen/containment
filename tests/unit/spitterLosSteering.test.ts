import {describe, expect, it} from 'vitest';
import {EnemySystem, type EnemyPlayerState} from '../../src/game/enemies/EnemySystem';
import {DepthGame} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {canOccupyExpedition, canTraverseExpedition, createExpeditionGeometry, hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';

describe('spitter LOS steering contract', () => {
  it.each([200, 300])('routes toward the player when LOS is blocked at distance %i', distance => {
    const goals: EnemyPlayerState[]=[];
    const system=new EnemySystem({canAttack:()=>false, route:(_enemy,target)=>{goals.push(target);return null;}});
    expect(system.spawn('spitter',500,440).spawned).toBe(true);
    const player={x:500+distance,y:440};
    const events=system.update(50,player);
    expect(goals).toEqual([player]);
    expect(system.snapshot.enemies[0].x).toBeGreaterThan(500);
    expect(events.some(e=>e.type==='hazard-attack')).toBe(false);
  });

  it.each([true, undefined])('preserves clear or omitted LOS preferred-range hold: %s', clear => {
    const system=new EnemySystem(clear===undefined?{}:{canAttack:()=>clear});
    system.spawn('spitter',500,440);
    const events=system.update(50,{x:800,y:440});
    expect(system.snapshot.enemies[0].x).toBe(500);
    expect(events.some(e=>e.type==='hazard-attack')).toBe(true);
  });

  it('preserves clear-LOS close-range retreat', () => {
    const system=new EnemySystem({canAttack:()=>true});
    system.spawn('spitter',500,440);
    system.update(50,{x:700,y:440});
    expect(system.snapshot.enemies[0].x).toBeLessThan(500);
  });

  it.each([179,180,240,360,420,421])('keeps the inclusive 180..420 attack interval at distance %i', distance => {
    // Zero delta isolates attack eligibility from motion, using the real attack collector.
    const system=new EnemySystem({canAttack:()=>true});
    system.spawn('spitter',500,440);
    expect(system.update(0,{x:500+distance,y:440}).some(e=>e.type==='hazard-attack'))
      .toBe(distance>=180 && distance<=420);
  });

  it('does not fire through blocked LOS even inside legal range', () => {
    const system=new EnemySystem({canAttack:()=>false});
    system.spawn('spitter',500,440);
    expect(system.update(0,{x:800,y:440}).some(e=>e.type==='hazard-attack')).toBe(false);
  });

  it('keeps the Gallery wall deadzone nonattacking, then fires at an explicit legal opportunity', () => {
    const game=new DepthGame();
    game.node=generateRun(3,3).nodes.find(n=>n.templateId==='residential-gallery')!;
    game.geometry=createExpeditionGeometry(game.node);
    game.navigation=new FacilityNavigation(game.geometry);
    game.enemies=game['makeEnemies']();
    Object.assign(game.player,{x:1000,y:650});
    expect(game['spawn']('spitter',1044,780)).toBe(true);
    const id=game.enemies.snapshot.enemies[0].id;
    const step=()=>{
      const before=game.enemies.getSnapshot(id)!;
      game.navigation.prepare(game.player,1);
      const events=game.enemies.update(50,game.player);
      const after=game.enemies.getSnapshot(id)!;
      expect(canOccupyExpedition(game.geometry,after,after.radius)).toBe(true);
      expect(canTraverseExpedition(game.geometry,before,after,after.radius)).toBe(true);
      return events;
    };
    for(let frame=0;frame<100;frame++) {
      const enemy=game.enemies.getSnapshot(id)!;
      expect(hasClearExpeditionShot(game.geometry,enemy,game.player)).toBe(true);
      expect(Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y)).toBeLessThan(180);
      expect(step().some(e=>e.type==='hazard-attack'||e.type==='attack-warning')).toBe(false);
    }
    const legal={x:1000,y:500};
    expect(canTraverseExpedition(game.geometry,game.player,legal,16)).toBe(true);
    Object.assign(game.player,legal);
    const enemy=game.enemies.getSnapshot(id)!;
    const distance=Math.hypot(enemy.x-legal.x,enemy.y-legal.y);
    expect(distance).toBeGreaterThanOrEqual(180);
    expect(distance).toBeLessThanOrEqual(420);
    expect(hasClearExpeditionShot(game.geometry,enemy,legal)).toBe(true);
    let attacked=false;
    for(let frame=0;frame<100&&!attacked;frame++) attacked=step().some(e=>e.type==='hazard-attack');
    expect(attacked).toBe(true);
  });
});
