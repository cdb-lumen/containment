import {beforeAll,afterEach,it,expect,vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {DepthRenderer} from './DepthRenderer';
import {DepthGame,type GameEffect} from '../DepthGame';
import {DeathRagdolls,initDeathPhysics} from './DeathRagdolls';
import {alien,type ActorModel} from './models';
import {ActorPool} from './ActorPool';
import {ASSET_NAMES,preloadAssets} from './assets';
import * as garden from './CommunalGarden';
function model():ActorModel{const root=new T.Group(),body=new T.Group(),chest=new T.Bone();root.add(body);body.add(chest);chest.name='chest';chest.position.y=.6;for(let i=0;i<2;i++){const leg=new T.Bone();leg.name=`leg${i}_upper`;leg.position.x=i?.3:-.3;chest.add(leg);}return{root,body,height:1,limbs:[],animate(){},freeze(){}};}
function fixture(){
 const ragdolls=new DeathRagdolls();ragdolls.setRoom({width:640,height:640,obstacles:[]});
 const noop=vi.fn(),material=new T.MeshStandardMaterial();
 const r:any=Object.assign(Object.create(DepthRenderer.prototype),{ragdolls,actors:new Map(),nests:new Map(),corpses:[],corpseIds:new Set(),world:new T.Group(),scene:new T.Scene(),effects:{event:vi.fn(),update:noop,dispose:noop,setWorld:noop,clear:noop},actorPool:{take:vi.fn(model),release:vi.fn(),dispose:noop},tier:'high',roomKey:'test',time:0,focus:new T.Vector3(),camera:new T.OrthographicCamera(-10,10,10,-10),player:{...model(),muzzleWorld:(v:T.Vector3)=>v},recoil:0,pendingShots:[],shotSocket:new T.Vector3(),spotlight:new T.SpotLight(),healthBars:{update:noop,dispose:noop},canvas:{clientHeight:600},menuActors:new T.Group(),lastMenu:false,warning:new T.Group(),poolMeshes:new Map(),pickupMeshes:new Map(),muzzle:{intensity:0},muzzleLife:0,lighting:{update:noop,dispose:noop,loadRoom:noop},contacts:{begin:noop,add:noop,end:noop,dispose:noop},bulletMesh:{instanceMatrix:{}},renderer:{shadowMap:{},info:{reset:noop},render:noop,dispose:noop},composer:{render:noop,dispose:noop},afflictions:{update:noop,dispose:noop,clear:noop},temporaryMaterials:[],floorMaterial:material,surfaces:{dispose:noop,theme:noop,shipTheme:noop,uv:noop,floor:material,wall:material,cover:material}});
 return r;
}
function game(){const g=new DepthGame();g.node={...g.node,id:'test'};g.status='playing';return g;}
beforeAll(initDeathPhysics);
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it('transfers a living skin at authoritative death coordinates once and syncs joints',()=>{
 const r=fixture(),m=model();m.root.position.set(1,0,2);r.actors.set(7,m);
 const e:GameEffect={type:'corpse',id:7,family:'crawler',x:160,y:192,vx:200,vy:0};r.effect(e);
 expect(r.ragdolls.snapshot().active).toBe(1);expect(r.actors.has(7)).toBe(false);expect(m.root.position.toArray()).toEqual([5,0,6]);
 r.effect(e);expect(r.corpses).toHaveLength(1);expect(r.actorPool.take).not.toHaveBeenCalled();expect(r.effects.event).toHaveBeenCalledTimes(1);
 r.syncCorpse(7,320,352);expect(r.ragdolls.position(7)?.x).toBeCloseTo(10);expect(r.ragdolls.position(7)?.z).toBeCloseTo(11);r.dispose();
});
it('retains exactly-once routing after visual eviction and syncs overflow immediately',()=>{
 const r=fixture();r.tier='low';r.ragdolls.setQuality('low');
 for(let id=1;id<=8;id++)r.effect({type:'corpse',id,family:'crawler',x:160,y:160});
 expect(r.corpses).toHaveLength(6);expect(r.actorPool.release).toHaveBeenCalledTimes(2);
 r.effect({type:'corpse',id:1,family:'crawler',x:160,y:160});expect(r.actorPool.take).toHaveBeenCalledTimes(8);
 expect(r.ragdolls.has(6)).toBe(false);r.syncCorpse(6,320,352);expect(r.corpses.find((c:any)=>c.id===6).model.root.position.toArray()).toEqual([10,0,11]);r.dispose();
});
it.each(['paused','reward','route'] as const)('does not advance physics in %s or catch up after loading',status=>{
 const r=fixture(),g=game();r.effect({type:'corpse',id:1,family:'crawler',x:160,y:160});g.status=status;
 const before=r.ragdolls.snapshot().steps;r.render(g,10);expect(r.ragdolls.snapshot().steps).toBe(before);
 r.recoveryKit={state:'loading',dispose:vi.fn()};g.status='playing';r.render(g,10);expect(r.ragdolls.snapshot().steps).toBe(before);
 const update=vi.spyOn(r.ragdolls,'update');r.recoveryKit.state='ready';r.render(g,1/60);expect(update).toHaveBeenCalledExactlyOnceWith(1/60);expect(r.ragdolls.snapshot().steps).toBeGreaterThan(before);r.dispose();
});
it('builds static contacts after room construction and coalesces current-owner refreshes before stepping',()=>{
 const r=fixture(),g=game(),setRoom=vi.spyOn(r.ragdolls,'setRoom');r.loadRoom({...g.node,id:'built',templateId:'security-lock'});
 expect(setRoom).toHaveBeenLastCalledWith(expect.anything(),r.world);expect(r.world.children.length).toBeGreaterThan(0);
 const old=r.staticLoaded(r.world);r.world=new T.Group();r.staticDirty=false;old();expect(r.staticDirty).toBe(false);
 const ready=r.staticLoaded(r.world);ready();ready();r.roomKey=g.node.id;
 const refresh=vi.spyOn(r.ragdolls,'refreshStatic'),update=vi.spyOn(r.ragdolls,'update');r.render(g,1/60);r.render(g,1/60);
 expect(refresh).toHaveBeenCalledTimes(1);expect(refresh).toHaveBeenCalledWith(r.world);expect(refresh.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);r.dispose();
});
it('waits for the garden and refreshes its static contacts before physics, ignoring retired callbacks',()=>{
 const owner={state:'loading',error:undefined,notificationError:undefined,ready:Promise.resolve(),dispose:vi.fn()};
 let loaded=()=>{};
 vi.spyOn(garden,'attachCommunalGarden').mockImplementation((_room,_template,onChanged)=>{loaded=onChanged;return owner;});
 const r=fixture(),g=game();g.node={...g.node,templateId:'communal-atrium'};
 r.loadRoom(g.node);const refresh=vi.spyOn(r.ragdolls,'refreshStatic'),update=vi.spyOn(r.ragdolls,'update');
 expect(r.roomLoading).toBe(true);r.render(g,1/60);expect(update).not.toHaveBeenCalled();
 owner.state='ready';r.shadowsDirty=false;loaded();loaded();expect(r.shadowsDirty).toBe(true);
 r.render(g,1/60);r.render(g,1/60);expect(refresh).toHaveBeenCalledExactlyOnceWith(r.world);
 expect(refresh.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
 r.loadRoom({...g.node,id:'next',templateId:'security-lock'});expect(owner.dispose).toHaveBeenCalledTimes(1);
 r.shadowsDirty=false;loaded();expect(r.staticDirty).toBe(false);expect(r.shadowsDirty).toBe(false);r.dispose();
});
it('forwards elite metadata and preserves authoritative kills, credits and duplicate-death behavior',()=>{
 const r=fixture(),events:GameEffect[]=[],g=new DepthGame(e=>{events.push(e);r.effect(e);});
 const spawned=g.enemies.spawn('crawler',160,192,true);expect(spawned.spawned).toBe(true);if(!spawned.spawned)return;
 const credits=g.combat.snapshot.credits;const result=g.damage(spawned.enemy.id,100000);expect(result.died).toBe(true);expect(g.kills).toBe(1);expect(g.combat.snapshot.credits).toBeGreaterThan(credits);
 expect(events.filter(e=>e.type==='corpse')).toEqual([expect.objectContaining({elite:true,x:160,y:192})]);expect(r.actorPool.take).toHaveBeenCalledWith('crawler',true);
 const after=g.combat.snapshot.credits;g.damage(spawned.enemy.id,100000);expect(g.kills).toBe(1);expect(g.combat.snapshot.credits).toBe(after);expect(r.corpses).toHaveLength(1);r.dispose();
});
it('continues asset boot on injected physics rejection and restores unanimated bones on pool reuse',async()=>{
 const scene=new T.Group(),bone=new T.Bone();bone.name='chest';bone.position.set(.1,.2,.3);scene.add(bone,new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial()));
 const loader=vi.spyOn(GLTFLoader.prototype,'loadAsync').mockResolvedValue({scene,animations:[]} as unknown as GLTF),progress=vi.fn();
 await expect(preloadAssets(progress,()=>Promise.reject(new Error('WASM unavailable')))).resolves.toBeUndefined();expect(loader).toHaveBeenCalledTimes(ASSET_NAMES.length);expect(progress).toHaveBeenLastCalledWith(1);
 const pool=new ActorPool(),m=pool.take('crawler'),b=m.root.getObjectByName('chest')!;const original=b.position.clone();b.position.set(10,20,30);b.scale.setScalar(7);b.rotation.x=2;b.matrixAutoUpdate=false;pool.release(m);expect(pool.take('crawler')).toBe(m);expect(b.position.equals(original)).toBe(true);expect(b.scale.toArray()).toEqual([1,1,1]);expect(b.quaternion.toArray()).toEqual([0,0,0,1]);expect(b.matrixAutoUpdate).toBe(true);
 const r=fixture();r.actorPool=pool;r.actors.set(1,m);r.effect({type:'corpse',id:1,family:'crawler',x:160,y:160});const mesh=m.root.getObjectByProperty('isMesh',true) as T.Mesh,dispose=vi.spyOn(mesh.material as T.Material,'dispose');r.dispose();expect(dispose).toHaveBeenCalledTimes(1);expect(m.root.parent).toBeNull();expect(r.corpses).toHaveLength(0);
 const another=alien('crawler');expect(another.root.getObjectByName('chest')!.position.equals(original)).toBe(true);
});
