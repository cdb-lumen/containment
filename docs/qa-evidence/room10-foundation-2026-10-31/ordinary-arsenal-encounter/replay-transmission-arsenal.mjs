import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
import * as T from '/workspace/containment-ci/node_modules/three/build/three.module.js';
const [root,out,label='candidate']=process.argv.slice(2);assert(root&&out,'Specify source worktree and capture directory');
const m=JSON.parse(await readFile(out+'/manifest.json','utf8'));
assert(['passed','failed'].includes(m.state),'Only replay terminal preserved captures');assert.equal(m.room,'transmission-chamber');assert(Array.isArray(m.weaponSelections));assert(Array.isArray(m.frames)&&m.frames.length>0,'Nonempty recording required');assert(m.frames.every((f,i)=>f.i===i),'Contiguous frame indices required');assert(m.weaponSelections.every((s,i)=>Number.isInteger(s.frame)&&s.frame>=0&&s.frame<m.frames.length&&(!i||s.frame>m.weaponSelections[i-1].frame)&&['pistol','rifle','shotgun','plasma','rocket'].includes(s.weapon)),'Ordered unique valid native weapon selections required');if(m.state==='passed'){assert.equal(m.sourceAfter?.hash,m.sourceBefore.hash);assert.equal(m.sourceAfter?.commit,m.sourceBefore.commit);assert.equal(m.sourceAfter?.status,'');}
const actualSource=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(label==='candidate'){assert.equal(actualSource,m.sourceBefore.commit);for(const file of m.sourceBefore.files)assert.equal(createHash('sha256').update(await readFile(join(root,file.path))).digest('hex'),file.sha256,file.path);}
globalThis.__movementLog=[];globalThis.__replayFrame=-1;
const original='canMove:c=>canTraverseExpedition(this.geometry,{x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius)';
const replacement='canMove:c=>{const allowed=canTraverseExpedition(this.geometry,{x:c.fromX,y:c.fromY},{x:c.toX,y:c.toY},c.radius);globalThis.__movementLog.push({frame:globalThis.__replayFrame,...c,allowed});return allowed;}';
let transformed=0;
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false},logLevel:'error',plugins:[{name:'observe-movement',enforce:'pre',transform(code,id){if(id.endsWith('/src/DepthGame.ts')){assert(code.includes(original));transformed++;return code.replace(original,replacement);}}}]});
const result={source:actualSource,captureSource:m.sourceBefore.commit,label,framesMatched:0,matchedThrough:null,errors:[]};
try{
 const {DepthGame}=await server.ssrLoadModule('/src/DepthGame.ts');
 const {CHECKPOINT_STORAGE_KEY}=await server.ssrLoadModule('/src/game/roguelike/checkpoints.ts');
 const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts');
 const values=new Map([[CHECKPOINT_STORAGE_KEY,JSON.stringify(m.checkpoint)]]);
 const game=new DepthGame(()=>{},{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)});
 assert(game.continueRun());const n=generateRun(m.checkpoint.run.seed,m.checkpoint.run.version).nodes.find(n=>n.templateId===m.room);assert(n);game.route(n.id);assert.equal(game.node.templateId,m.room);assert.equal(game.status,'playing');
 game.update(1000/60);game.switchWeapon(m.initialWeapon);
 const camera=new T.Camera();
 for(const f of m.frames){
  globalThis.__replayFrame=f.i;
  const prev=m.frames[Math.max(0,f.i-1)];camera.position.fromArray(prev.camera.position);camera.quaternion.fromArray(prev.camera.quaternion);camera.projectionMatrix.fromArray(prev.camera.projection);camera.updateMatrixWorld(true);
  game.aimVisible=(x,y)=>{const p=new T.Vector3(x/32,.6,y/32).project(camera);return Math.abs(p.x)<.9&&Math.abs(p.y)<.8;};
  if(f.i%4===0||((m.frames[f.i-1]?.routeIndex??0)<6&&f.i%2===0)){
   const s=game.combat.snapshot,es=game.enemies.snapshot.enemies,p=game.player;
   const grenade=f.i%40===0&&es.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<300).length>=3,heal=s.health<60&&s.medkits>0,reload=s.magazine===0;
   const selection=m.weaponSelections.find(x=>x.frame===f.i);
   if(selection)game.switchWeapon(selection.weapon);
   if(grenade)game.grenade();if(heal)game.heal();if(!selection&&reload)game.reload();
  }
  game.update(50,f.input);
  assert.equal(game.combat.snapshot.weaponId,f.weapon,`weapon frame${f.i}`);assert.equal(game.combat.snapshot.reloading,f.reloading,`reload frame${f.i}`);assert.deepEqual(game.combat.getRunResources().ammo,f.ammo,`ammo frame${f.i}`);
  const actual=game.enemies.snapshot.enemies;
  assert.equal(actual.length,f.enemies.length,`enemy count frame${f.i}`);
  for(const expected of f.enemies){const a=actual.find(e=>e.id===expected.id);assert(a);for(const key of ['x','y','health','armor'])assert(Math.abs(a[key]-expected[key])<1e-8,`frame${f.i} enemy${a.id} ${key}: ${a[key]} != ${expected[key]}`);}
  for(const key of ['x','y','angle'])assert(Math.abs(game.player[key]-f.player[key])<1e-8,`player ${key} frame${f.i}`);
  assert.equal(game.kills,f.kills);assert.equal(game.encounterRemaining,f.remaining);assert.equal(game.status,f.status);assert(Math.abs(game.elapsed-f.elapsed)<1e-9);assert.equal(game.combat.snapshot.health,f.health);assert.equal(game.combat.snapshot.armor,f.armor);
  result.framesMatched++;result.matchedThrough=f.i;
 }
 assert.equal(transformed,1);result.acceptedMoves=globalThis.__movementLog.filter(x=>x.allowed&&(x.fromX!==x.toX||x.fromY!==x.toY)).length;
}catch(e){result.errors.push(String(e));process.exitCode=1;}finally{
 result.captureManifestSha256=createHash('sha256').update(await readFile(out+'/manifest.json')).digest('hex');
 result.replayScriptSha256=createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
 await writeFile(out+'/arsenal-combat-replay-'+label+'.json',JSON.stringify(result,null,2)+'\n');
 await writeFile(out+'/arsenal-movement-segments-'+label+'.json',JSON.stringify(globalThis.__movementLog,null,2)+'\n');
 console.log(JSON.stringify(result));await server.close();
}
