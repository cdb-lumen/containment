import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
import * as T from '/workspace/containment-ci/node_modules/three/build/three.module.js';
const root='/workspace/containment-room17-swept',out='/workspace/room17-desktop-repaired-final';
const m=JSON.parse(await readFile(out+'/manifest.json','utf8'));
globalThis.__movementLog=[];globalThis.__replayFrame=-1;
const original='canMove:c=>canTraverseExpedition(this.geometry,{x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius)';
const replacement='canMove:c=>{const allowed=canTraverseExpedition(this.geometry,{x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius);globalThis.__movementLog.push({frame:globalThis.__replayFrame,...c,allowed});return allowed;}';
let transformed=0;
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false},logLevel:'error',plugins:[{name:'observe-movement',enforce:'pre',transform(code,id){if(id.endsWith('/src/DepthGame.ts')){assert(code.includes(original));transformed++;return code.replace(original,replacement);}}}]});
const result={source:m.sourceBefore.commit,framesMatched:0,matchedThrough:null,errors:[]};
try{
 const {DepthGame}=await server.ssrLoadModule('/src/DepthGame.ts');
 const {CHECKPOINT_STORAGE_KEY}=await server.ssrLoadModule('/src/game/roguelike/checkpoints.ts');
 const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts');
 const values=new Map([[CHECKPOINT_STORAGE_KEY,JSON.stringify(m.checkpoint)]]);
 const game=new DepthGame(()=>{},{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)});
 assert(game.continueRun());const n=generateRun(m.checkpoint.run.seed,m.checkpoint.run.version).nodes.find(n=>n.templateId===m.room);game.route(n.id);
 game.update(1000/60);game.switchWeapon(m.initialWeapon);
 const camera=new T.Camera();
 for(const f of m.frames){
  globalThis.__replayFrame=f.i;
  const prev=m.frames[Math.max(0,f.i-1)];camera.position.fromArray(prev.camera.position);camera.quaternion.fromArray(prev.camera.quaternion);camera.projectionMatrix.fromArray(prev.camera.projection);camera.updateMatrixWorld(true);
  game.aimVisible=(x,y)=>{const p=new T.Vector3(x/32,.6,y/32).project(camera);return Math.abs(p.x)<.9&&Math.abs(p.y)<.8;};
  if(f.i%4===0){const s=game.combat.snapshot,es=game.enemies.snapshot.enemies,p=game.player;
   const grenade=f.i%40===0&&es.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<300).length>=3,heal=s.health<60&&s.medkits>0,reload=s.magazine===0,pistol=s.reserve===0&&s.magazine===0;
   if(grenade)game.grenade();if(heal)game.heal();if(reload)game.reload();if(pistol)game.switchWeapon('pistol');
  }
  game.update(50,f.input);
  const actual=game.enemies.snapshot.enemies;
  assert.equal(actual.length,f.enemies.length,`enemy count frame${f.i}`);
  for(const expected of f.enemies){const a=actual.find(e=>e.id===expected.id);assert(a);for(const key of ['x','y','health','armor'])assert(Math.abs(a[key]-expected[key])<1e-8,`frame${f.i} enemy${a.id} ${key}: ${a[key]} != ${expected[key]}`);}
  for(const key of ['x','y','angle'])assert(Math.abs(game.player[key]-f.player[key])<1e-8,`player ${key} frame${f.i}`);
  assert.equal(game.kills,f.kills);assert.equal(game.encounterRemaining,f.remaining);assert.equal(game.status,f.status);assert(Math.abs(game.elapsed-f.elapsed)<1e-9);assert.equal(game.combat.snapshot.health,f.health);assert.equal(game.combat.snapshot.armor,f.armor);
  result.framesMatched++;result.matchedThrough=f.i;
 }
 assert.equal(transformed,1);result.acceptedMoves=globalThis.__movementLog.filter(x=>x.allowed&&(x.fromX!==x.toX||x.fromY!==x.toY)).length;
}catch(e){result.errors.push(String(e));process.exitCode=1;}finally{
 result.witness=globalThis.__movementLog.filter(x=>x.frame===235&&x.enemyId===3);
 await writeFile(out+'/movement-replay.json',JSON.stringify(result,null,2)+'\n');
 await writeFile(out+'/movement-segments.json',JSON.stringify(globalThis.__movementLog,null,2)+'\n');
 console.log(JSON.stringify(result));await server.close();
}
