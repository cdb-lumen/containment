import {writeFileSync} from 'node:fs';
import {beforeAll,it} from 'vitest';
import * as T from 'three';
import {loadModels} from './loadModels';
import {marine,alien,disposeModel} from '../src/render/models';
import {ActorPool} from '../src/render/ActorPool';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {generateRun} from '../src/game/roguelike/run';
beforeAll(loadModels);
it.skipIf(!process.env.PROFILE_GAME)('reports CPU costs without GPU or browser claims',()=>{
 const stats=(a:number[])=>{a.sort((a,b)=>a-b);return{median:+a[Math.floor(a.length*.5)].toFixed(3),p95:+a[Math.floor(a.length*.95)].toFixed(3),max:+a.at(-1)!.toFixed(3)};};
 const models=[marine(),...Array.from({length:18},(_,i)=>alien(['crawler','brute','spitter','stalker','carrier'][i%5]))];let skeletons=new Set<T.Skeleton>(),meshes=0;models[0].root.traverse(o=>{if(o instanceof T.SkinnedMesh){skeletons.add(o.skeleton);meshes++;}});const frame:number[]=[];
 for(let f=0;f<360;f++){const start=performance.now();for(const m of models){m.animate(f/60,1,.2,0,0,{x:220,y:0});m.root.updateMatrixWorld(true);const visited=new Set<T.Skeleton>();m.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&!visited.has(o.skeleton)){visited.add(o.skeleton);o.skeleton.update();}});}if(f>60)frame.push(performance.now()-start);}models.forEach(m=>disposeModel(m.root));
 const spawns:number[]=[];for(let i=0;i<50;i++){const start=performance.now(),m=alien(['crawler','brute','spitter','stalker','carrier'][i%5]);m.animate(0,1,0);spawns.push(performance.now()-start);disposeModel(m.root);}
 const pool=new ActorPool(),pooledSpawn:number[]=[];for(const kind of ['crawler','brute','spitter','stalker','carrier']){const m=pool.take(kind);m.prepare?.();pool.release(m);}for(let i=0;i<50;i++){const start=performance.now(),m=pool.take(['crawler','brute','spitter','stalker','carrier'][i%5]);m.animate(0,1,0);pooledSpawn.push(performance.now()-start);pool.release(m);}pool.dispose();
 const c=new CombatSystem();c.setBuild({mutations:['cryogenic','breacher','hot-reload','volatile-remains']});const early:number[]=[],late:number[]=[];for(let i=0;i<2000;i++){const start=performance.now();c.resolveMutationEvent({type:'hit',id:`hit-${i}`,cause:{chainId:`shot-${i}`,depth:0},weapon:'rifle',targetId:'1',direction:{x:1,y:0},chilledStacks:0});const cost=performance.now()-start;if(i<100)early.push(cost);if(i>=1900)late.push(cost);}
 const g=createExpeditionGeometry(generateRun(42,2).nodes[0]),nav=new FacilityNavigation(g),navigation:number[]=[];nav.prepare(g.playerSpawn,1);for(let i=0;i<100;i++){const start=performance.now();nav.prepare({x:g.playerSpawn.x+(i%2)*40,y:g.playerSpawn.y},1);navigation.push(performance.now()-start);}
 writeFileSync(process.env.PROFILE_GAME!,JSON.stringify({marine:{meshes,skeletons:skeletons.size},actorFrame:stats(frame),spawn:stats(spawns),pooledSpawn:stats(pooledSpawn),earlyBoon:stats(early),lateBoon:stats(late),navigation:stats(navigation)},null,2));
});
