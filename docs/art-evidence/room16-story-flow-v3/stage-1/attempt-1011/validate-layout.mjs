import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(process.argv[2]||path.join(dir,'../../../../../..'));
const out=path.resolve(process.argv[3]||path.join(dir,'cpu-validation.json'));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'source-manifest.json')));
for(const [name,sha] of Object.entries(manifest.sources)){
 if(!name.startsWith('src/'))continue;
 if(crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,name))).digest('hex')!==sha)throw Error('Source drift: '+name);
}
// Hash every transitive production import before importing the real functions.
const loaded={};
function pin(name){
 if(loaded[name])return;
 const data=fs.readFileSync(path.join(repo,name),'utf8');
 loaded[name]=crypto.createHash('sha256').update(data).digest('hex');
 for(const match of data.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
  let dep=path.normalize(path.join(path.dirname(name),match[1]));
  if(!path.extname(dep))dep+='.ts';
  pin(dep);
 }
}
pin('src/game/world/expeditionGeometry.ts');
const {createExpeditionGeometry,canOccupyExpedition:occupy,canTraverseExpedition:traverse}=await import(pathToFileURL(path.join(repo,'src/game/world/expeditionGeometry.ts')));
const base=createExpeditionGeometry({id:'room16-layout-cpu',templateId:'swarm-junction'});
const layout=JSON.parse(fs.readFileSync(path.join(dir,'layout.json')));
const point=([x,y])=>({x,y});
const proposed={...base,blockers:base.boundaryWalls,voids:[layout.organPolygon.map(point)]};
const baseline={bounds:base.bounds,boundary:base.boundary||null,voids:base.voids||[],obstacles:base.blockers.slice(base.boundaryWalls.length),spawn:base.playerSpawn,exit:base.exitPoint,bossSpawn:base.bossSpawn,breaches:base.breaches};
const results=[];
for(const [variant,g] of [['baseline',base],['proposed',proposed]])for(const radius of [16,28]){
 const anchors={entry:g.playerSpawn,exit:g.exitPoint,centerCompatibility:g.bossSpawn,...Object.fromEntries(Object.entries(layout.arms).map(([k,v])=>['arm-'+k,point(v)])),...Object.fromEntries(Object.entries(layout.activities).map(([k,v])=>[k,point(v)])),...Object.fromEntries(g.breaches.flatMap((b,i)=>[['breach-'+i,b],['emergence-'+i,{x:b.x+(b.facing==='east'?56:-56),y:b.y}]]))};
 const anchorChecks=Object.entries(anchors).map(([id,p])=>({id,point:p,occupancy:occupy(g,p,radius),stationaryTraversal:traverse(g,p,p,radius)}));
 const checkRoutes={...layout.routes,...Object.fromEntries(g.breaches.map((b,i)=>['breach-offset-'+i,[[b.x,b.y],[b.x+(b.facing==='east'?56:-56),b.y]]])), 'activity-combat':[[600,440],[600,480]],'activity-south-turn':[[600,480],[600,650],[600,740]]};
 const routes=Object.entries(checkRoutes).map(([id,points])=>({id,segments:points.slice(1).map((p,i)=>({from:point(points[i]),to:point(p),pass:traverse(g,point(points[i]),point(p),radius)}))}));
 // Sampled 20-unit grid, using exactly the same production predicate for nodes and edges.
 const nodes=new Map(),occupancyOnly=[];
 for(let y=40;y<g.bounds.height;y+=20)for(let x=40;x<g.bounds.width;x+=20){const p={x,y};if(occupy(g,p,radius)){if(traverse(g,p,p,radius))nodes.set(`${x},${y}`,p);else occupancyOnly.push(p);}}
 const unseen=new Set(nodes.keys()),components=[];
 while(unseen.size){const seed=unseen.values().next().value;unseen.delete(seed);const queue=[seed];for(let i=0;i<queue.length;i++){const p=nodes.get(queue[i]);for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const key=`${p.x+dx},${p.y+dy}`;if(unseen.has(key)&&traverse(g,p,nodes.get(key),radius)){unseen.delete(key);queue.push(key);}}}components.push(queue.length);}
 results.push({variant,radius,anchors:anchorChecks,routes,grid:{spacing:20,nodeCount:nodes.size,components,occupancyOnlyDiagnostics:occupancyOnly},requiredRoutePass:routes.every(r=>r.segments.every(s=>s.pass)),anchorPass:anchorChecks.every(a=>a.occupancy&&a.stationaryTraversal)});
}
const proposalResults=results.filter(r=>r.variant==='proposed');
const result={sourceCommit:manifest.commit,productionImports:loaded,baseline,proposal:layout,results,pass:proposalResults.every(r=>r.requiredRoutePass&&r.anchorPass&&r.grid.components.length===1),limits:'CPU occupancy and swept segments plus sampled connectivity only. Not enemy AI, continuous-space proof, combat stress, camera visibility or art approval.'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,pass:result.pass,summary:results.map(({variant,radius,requiredRoutePass,anchorPass,grid})=>({variant,radius,requiredRoutePass,anchorPass,grid}))},null,2));
if(!result.pass)process.exitCode=1;
