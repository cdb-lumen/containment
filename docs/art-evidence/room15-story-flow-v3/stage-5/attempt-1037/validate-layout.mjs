import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ROOM_TEMPLATES} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3/src/game/roguelike/roomTemplates.ts';
import {createExpeditionGeometry,canOccupyExpedition as occupy,canTraverseExpedition as traverse} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3/src/game/world/expeditionGeometry.ts';
import {FacilityNavigation} from '/home/chernodubv/dev/.cron-worktrees/containment-rooms/infested-workshop-v3/src/game/world/FacilityNavigation.ts';
const out=fileURLToPath(new URL('.',import.meta.url));
const p=(x,y)=>({x,y});
const template=ROOM_TEMPLATES['infested-workshop'];
const g=createExpeditionGeometry({id:'layout-room15',templateId:'infested-workshop'});
const activities=[{id:'A',name:'Lathe operator',point:p(375,400)},{id:'B',name:'Gantry service',point:p(650,280)},{id:'C',name:'Fabrication access',point:p(570,510)},{id:'D',name:'Tool supply access',point:p(925,490)}];
const routes=[
 {id:'main',points:[g.playerSpawn,g.exitPoint]},
 {id:'north-west',points:[p(100,100),p(156,100),p(200,100),p(200,440),p(600,440)]},
 {id:'north-east',points:[p(1100,100),p(1044,100),p(1000,100),p(1000,440),p(600,440)]},
 {id:'south-west',points:[p(100,780),p(156,780),p(200,780),p(200,440),p(600,440)]},
 {id:'south-east',points:[p(1100,780),p(1044,780),p(1060,780),p(1060,440),p(600,440)]},
 {id:'activity-A',points:[p(375,440),activities[0].point]},
 {id:'activity-B',points:[p(600,440),p(650,440),activities[1].point]},
 {id:'activity-C',points:[p(570,440),activities[2].point]},
 {id:'activity-D',points:[p(925,440),activities[3].point]},
 {id:'north-loop',points:[p(200,100),p(1000,100)]},
 {id:'south-loop',points:[p(200,780),p(1060,780)]}
];
const equipment=[
 {id:'A',role:'Converted lathe + manipulator',obstacle:0,envelope:{x:288,y:228,width:174,height:124}},
 {id:'B',role:'Retained fabrication gantry',obstacle:2,envelope:{x:708,y:168,width:114,height:224}},
 {id:'C',role:'Assembly / fixture bench',obstacle:1,envelope:{x:488,y:568,width:164,height:144}},
 {id:'D',role:'Tool / stock cabinet',obstacle:3,envelope:{x:858,y:558,width:134,height:124}}
];
const data={stage:1,attempt:1005,conceptOnly:true,geometryChanged:false,template,activities,equipment,routes};
fs.writeFileSync(out+'layout-data.json',JSON.stringify(data,null,2)+'\n');
const checks=[];const check=(name,pass,detail)=>checks.push({name,pass,detail});
check('authoritative rectangular boundary retained',!template.boundary&&!template.voids,{width:template.width,height:template.height});
check('four original obstacle footprints',JSON.stringify(template.obstacles)===JSON.stringify([{x:280,y:220,width:190,height:140},{x:480,y:560,width:180,height:160},{x:700,y:160,width:130,height:240},{x:850,y:550,width:150,height:140}]),template.obstacles);
for(const e of equipment){const a=e.envelope,b=template.obstacles[e.obstacle];check('contained equipment '+e.id,a.x>b.x&&a.y>b.y&&a.x+a.width<b.x+b.width&&a.y+a.height<b.y+b.height,{envelope:a,solid:b});}
const radii={};
for(const r of [16,28,38,48]){
 const anchors=[g.playerSpawn,g.exitPoint,...g.breaches,...g.breaches.map(b=>p(b.x+(b.facing==='east'?56:-56),b.y)),...activities.map(a=>a.point)];
 const occupancy=anchors.map(point=>({point,pass:occupy(g,point,r)}));
 const segments=routes.flatMap(route=>route.points.slice(1).map((to,i)=>({route:route.id,from:route.points[i],to,pass:traverse(g,route.points[i],to,r)})));
 // A consistent graph: every edge uses the production sweep, including its endpoints.
 const nodes=[];for(let y=40;y<880;y+=20)for(let x=40;x<1200;x+=20)if(occupy(g,p(x,y),r))nodes.push(p(x,y));
 const keys=new Set(nodes.map(n=>`${n.x},${n.y}`));const reached=new Set(['100,440']);const queue=[p(100,440)];
 for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const a=queue[i],b=p(a.x+dx,a.y+dy),k=`${b.x},${b.y}`;if(keys.has(k)&&!reached.has(k)&&traverse(g,a,b,r)){reached.add(k);queue.push(b);}}
 const unreachable=nodes.filter(n=>!reached.has(`${n.x},${n.y}`)).map(n=>({...n,zeroLengthSweep:traverse(g,n,n,r)}));
 radii[r]={occupancy,segments,sampledConnectivity:{step:20,nodes:nodes.length,reached:reached.size,unreachable}};
 if(r<=28){check('anchor occupancy radius '+r,occupancy.every(x=>x.pass),{tested:occupancy.length});check('route sweeps radius '+r,segments.every(x=>x.pass),{tested:segments.length});}
}
const nav=new FacilityNavigation(g);nav.prepare(g.playerSpawn,1);
const navigation=[g.exitPoint,...g.breaches,...activities.map(a=>a.point)].map(point=>({point,reachable:nav.reachable(point)}));
check('production navigation anchor reachability',navigation.every(x=>x.reachable),navigation);
const result={scope:'Production occupancy and swept-route tests. Sampled graph and larger radii are diagnostics, not live combat.',checks,failures:checks.filter(c=>!c.pass).length,errors:0,radii,navigation};
fs.writeFileSync(out+'test-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,failures:result.failures,radii:Object.fromEntries(Object.entries(radii).map(([r,v])=>[r,{occupancyFailures:v.occupancy.filter(x=>!x.pass).length,routeFailures:v.segments.filter(x=>!x.pass).length,...v.sampledConnectivity}]))},null,2));
process.exitCode=result.failures?1:0;
