import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3/src/game/world/expeditionGeometry';
import {FacilityNavigation} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3/src/game/world/FacilityNavigation';
import {ROOM_TEMPLATES} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3/src/game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/service-shaft-landing-v3/src/game/roguelike/storyRooms';
const dir=path.dirname(new URL(import.meta.url).pathname);
const d=JSON.parse(fs.readFileSync(path.join(dir,'layout.json'),'utf8'));
const pt=([x,y]:number[])=>({x,y});
const base=createExpeditionGeometry({id:'room14-layout-check',templateId:d.room} as any);
const candidate={...base, blockers:base.boundaryWalls, voids:[d.shaft.map(pt)]};
const results:any[]=[];
function check(name:string,fn:()=>unknown){try{fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:String(e)});}}
check('Preserved envelope, spawn, exit and breach anchors',()=>{
 assert.equal(d.width,base.bounds.width);assert.equal(d.height,base.bounds.height);
 assert.deepEqual(pt(d.spawn),base.playerSpawn);assert.deepEqual(pt(d.exit),base.exitPoint);
 assert.deepEqual(d.breaches.map(pt),base.breaches.map(({x,y})=>({x,y})));
});
check('Exact canonical below-landing story',()=>assert.equal(d.story,ROOM_STORY_ROUTE.find(r=>r.templateId===d.room)!.story));
const starts=base.breaches.flatMap(({x,y,facing},i)=>[{id:`breach-${i}`,x,y},{id:`spawn-offset-${i}`,x:x+(facing==='east'?56:-56),y}]);
const anchors=[{id:'entry',...base.playerSpawn},{id:'exit',...base.exitPoint},...starts,...Object.entries(d.activity_centers).map(([id,p])=>({id,...pt(p as number[])}))];
const connectivity:any[]=[];
for(const [label,g] of [['baseline',base],['proposal',candidate]] as const){
 const checkedAnchors=label==='baseline'?anchors.filter(p=>['entry','exit'].includes(p.id)||p.id.startsWith('breach-')||p.id.startsWith('spawn-offset-')):anchors;
 for(const radius of [16,28,30]){
  check(`${label}: all scoped anchors occupy at radius ${radius}`,()=>{for(const p of checkedAnchors)assert.ok(canOccupyExpedition(g,p,radius),p.id);});
  // Exhaustive four-neighbor lattice; production occupancy AND swept-edge checks.
  const cells=new Map<string,{x:number,y:number}>();
  const occupancyOnly:any[]=[];
  for(let y=40;y<=840;y+=20)for(let x=40;x<=1160;x+=20){const p={x,y};if(canOccupyExpedition(g,p,radius)){if(canTraverseExpedition(g,p,p,radius))cells.set(`${x},${y}`,p);else occupancyOnly.push(p);}}
  // Rectangular blockers have conservative square-expanded sweeps. Preserve
  // occupancy-only corner/tangent diagnostics instead of calling them routes.
  const first=cells.keys().next().value!;const visited=new Set([first]);const queue=[first];
  for(let i=0;i<queue.length;i++){const p=cells.get(queue[i])!;for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const key=`${p.x+dx},${p.y+dy}`,q=cells.get(key);if(q&&!visited.has(key)&&canTraverseExpedition(g,p,q,radius)){visited.add(key);queue.push(key);}}}
  connectivity.push({geometry:label,radius,spacing:20,legalCells:cells.size,reachedCells:visited.size,occupancyOnly});
  check(`${label}: every sweep-legal lattice cell connected at radius ${radius}`,()=>assert.equal(visited.size,cells.size));
  check(`${label}: exact scoped anchors connect to reachable lattice at radius ${radius}`,()=>{for(const p of checkedAnchors)assert.ok([...cells].some(([key,q])=>visited.has(key)&&Math.hypot(p.x-q.x,p.y-q.y)<=40&&canTraverseExpedition(g,p,q,radius)),p.id);});
 }
}
for(const radius of [16,28,30]){
 for(const [name,route] of Object.entries(d.routes))check(`proposal: every ${name} segment swept at radius ${radius}`,()=>{const points=(route as number[][]).map(pt);for(let i=1;i<points.length;i++)assert.ok(canTraverseExpedition(candidate,points[i-1],points[i],radius),`segment ${i}`);});
 check(`proposal: shaft and east shortcut reject radius ${radius}`,()=>{
  for(const p of [[600,440],[1040,590],[341,400]])assert.equal(canOccupyExpedition(candidate,pt(p),radius),false);
  assert.equal(canTraverseExpedition(candidate,pt([1040,440]),pt([1040,740]),radius),false);
  assert.equal(canTraverseExpedition(candidate,base.playerSpawn,base.exitPoint,radius),false);
 });
}
check('Fixtures remain wholly inside the shaft, no walkable overhang',()=>{
 for(const f of d.fixtures_inside_shaft){const [x,y,w,h]=f.rect;for(let yy=y+1;yy<y+h;yy+=2)for(let xx=x+1;xx<x+w;xx+=2)assert.equal(canOccupyExpedition(candidate,{x:xx,y:yy},0),false,f.id);}
});
// Exercise actual navigation waypoints with bounded CPU stepping, not combat.
const navTrips:any[]=[];
for(const goal of [base.playerSpawn,base.exitPoint,pt([760,740])])for(const start of anchors){
 const nav=new FacilityNavigation(candidate);let p={x:start.x,y:start.y},steps=0;
 nav.prepare(goal,0);
 check(`production navigation: ${start.id} to ${goal.x}/${goal.y} reachable`,()=>assert.ok(nav.reachable(p)));
 let error:string|null=null;
 for(;steps<4000&&Math.hypot(p.x-goal.x,p.y-goal.y)>3;steps++){
  const target=nav.waypoint({...p,radius:28},goal,0)??goal;
  const dist=Math.hypot(target.x-p.x,target.y-p.y);
  if(dist<0.001){error='stationary waypoint';break;}
  const step=Math.min(3,dist),q={x:p.x+(target.x-p.x)*step/dist,y:p.y+(target.y-p.y)*step/dist};
  if(!canTraverseExpedition(candidate,p,q,28)){error='swept step blocked';break;}p=q;
 }
 check(`production navigation: ${start.id} to ${goal.x}/${goal.y} swept pursuit`,()=>{assert.equal(error,null);assert.ok(Math.hypot(p.x-goal.x,p.y-goal.y)<=3,'step budget exceeded');});
 navTrips.push({start:start.id,goal,steps,error,reached:Math.hypot(p.x-goal.x,p.y-goal.y)<=3});
}
const output={scope:'Diagram and CPU geometry only. Not runtime integration or live combat.',productionHelpers:['createExpeditionGeometry','canOccupyExpedition','canTraverseExpedition','FacilityNavigation'],baseline:ROOM_TEMPLATES[d.room],candidate:{bounds:candidate.bounds,voids:candidate.voids},results,connectivity,navTrips,passed:results.filter(x=>x.passed).length,failures:results.filter(x=>!x.passed).length};
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({passed:output.passed,failures:output.failures,connectivity,failed:results.filter(x=>!x.passed)},null,2));
if(output.failures)process.exitCode=1;
