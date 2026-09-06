import {describe,it,expect,beforeAll} from 'vitest';
import * as T from 'three';
import {DepthGame,type GameEffect} from '../src/DepthGame';
import {ProjectileHitTracker} from '../src/game/combat/CombatSystem';
import {EnemySystem} from '../src/game/enemies/EnemySystem';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {alien} from '../src/render/models';
import {loadModels} from './loadModels';
beforeAll(loadModels);
function arena(){
 const events:GameEffect[]=[],g=new DepthGame(e=>events.push(e));g.status='playing';
 g.geometry={...g.geometry,bounds:{x:0,y:0,width:1000,height:1000},boundary:undefined,voids:[],blockers:[]};
 g.enemies=new EnemySystem();Object.assign(g.player,{x:100,y:500});return {g,events};
}
function bullet(g:DepthGame,x:number,y:number,speed=1000,penetration=1){g.bullets.push({x,y,life:2,kind:'player',request:{weaponId:'pistol',damage:10,speed,radius:1,angle:0,penetration,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(penetration)});}
describe('confirmed enemy contacts',()=>{
 it('hits visible crawler body outside its movement circle',()=>{const {g,events}=arena();const e=g.enemies.spawn('crawler',300,500);expect(e.spawned).toBe(true);bullet(g,270,518);g['updateBullets'](.05);expect(g.enemies.snapshot.enemies[0].health).toBeLessThan(42);expect(events.some(e=>e.targetId!==undefined&&e.contact==='damage')).toBe(true);});
 it('sweeps grazing contacts between discrete samples',()=>{const {g}=arena();g.enemies.spawn('crawler',300,500);bullet(g,290,520,400);g['updateBullets'](.05);expect(g.enemies.snapshot.enemies[0].health).toBeLessThan(42);});
 it('never reaches an enlarged body through thin cover',()=>{const {g,events}=arena();g.geometry={...g.geometry,blockers:[{x:285,y:450,width:1,height:100}]};g.enemies.spawn('crawler',300,500);bullet(g,270,500);g['updateBullets'](.05);expect(g.enemies.snapshot.enemies[0].health).toBe(42);expect(events.some(e=>e.contact)).toBe(false);});
 it('does not tunnel across a sub-step wall',()=>{const {g}=arena();g.geometry={...g.geometry,blockers:[{x:273,y:450,width:.1,height:100}]};g.enemies.spawn('crawler',300,500);bullet(g,270,500);g['updateBullets'](.05);expect(g.enemies.snapshot.enemies[0].health).toBe(42);});
 it('resolves the nearest contact rather than spawn order, once per target',()=>{const {g,events}=arena();g.enemies.spawn('crawler',310,500);g.enemies.spawn('crawler',300,500);bullet(g,270,500,1000,1);g['updateBullets'](.05);expect(g.enemies.snapshot.enemies.map(e=>e.health)).toEqual([42,32]);expect(events.filter(e=>e.contact)).toHaveLength(1);});
 it('resolves a body entry before a wall in the same sub-step',()=>{const {g,events}=arena();g.geometry={...g.geometry,blockers:[{x:289,y:499,width:10,height:20}]};g.enemies.spawn('crawler',300,486);bullet(g,284,500,120);g['updateBullets'](.05);expect(events.some(e=>e.contact==='damage')).toBe(true);});
 it('sweeps an enemy crossing the shot during the same frame',()=>{const {g}=arena();g.enemies.spawn('crawler',300,530);bullet(g,270,500,1000);g['updateBullets'](.05,new Map([[1,{x:300,y:470}]]));expect(g.enemies.snapshot.enemies[0].health).toBeLessThan(42);});
 it('reports brute armor absorption separately from health damage',()=>{const {g,events}=arena();g.enemies.spawn('brute',300,500);bullet(g,260,500);g['updateBullets'](.05);expect(events.some(e=>e.contact==='armor')).toBe(true);});
 it('separates armored queen blocks from damage',()=>{const {g,events}=arena();g.boss.start(400,500);bullet(g,290,500);g['updateBullets'](.05);expect(events.some(e=>e.targetId===-1&&e.contact==='blocked')).toBe(true);});
 it('projects a production-camera torso click to the target, not the floor behind it',()=>{
 const camera=new T.OrthographicCamera(-15,15,10,-10,.1,100);camera.position.set(0,26,19);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const model=alien('brute');model.root.position.set(3,0,0);
 const renderer=Object.assign(Object.create(DepthRenderer.prototype),{camera,raycaster:new T.Raycaster(),ground:new T.Plane(new T.Vector3(0,1,0),0),actors:new Map([[1,model]]),canvas:{getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})}}) as DepthRenderer;
 const screen=new T.Vector3(3,model.height*.5,0).project(camera);
 const point=renderer.pointer((screen.x+1)*480,(1-screen.y)*300,[{id:1,x:96,y:0,radius:34}]);
 expect(point).toEqual({x:96,y:0});
 });
});
