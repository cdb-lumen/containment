// Run: node check_layout.cjs REPO [TYPESCRIPT_JS]
// Read production TypeScript without changing or installing runtime files.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),Module=require('module');
const repo=path.resolve(process.argv[2]);
const ts=require(process.argv[3]||'/home/chernodubv/dev/alien-shooter-containment/node_modules/typescript/lib/typescript.js');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const load=f=>require(path.join(repo,f));
const {ROOM_TEMPLATES}=load('src/game/roguelike/roomTemplates.ts');
const {createExpeditionGeometry,canOccupyExpedition:occupy,canTraverseExpedition:sweep,hasClearExpeditionShot:shot}=load('src/game/world/expeditionGeometry.ts');
const {FacilityNavigation}=load('src/game/world/FacilityNavigation.ts');
const p=(x,y)=>({x,y}), poly=a=>a.map(([x,y])=>p(x,y));
const template=ROOM_TEMPLATES['containment-annulus'];
const baseline=createExpeditionGeometry({id:'layout-room18',templateId:'containment-annulus'});
const center=p(template.width/2,template.height/2);
// Proposed setbacks are explicit design decisions in source game units.
const boundary=poly([[80,40],[1120,40],[1160,80],[1160,800],[1120,840],[80,840],[40,800],[40,80]]);
const core=poly([[420,240],[780,240],[840,300],[840,580],[780,640],[420,640],[360,580],[360,300]]);
const draft={...baseline,boundary,voids:[core],blockers:baseline.boundaryWalls};
const loop=poly([[240,440],[240,220],[340,140],[860,140],[960,220],[960,660],[860,740],[340,740],[240,660],[240,440]]);
const upper=[template.spawn,...loop.slice(0,5),p(960,440),template.exit];
const lower=[template.spawn,p(240,440),p(240,660),p(340,740),p(860,740),p(960,660),p(960,440),template.exit];
const activities=[{id:'N',name:'North inspection',point:p(600,160),approach:[p(600,140),p(600,160)]},{id:'S',name:'South inspection',point:p(600,720),approach:[p(600,740),p(600,720)]},{id:'V',name:'Passenger vitals',point:p(930,350),approach:[p(960,350),p(930,350)]},{id:'A',name:'Authorization state',point:p(930,490),approach:[p(960,490),p(930,490)]}];
const routes={clockwise:loop,counterclockwise:[...loop].reverse(),entry_to_exit_north:upper,entry_to_exit_south:lower};
const anchors=[{id:'entry',point:template.spawn},{id:'exit',point:template.exit},...template.breaches.map((point,i)=>({id:`breach-${i}`,point})),...baseline.breaches.map((b,i)=>({id:`inward-spawn-${i}`,point:p(b.x+(b.facing==='east'?56:-56),b.y)})),...activities];
const data={task:'room18-story-flow-v3',stage:1,attempt:1022,units:'game units, not metres',evidence:'authored draft only; not implemented',source_template:template,baseline:{bounds:baseline.bounds,boundary:baseline.boundary??null,voids:baseline.voids??[],obstacles:template.obstacles},proposal:{bounds:baseline.bounds,boundary,voids:[core],obstacles:[],center,activities,routes,anchors,status_panels:[{id:'V',label:'PASSENGERS ALIVE',point:p(815,350)},{id:'A',label:'OVERLOAD IS NOT ARMED',point:p(815,490)}]},design_dimensions:{outer_envelope:[template.width,template.height],inner_core_envelope:[480,400],north_south_cardinal_floor_width:200,east_west_cardinal_floor_width:320,diagonal_corner_floor_width:Math.hypot(40,40),note:'Last value is canonical corner anchor distance to proposed outer diagonal, not a whole lane width. Cardinal lane widths exclude no added props. Proposed offsets are not canonical.'}};
fs.writeFileSync(path.join(__dirname,'layout-data.json'),JSON.stringify(data,null,2)+'\n');
const checks=[],diagnostics={};
function check(name,pass,details){checks.push({name,pass,details});}
check('canonical envelope',template.width===1200&&template.height===880,baseline.bounds);
check('canonical entry and exit',template.spawn.x===100&&template.spawn.y===440&&template.exit.x===1100&&template.exit.y===440,{entry:template.spawn,exit:template.exit});
check('canonical breach anchors',JSON.stringify(template.breaches)===JSON.stringify(poly([[100,100],[1100,100],[100,780],[1100,780]])),template.breaches);
check('baseline is five rectangles without topology override',template.obstacles.length===5&&!baseline.boundary&&!baseline.voids,template.obstacles);
for(const r of [16,28,30]){
 for(const a of anchors)check(`r${r} anchor ${a.id}`,occupy(draft,a.point,r)&&sweep(draft,a.point,a.point,r),a.point);
 for(const [name,route] of Object.entries({...routes,...Object.fromEntries(activities.map(a=>[`approach-${a.id}`,a.approach]))}))for(let i=1;i<route.length;i++)check(`r${r} ${name} segment ${i}`,sweep(draft,route[i-1],route[i],r),[route[i-1],route[i]]);
 check(`r${r} center inaccessible`,!occupy(draft,center,r),center);
 check(`r${r} center crossing rejected`,!sweep(draft,template.spawn,template.exit,r),null);
 // Sample graph uses identical swept predicates at nodes and edges.
 const nodes=new Map(),excluded=[];for(let y=40;y<=840;y+=20)for(let x=40;x<=1160;x+=20){const q=p(x,y);if(occupy(draft,q,r)){if(sweep(draft,q,q,r))nodes.set(`${x},${y}`,q);else excluded.push(q);}}
 const visited=new Set(),components=[];for(const [key,q]of nodes){if(visited.has(key))continue;const todo=[q];visited.add(key);let count=0;while(todo.length){const a=todo.pop();count++;for(const [dx,dy]of [[20,0],[-20,0],[0,20],[0,-20]]){const k=`${a.x+dx},${a.y+dy}`,b=nodes.get(k);if(b&&!visited.has(k)&&sweep(draft,a,b,r)){visited.add(k);todo.push(b);}}}components.push(count);}
 diagnostics[`r${r}`]={sample_spacing:20,nodes:nodes.size,component_sizes:components,occupancy_sweep_disagreement:excluded};
 check(`r${r} sampled connected floor`,components.length===1,diagnostics[`r${r}`]);
 for(const a of anchors)check(`r${r} ${a.id} joins sampled floor`,[...nodes.values()].some(q=>Math.hypot(q.x-a.point.x,q.y-a.point.y)<=40&&sweep(draft,a.point,q,r)),a.point);
}
check('center blocks line of sight',!shot(draft,template.spawn,template.exit),null);
for(const radius of [0,4,7,12])check(`center blocks swept proxy r${radius}`,!sweep(draft,template.spawn,template.exit,radius),null);
const nav=new FacilityNavigation(draft);nav.prepare(template.exit,1);for(const a of anchors)check(`production navigation sampled reach ${a.id}`,nav.reachable(a.point),a.point);
const files=['src/game/roguelike/roomTemplates.ts','src/game/roguelike/storyRooms.ts','src/game/roguelike/storyRoomTemplates.ts','src/game/roguelike/authoredRoomTopologies.ts','src/game/world/expeditionGeometry.ts','src/game/world/polygonGeometry.ts','src/game/world/FacilityNavigation.ts','src/DepthGame.ts'];
const pins=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,f))).digest('hex')]));
const result={scope:'Real CPU calls on proposed geometry. No runtime integration, combat, pickup simulation, pursuit or camera claims.',radii:{16:'DepthGame player radius',28:'storyRoomTemplates lane contract',30:'FacilityNavigation clearance'},tests:checks.length,failures:checks.filter(c=>!c.pass).length,checks,diagnostics,source_sha256:pins};
fs.writeFileSync(path.join(__dirname,'checks.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({tests:result.tests,failures:result.failures,diagnostics,failed:checks.filter(c=>!c.pass)},null,2));
process.exitCode=result.failures?1:0;
