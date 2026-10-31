#!/usr/bin/env node
// Run: node test-layout.mjs /absolute/path/to/containment
// CPU only. Loads production TypeScript using Node 22 hooks and installed TypeScript.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(process.argv[2] || '.');
const here=path.dirname(fileURLToPath(import.meta.url));
const d=JSON.parse(fs.readFileSync(path.join(here,'layout-data.json')));
const require=createRequire(path.join(root,'package.json'));
const ts=require('typescript');
const {registerHooks}=await import('node:module');
const {pathToFileURL}=await import('node:url');
registerHooks({
 resolve(specifier,context,next){
  if(specifier.startsWith('.')&&context.parentURL?.endsWith('.ts')&&!path.extname(specifier))return next(specifier+'.ts',context);
  return next(specifier,context);
 },
 load(url,context,next){
  if(url.endsWith('.ts'))return {format:'module',shortCircuit:true,source:ts.transpileModule(fs.readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
  return next(url,context);
 }
});
const load=f=>import(pathToFileURL(path.join(root,f)).href);
const p={...await load('src/game/world/expeditionGeometry.ts'),...await load('src/game/roguelike/roomTemplates.ts'),...await load('src/game/enemies/catalog.ts')};
const g=p.createExpeditionGeometry({id:'room17-layout-cpu',templateId:d.template});
const t=p.ROOM_TEMPLATES[d.template];
const pt=([x,y])=>({x,y});
const rect=([x,y,width,height])=>({x,y,width,height});
const occupy=(point,r)=>p.canOccupyExpedition(g,point,r);
const sweep=(a,b,r)=>p.canTraverseExpedition(g,a,b,r);
let failures=0,passed=0; const diagnostics={};
function check(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){failures++;console.log('FAIL '+name+'\n'+e.stack);}}
check('source pins match production files',()=>{
 for(const [f,hash] of Object.entries(d.source_sha256))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'),hash,f);
});
check('shared diagram data equals actual production topology and anchors',()=>{
 assert.equal(t.width,d.bounds[2]);assert.equal(t.height,d.bounds[3]);
 assert.equal(t.boundary,undefined);assert.equal(t.voids,undefined);
 assert.deepEqual(t.obstacles,d.solids.map(s=>rect(s.rect)));
 assert.deepEqual(t.spawn,pt(d.spawn));assert.deepEqual(t.exit,pt(d.exit));
 assert.deepEqual(t.breaches,d.breaches.map(pt));
});
check('visual reservations contained in their existing solids',()=>{
 for(const v of d.visual_reservations){const a=rect(v.rect),b=rect(d.solids.find(s=>s.id===v.owner).rect);
 assert.ok(a.x>=b.x&&a.y>=b.y&&a.x+a.width<=b.x+b.width&&a.y+a.height<=b.y+b.height,v.id);}
 assert.equal(d.contract.topology,'unchanged');
});
const radii=[...new Set(p.STANDARD_ENEMY_IDS.map(id=>p.ENEMIES[id].radius))].sort((a,b)=>a-b);
diagnostics.standardEnemyRadii=radii;
for(const r of radii){
 check(`all routes sweep in both directions at standard enemy radius ${r}`,()=>{
  for(const route of d.routes){const points=route.points.map(pt);assert.deepEqual(points[0],t.spawn);assert.deepEqual(points.at(-1),t.exit);
   for(let i=1;i<points.length;i++){assert.ok(sweep(points[i-1],points[i],r),route.id+' segment '+i);assert.ok(sweep(points[i],points[i-1],r));}}
 });
}
check('all route corridors support 100-unit width',()=>{
 for(const route of d.routes){const points=route.points.map(pt);for(let i=1;i<points.length;i++)assert.ok(sweep(points[i-1],points[i],route.half_width),route.id+' segment '+i);}
});
check('activity areas remain clear with radius-28 actors throughout sampled discs',()=>{
 for(const a of d.activities){const c=pt(a.center);assert.ok(occupy(c,a.radius+28),a.id+' full disc');
  for(let angle=0;angle<360;angle+=15){const rad=angle*Math.PI/180;const q={x:c.x+Math.cos(rad)*a.radius,y:c.y+Math.sin(rad)*a.radius};assert.ok(sweep(c,q,28),a.id+' spoke '+angle);}}
});
check('open threshold floor, bidirectional crossing and straight shot',()=>{
 const [a,b]=d.threshold.axis.map(pt);assert.ok(sweep(a,b,28));assert.ok(sweep(b,a,28));
 assert.ok(p.hasClearExpeditionShot(g,a,b));assert.ok(p.hasClearExpeditionShot(g,b,a));
 const r=rect(d.threshold.rect);for(let x=r.x+30;x<=r.x+r.width-30;x+=10)for(let y=r.y+30;y<=r.y+r.height-30;y+=10)assert.ok(occupy({x,y},28));
});
check('existing solids still reject occupation and through-solid shots',()=>{
 for(const s of d.solids){const r=rect(s.rect);assert.equal(occupy({x:r.x+r.width/2,y:r.y+r.height/2},28),false);
 assert.equal(p.hasClearExpeditionShot(g,{x:r.x-40,y:r.y+r.height/2},{x:r.x+r.width+40,y:r.y+r.height/2}),false);}
});
check('20-unit sampled traversable floor is connected and all anchors join it',()=>{
 const nodes=new Map(), mismatches=[];const key=q=>q.x+','+q.y;
 for(let x=40;x<1200;x+=20)for(let y=40;y<880;y+=20){const q={x,y};if(occupy(q,28)){if(sweep(q,q,28))nodes.set(key(q),q);else mismatches.push(q);}}
 // Conservative production sweep also defines graph admission. Keep excluded corners visible in diagnostics.
 diagnostics.occupancySweepMismatch=mismatches;diagnostics.gridNodes=nodes.size;
 const start=nodes.get(key(t.spawn));assert.ok(start);const seen=new Set([key(start)]),queue=[start];
 for(let i=0;i<queue.length;i++){const a=queue[i];for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const k=key({x:a.x+dx,y:a.y+dy}),b=nodes.get(k);if(b&&!seen.has(k)&&sweep(a,b,28)){seen.add(k);queue.push(b);}}}
 diagnostics.reachedNodes=seen.size;assert.equal(seen.size,nodes.size);
 const anchors=[t.spawn,t.exit,...t.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y})),...d.activities.map(a=>pt(a.center)),...d.threshold.axis.map(pt)];
 for(const a of anchors){assert.ok(occupy(a,28),JSON.stringify(a));assert.ok(queue.some(b=>Math.hypot(a.x-b.x,a.y-b.y)<=40&&sweep(a,b,28)),JSON.stringify(a));}
 diagnostics.connectedAnchors=anchors.length;
});
console.log(JSON.stringify({passed,failures,errors:0,diagnostics,limits:'CPU static geometry only. Grid sampling is not continuous-space proof. No live combat, mesh overhang, camera or art acceptance claim.'},null,2));
process.exitCode=failures?1:0;
