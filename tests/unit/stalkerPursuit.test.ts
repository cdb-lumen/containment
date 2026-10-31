import {describe, expect, it} from 'vitest';
import {EnemySystem} from '../../src/game/enemies/EnemySystem';
import {DepthGame} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {createExpeditionGeometry} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot, type ExpeditionGeometry} from '../../src/game/world/expeditionGeometry';

const emptyRoom = (): ExpeditionGeometry => ({
  ...new DepthGame().geometry,
  bounds: {x: 0, y: 0, width: 1200, height: 880},
  boundary: [{x:0,y:0},{x:1200,y:0},{x:1200,y:880},{x:0,y:880}],
  voids: [], blockers: [], boundaryWalls: [],
});

describe('stalker pursuit through DepthGame', () => {
  const nodes=generateRun(1729,3).nodes.filter(node=>['residential-gallery','relay-racks','freight-hold'].includes(node.templateId));
  it('retains all three representative rooms', () => {
    expect(nodes.map(node=>node.templateId).sort()).toEqual(['freight-hold','relay-racks','residential-gallery']);
  });
  it.each(nodes.flatMap(node=>[false,true].flatMap(even=>['entry','exit'].flatMap(target=>
    createExpeditionGeometry(node).breaches.map(breach=>({node,even,target,breach}))))))
  ('$node.templateId $breach.id to $target, even ID $even', ({node,even,target,breach}) => {
    const game=new DepthGame();
    game.node=node;
    game.geometry=createExpeditionGeometry(node);
    game.navigation=new FacilityNavigation(game.geometry);
    game.enemies=game['makeEnemies']();
    game.status='playing';
    Object.assign(game.player,target==='entry'?game.geometry.playerSpawn:game.geometry.exitPoint);
    const start={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y};
    expect(canOccupyExpedition(game.geometry,start,17)).toBe(true);
    expect(canOccupyExpedition(game.geometry,game.player,16)).toBe(true);
    if(even){const dummy=game.enemies.spawn('crawler',start.x,start.y);if(!dummy.spawned)throw new Error('dummy spawn');game.enemies.remove(dummy.enemy.id);}
    expect(game['spawn']('stalker',start.x,start.y)).toBe(true);
    const id=game.enemies.snapshot.enemies[0].id;
    let attacks=0;
    game.enemies.subscribe(event=>{if(event.type==='contact-attack'&&event.enemyId===id)attacks++;});
    const beforeResources=game.combat.getRunResources();
    for(let frame=0;frame<2400 && attacks===0;frame++){
      const before=game.enemies.getSnapshot(id)!;
      game.update(50,{x:0,y:0,fire:false,angle:null,autoAim:false});
      const after=game.enemies.getSnapshot(id)!;
      expect(canTraverseExpedition(game.geometry,before,after,after.radius)).toBe(true);
    }
    expect(attacks,JSON.stringify(game.enemies.getSnapshot(id))).toBeGreaterThan(0);
    const afterResources=game.combat.getRunResources();
    expect(afterResources.health+afterResources.armor).toBeLessThan(beforeResources.health+beforeResources.armor);
  });
});

