import {it,expect,vi,afterEach} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {generateRun} from '../src/game/roguelike/run';
import {disposeModel} from '../src/render/meshParts';
const nodes=generateRun(1729,3).nodes;
const node=(id:string)=>nodes.find(n=>n.templateId===id)!;
function renderer(){return Object.assign(Object.create(DepthRenderer.prototype),{
 scene:new T.Scene(),world:new T.Group(),effects:{setWorld(){},clear(){}},temporaryMaterials:[],actors:new Map(),nests:new Map(),queen:null,corpses:[],pickupMeshes:new Map(),
 afflictions:{clear(){}},muzzle:{intensity:0},contacts:{begin(){},end(){}},surfaces:{theme(){},shipTheme(){}},camera:new T.OrthographicCamera(-20,20,15,-15),focus:new T.Vector3(),lighting:{loadRoom:vi.fn()},
});}
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
it('loads optional pods on actual awakening-to-passenger entry without resetting the live room',async()=>{
 let resolve!:(x:any)=>void;const load=vi.spyOn(GLTFLoader.prototype,'loadAsync').mockImplementation(()=>new Promise(r=>{resolve=r;}));
 const r=renderer();r.loadRoom(node('awakening-bay'));expect(load).not.toHaveBeenCalled();
 r.loadRoom(node('passenger-vault'));const world=r.world;expect(load).toHaveBeenCalledTimes(1);
 expect(world.children.find((o:T.Object3D)=>o.name==='authored-passenger-vault').userData.cryoPodCount).toBeUndefined();
 const departed=renderer();departed.loadRoom(node('passenger-vault'));departed.loadRoom(node('awakening-bay'));const laterWorld=departed.world;
 const pod=new T.Group();pod.add(new T.Mesh(new T.BoxGeometry(.5,.5,.5),new T.MeshStandardMaterial()));resolve({scene:pod});
 await vi.waitFor(()=>expect(world.children.find((o:T.Object3D)=>o.name==='authored-passenger-vault').userData.cryoPodCount).toBe(28));
 expect(r.world).toBe(world);expect(departed.world).toBe(laterWorld);
 expect(laterWorld.children.some((o:T.Object3D)=>o.name==='authored-passenger-vault')).toBe(false);
 disposeModel(world);disposeModel(laterWorld);
});
it('bounds optional transfer wait and ignores a timed-out late result',async()=>{
 vi.resetModules();vi.useFakeTimers();const {prepareCryoBenchmark,cryoBenchmarkTemplate}=await import('../src/render/CryoBenchmark');
 let resolve!:(x:any)=>void;vi.spyOn(GLTFLoader.prototype,'loadAsync').mockImplementation(()=>new Promise(r=>{resolve=r;}));
 let done=false;const pending=prepareCryoBenchmark('passenger-vault').then(()=>{done=true;});
 await vi.advanceTimersByTimeAsync(5000);expect(done).toBe(true);await pending;
 resolve({scene:new T.Group()});await Promise.resolve();expect(cryoBenchmarkTemplate()).toBeUndefined();
});
