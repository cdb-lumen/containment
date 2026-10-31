import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createExpeditionGeometry,canOccupyExpedition as occupy,canTraverseExpedition as traverse} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3/src/game/world/expeditionGeometry.ts';
import {clearPolygonTopology} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3/src/game/world/polygonGeometry.ts';
import {ROOM_TEMPLATES} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/overload-floor-v3/src/game/roguelike/roomTemplates.ts';
const out=path.dirname(fileURLToPath(import.meta.url));
const geom=createExpeditionGeometry({id:'room20-layout-check',templateId:'overload-floor'});
const p=(x,y)=>({x,y});
const heads=[{id:'coolant',bounds:[480,340,540,410]},{id:'power',bounds:[660,340,720,410]},{id:'restraint',bounds:[565,480,635,540]}];
const core=[570,365,630,465];
const loop=[p(340,440),p(400,240),p(600,180),p(800,240),p(860,440),p(800,640),p(600,640),p(400,640)];
const anchors={spawn:geom.playerSpawn,compatibility:geom.exitPoint,...Object.fromEntries(geom.breaches.map((b,i)=>['breach'+(i+1),p(b.x,b.y)])),...Object.fromEntries(geom.breaches.map((b,i)=>['inward'+(i+1),p(b.x+(b.facing==='east'?56:-56),b.y)])),west:p(340,440),north:p(600,180),east:p(860,440),south:p(600,640),'coolant-view':p(365,400),'power-view':p(835,400),'restraint-view':p(600,600)};
const tests=[];
function check(name,actual,expected=true){tests.push({name,expected,actual,passed:actual===expected});}
function corners(b){const [x,y,X,Y]=b;return [p(x,y),p(X,y),p(X,Y),p(x,Y)];}
function fits(b){const ps=corners(b);return ps.every((a,i)=>clearPolygonTopology({boundary:geom.voids[0]},a,ps[(i+1)%4],0));}
check('canonical empty obstacles',ROOM_TEMPLATES['overload-floor'].obstacles.length===0);
check('four canonical breaches',geom.breaches.length===4);
for(const h of [...heads,{id:'axial-core',bounds:core}])check(h.id+' complete rectangle strictly within void',fits(h.bounds));
check('negative protruding head is rejected',fits([390,380,450,430]),false);
const routes={};
const connectors=Object.entries(anchors).filter(([id])=>id!=='compatibility'&&!id.startsWith('inward')).map(([id,a])=>{
 const b=loop.filter(b=>traverse(geom,a,b,28)).sort((b,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y))[0];
 return {id,points:[a,b]};
});
for(const r of [16,28])for(const c of connectors)check(`r${r} diagram connector ${c.id}`,!!c.points[1]&&traverse(geom,...c.points,r));
function network(g,r){
 const entries=Object.entries(anchors); const points=[...entries.map(([,v])=>v),...loop];
 const adjacency=points.map((a,i)=>points.flatMap((b,j)=>i!==j&&traverse(g,a,b,r)?[j]:[]));
 const prev=new Map([[0,null]]),q=[0];
 for(let n=0;n<q.length;n++)for(const j of adjacency[q[n]])if(!prev.has(j)){prev.set(j,q[n]);q.push(j);}
 const paths={};
 for(let i=0;i<entries.length;i++)if(prev.has(i)){const ids=[];for(let j=i;j!==null;j=prev.get(j))ids.push(j);paths[entries[i][0]]=ids.reverse().map(j=>points[j]);}
 return {paths,connected:entries.every(([id])=>id in paths)};
}
for(const r of [16,28]){
 for(const [name,a] of Object.entries(anchors))check(`r${r} occupy ${name}`,occupy(geom,a,r));
 loop.forEach((a,i)=>{const b=loop[(i+1)%loop.length];check(`r${r} loop segment ${i} forward`,traverse(geom,a,b,r));check(`r${r} loop segment ${i} reverse`,traverse(geom,b,a,r));});
 const n=network(geom,r);routes[r]=n.paths;
 for(const name of Object.keys(anchors))check(`r${r} spawn connected to ${name}`,name in n.paths);
 for(const [name,ps] of Object.entries(n.paths))check(`r${r} stored path ${name} segment recheck`,ps.every((a,i)=>i===0||traverse(geom,ps[i-1],a,r)));
 check(`r${r} reject void center`,occupy(geom,p(600,430),r),false);
 check(`r${r} reject outside boundary`,occupy(geom,p(20,440),r),false);
 check(`r${r} reject lower concave notch`,occupy(geom,p(600,780),r),false);
 check(`r${r} reject body overlapping void edge`,occupy(geom,p(600,299),r),false);
 check(`r${r} reject cross-core shortcut`,traverse(geom,p(340,440),p(860,440),r),false);
 check(`r${r} reject concave-notch shortcut`,traverse(geom,p(350,770),p(850,770),r),false);
 const cut={...geom,blockers:[...geom.blockers,{x:580,y:0,width:40,height:880}]};
 check(`r${r} injected full-height obstruction breaks connectivity`,network(cut,r).connected,false);
}
const result={scope:'CPU stage1 geometry only. No acceptance or runtime implementation.',heads,core,anchors,loop,connectors,geometry:geom,routes,tests,summary:{total:tests.length,passed:tests.filter(t=>t.passed).length,failures:tests.filter(t=>!t.passed).length,errors:0}};
// Numbered records preserve every execution, including failed checks.
let attempt=1;while(fs.existsSync(path.join(out,`route-results-run-${attempt}.json`)))attempt++;
fs.writeFileSync(path.join(out,`route-results-run-${attempt}.json`),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(out,'route-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({run:attempt,...result.summary}));
process.exitCode=result.summary.failures?1:0;