describe('optional flank routing', () => {
  it.each([false,true])('retains a clear flank with even ID %s', even => {
    const goals: {x:number;y:number}[]=[];
    const system=new EnemySystem({route:(_enemy,target)=>{goals.push(target);return null;}});
    if(even){const dummy=system.spawn('crawler',300,300);if(!dummy.spawned)throw new Error('dummy spawn');system.remove(dummy.enemy.id);}
    system.spawn('stalker',300,300);
    system.update(0,{x:700,y:300});
    expect(goals).toEqual([{x:700,y:even?120:480}]);
    expect(system.snapshot.enemies[0]).toMatchObject({targetX:700,targetY:even?120:480});
  });
  it.each(['direct','waypoint','blocked'] as const)('uses the player retry result: %s', result => {
    const goals: {x:number;y:number}[]=[];
    const system=new EnemySystem({route:(enemy,target)=>{
      goals.push(target);
      if(goals.length===1||result==='blocked')return enemy;
      return result==='direct'?null:{x:300,y:500};
    }});
    system.spawn('stalker',300,300);
    system.update(0,{x:700,y:300});
    expect(goals).toEqual([{x:700,y:480},{x:700,y:300}]);
    const enemy=system.snapshot.enemies[0];
    expect({x:enemy.velocityX,y:enemy.velocityY}).toEqual(
      result==='direct'?{x:125,y:0}:result==='waypoint'?{x:0,y:125}:{x:0,y:0});
  });
  it('does not retry other enemy families', () => {
    let calls=0;
    const system=new EnemySystem({route:enemy=>{calls++;return enemy;}});
    system.spawn('crawler',300,300);
    system.update(0,{x:700,y:300});
    expect(calls).toBe(1);
    expect(system.snapshot.enemies[0]).toMatchObject({velocityX:0,velocityY:0});
  });
  it('cannot cross a disconnected room to attack after the fallback', () => {
    const geometry={...emptyRoom(),blockers:[{x:580,y:0,width:40,height:880}]};
    const navigation=new FacilityNavigation(geometry);
    const system=new EnemySystem({
      canAttack:(a,b)=>hasClearExpeditionShot(geometry,a,b),
      canMove:c=>canOccupyExpedition(geometry,{x:c.toX,y:c.toY},c.radius),
      route:(enemy,target)=>navigation.waypoint(enemy,target,1),
    });
    system.spawn('stalker',300,780);
    for(let frame=0;frame<2400;frame++){
      const before=system.snapshot.enemies[0];
      expect(system.update(50,{x:900,y:780,radius:16}).filter(event=>event.type==='contact-attack')).toEqual([]);
      const after=system.snapshot.enemies[0];
      expect(after.x+after.radius).toBeLessThanOrEqual(580);
      expect(canTraverseExpedition(geometry,before,after,after.radius)).toBe(true);
    }
  });
});

describe('stalker pursuit with production navigation', () => {
  for (const even of [false, true]) {
    it.each([
      {name:'historical empty-room control', start:{x:156,y:100}, player:{x:100,y:440,radius:16}},
      {name:'south edge', start:{x:100,y:780}, player:{x:1100,y:780,radius:16}},
      {name:'north edge', start:{x:100,y:100}, player:{x:1100,y:100,radius:16}},
      {name:'open center', start:{x:300,y:440}, player:{x:800,y:440,radius:16}},
    ])(`reaches contact for $name, even ID ${even}`, ({start,player}) => {
      const geometry=emptyRoom();
      const navigation=new FacilityNavigation(geometry);
      const system=new EnemySystem({
        canAttack:(a,b)=>hasClearExpeditionShot(geometry,a,b),
        canMove:c=>canOccupyExpedition(geometry,{x:c.toX,y:c.toY},c.radius),
        route:(enemy,target)=>navigation.waypoint(enemy,target,1),
      });
      if(even){const dummy=system.spawn('crawler',600,440); expect(dummy.spawned).toBe(true); if(dummy.spawned) system.remove(dummy.enemy.id);}
      const spawned=system.spawn('stalker',start.x,start.y);
      expect(spawned.spawned).toBe(true);
      if(!spawned.spawned) throw new Error('spawn failed');
      expect(canOccupyExpedition(geometry,player,player.radius)).toBe(true);
      let attacks=0;
      for(let frame=0;frame<2400 && attacks===0;frame++){
        const before=system.getSnapshot(spawned.enemy.id)!;
        navigation.prepare(player,1);
        attacks+=system.update(50,player).filter(event=>event.type==='contact-attack').length;
        const after=system.getSnapshot(spawned.enemy.id)!;
        expect(canTraverseExpedition(geometry,before,after,after.radius)).toBe(true);
      }
      expect(attacks, JSON.stringify(system.getSnapshot(spawned.enemy.id))).toBeGreaterThan(0);
    });
  }
});
