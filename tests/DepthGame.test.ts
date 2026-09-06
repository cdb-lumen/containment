import {loadModels} from './loadModels';
beforeAll(loadModels);
import {describe,it,expect,vi,beforeAll} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {generateRun} from '../src/game/roguelike/run';
import {canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {marine,alien,nest} from '../src/render/models';
import * as T from 'three';
const memory=()=>{const m=new Map<string,string>();return{getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},removeItem:(k:string)=>{m.delete(k);}};};
const idle={x:0,y:0,fire:false,angle:null,autoAim:false};
function clear(game:DepthGame){for(let i=0;i<2400&&game.status==='playing';i++){for(const e of game.enemies.snapshot.enemies)game.damage(e.id,10000);const q=game.boss.snapshot;if(q.active){for(const n of q.nests)game.damage(-100-n.id,10000);if(q.vulnerable)game.damage(-1,100000);}game.update(50,idle);}}
describe('3D expedition host',()=>{
 it.each([1,2] as const)('continues version %i checkpoints through their original Queen finale',async(version)=>{
  const {saveCheckpoint}=await import('../src/game/roguelike/checkpoints');
  const storage=memory(),g=new DepthGame(()=>{},storage),graph=generateRun(137,version);
  expect(saveCheckpoint(storage,{version:1,savedAt:1,run:{version,seed:137,currentNodeId:graph.startId,completedNodeIds:[graph.startId],phase:'reward',...(version===2?{draftRoll:0}:{})},build:{mutations:[]},resources:g.combat.getRunResources()}).status).toBe('saved');
  expect(g.continueRun()).toBe(true);expect(g.expedition.run.version).toBe(version);
  for(let depth=0;depth<(version===1?6:12);depth++){
   if(depth>0)clear(g);
   expect(g.combat.snapshot.dead).toBe(false);
   if(g.status==='complete')break;
   const offers=expeditionRewardOffers(g.expedition);if(offers.length)g.chooseMutation(offers[0].id);else g.claimResources();
   g.route(g.node.next.find(id=>graph.nodes.find(n=>n.id===id)?.kind!=='elite')??g.node.next[0]);
  }
  expect(g.status).toBe('complete');expect(g.expedition.run.completedNodeIds).toHaveLength(version===1?6:12);expect(g.canContinue).toBe(false);
 });
 it('completes all twenty rooms with rewards and deliberate destruction',()=>{const storage=memory(),g=new DepthGame(()=>{},storage);g.newRun(137);for(let depth=0;depth<20;depth++){expect(g.node.depth).toBe(depth);clear(g);expect(g.combat.snapshot.dead).toBe(depth===19);if(depth===19){expect(g.status).toBe('complete');break;}expect(g.status).toBe('reward');const offers=expeditionRewardOffers(g.expedition);if(offers.length)g.chooseMutation(offers[0].id);else g.claimResources();expect(g.status).toBe('route');expect(g.canContinue).toBe(true);const graph=generateRun(g.expedition.run.seed);const next=g.node.next.find(id=>graph.nodes.find(n=>n.id===id)?.kind!=='elite')??g.node.next[0];if(depth===18)g.authorizeDestruction();else g.route(next);}expect(g.expedition.run.completedNodeIds).toHaveLength(20);expect(g.canContinue).toBe(false);});
 it('restores the unresolved reward exactly once and preserves ammunition',()=>{const storage=memory(),g=new DepthGame(()=>{},storage);g.newRun(72);g.combat.fire(0);g.combat.update(50);clear(g);const resources=g.combat.getRunResources();const restored=new DepthGame(()=>{},storage);expect(restored.continueRun()).toBe(true);expect(restored.status).toBe('reward');expect(restored.combat.getRunResources()).toEqual(resources);const offer=expeditionRewardOffers(restored.expedition)[0];restored.chooseMutation(offer.id);restored.chooseMutation(offer.id);expect(restored.expedition.build.mutations).toEqual([offer.id]);});
 it('deletes checkpoint on death, and pause freezes enemies, bullets and reload',()=>{const storage=memory(),g=new DepthGame(()=>{},storage);g.newRun(33);clear(g);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.route(g.node.next[0]);if(g.status==='reward'){g.claimResources();g.route(g.node.next[0]);}g.combat.fire(0);g.reload();g.pause();const before=g.combat.snapshot,player={...g.player};g.update(10000,{...idle,x:1,fire:true});expect(g.combat.snapshot).toEqual(before);expect(g.player).toEqual(player);g.resume();g.hurt(10000);expect(g.status).toBe('dead');expect(g.canContinue).toBe(false);expect(new DepthGame(()=>{},storage).canContinue).toBe(false);});
 it('keeps movement active while reloading and never tunnels through solid cover',()=>{const g=new DepthGame();g.newRun(4);g.combat.fire(0);g.reload();const x=g.player.x;g.update(50,{...idle,x:1});expect(g.player.x).toBeGreaterThan(x);expect(g.combat.snapshot.reloading).toBe(true);const r=ROOM_TEMPLATES[g.node.templateId].obstacles[0];Object.assign(g.player,{x:r.x-17,y:r.y+r.height/2});const moved=g.moveCorpse(g.player,700,0);expect(moved.blocked).toBe(true);expect(moved.x).toBeLessThan(r.x);expect(canOccupyExpedition(g.geometry,moved,16)).toBe(true);});
 it('stops bullets at cover before they can hit a target behind it',()=>{const g=new DepthGame();g.newRun(4);const r=ROOM_TEMPLATES[g.node.templateId].obstacles[0];Object.assign(g.player,{x:r.x-70,y:r.y+r.height/2});const spawned=g.enemies.spawn('brute',r.x+r.width+50,g.player.y);expect(spawned.spawned).toBe(true);g.switchWeapon('pistol');g.update(10,{...idle,angle:0,fire:true});for(let i=0;i<8;i++)g.update(50,idle);expect(g.enemies.snapshot.enemies.find(e=>e.type==='brute')!.health).toBeGreaterThan(100);expect(g.bullets).toHaveLength(0);});
});
describe('3D asset geometry',()=>{
 it('loads all authored actors and nest geometry without errors',()=>{const error=vi.spyOn(console,'error');const models=[marine().root,...['crawler','brute','spitter','carrier','stalker','queen'].map(k=>alien(k).root),nest()];for(const root of models){let meshes=0,vertices=0;root.traverse(o=>{if(o instanceof T.Mesh){meshes++;vertices+=o.geometry.getAttribute('position').count;}});expect(meshes).toBeGreaterThanOrEqual(1);expect(vertices).toBeGreaterThan(1000);}expect(error).not.toHaveBeenCalled();error.mockRestore();});
 it('keeps recoil in the upper body without shaking the player transform',()=>{const m=marine();m.animate(1,0,.75,0);const rotation=m.root.rotation.clone(),body=m.body.position.clone();const barrel=m.weapon!.position.z;m.animate(1,0,.75,1);expect(m.root.rotation.equals(rotation)).toBe(true);expect(m.body.position.equals(body)).toBe(true);expect(Math.abs(barrel-m.weapon!.position.z)).toBeLessThan(.035);});
});
