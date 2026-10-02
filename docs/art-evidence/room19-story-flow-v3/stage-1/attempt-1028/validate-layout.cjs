// CPU-only current-geometry export and focused layout checks.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const repo=process.argv[2],out=__dirname;
const ts=require(path.join(repo,'node_modules/typescript'));
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {ROOM_TEMPLATES}=require(path.join(repo,'src/game/roguelike/roomTemplates.ts'));
const {createExpeditionGeometry,canOccupyExpedition:occupy,canTraverseExpedition:sweep}=require(path.join(repo,'src/game/world/expeditionGeometry.ts'));
const template=ROOM_TEMPLATES['manual-control-chamber'];
const geometry=createExpeditionGeometry({id:'room19-layout-check',templateId:template.id});
const routes={main:[template.spawn,{x:220,y:480},{x:980,y:480},template.exit],console:[{x:600,y:480},{x:600,y:550}],northLoop:[{x:220,y:480},{x:220,y:140},{x:980,y:140},{x:980,y:480}],southLoop:[{x:220,y:480},{x:220,y:780},{x:980,y:780},{x:980,y:480}]};
const activities={entry:template.spawn,exit:template.exit,combatWest:{x:330,y:520},combatEast:{x:880,y:520},warningRead:{x:600,y:550},northService:{x:600,y:140},southService:{x:600,y:780}};
let checks=0;const check=(v,msg)=>{assert(v,msg);checks++};
check(template.width===1200&&template.height===880,'dimensions');
check(JSON.stringify(template.obstacles)===JSON.stringify([{x:340,y:230,width:160,height:180},{x:700,y:230,width:160,height:180},{x:470,y:610,width:260,height:100}]),'current footprints');
const results=[];
for(const radius of [16,28]){
 for(const [name,p] of Object.entries(activities))check(occupy(geometry,p,radius),`activity ${name} r${radius}`);
 for(const [name,points] of Object.entries(routes))for(let i=1;i<points.length;i++)check(sweep(geometry,points[i-1],points[i],radius),`route ${name} segment ${i} r${radius}`);
 const points=new Map(),occupancyOnly=[];
 for(let y=40;y<=840;y+=20)for(let x=40;x<=1160;x+=20){const p={x,y};if(occupy(geometry,p,radius)){if(sweep(geometry,p,p,radius))points.set(`${x},${y}`,p);else occupancyOnly.push(p);}}
 // Keep movement-contract discrepancies visible. Do not silently filter and claim all occupancy cells connected.
 check(occupancyOnly.length===0,`occupancy/sweep mismatch r${radius}`);
 const seen=new Set(),components=[];
 for(const [key,p] of points){if(seen.has(key))continue;const queue=[p];seen.add(key);for(let i=0;i<queue.length;i++){const a=queue[i];for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const k=`${a.x+dx},${a.y+dy}`,b=points.get(k);if(b&&!seen.has(k)&&sweep(geometry,a,b,radius)){seen.add(k);queue.push(b);}}}components.push(queue.length);}
 check(components.length===1,`sampled connected space r${radius}`);
 for(const [name,a] of Object.entries(activities))check([...points.values()].some(p=>Math.hypot(p.x-a.x,p.y-a.y)<=30&&sweep(geometry,a,p,radius)),`activity connects to grid ${name}`);
 for(const b of template.breaches){const p={x:b.x+(b.x<600?56:-56),y:b.y};check(occupy(geometry,p,radius),'inward breach spawn');check([...points.values()].some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=30&&sweep(geometry,p,q,radius)),'breach connects');}
 results.push({radius,gridStep:20,components,sampledUsablePoints:points.size,occupancySweepDiscrepancies:occupancyOnly});
}
const payload={template,geometry,routes,activities,results,checks,failures:0,errors:0,limitations:'Sampled CPU geometry and swept routes only. No live gameplay, model readability, human acceptance or continuous-space proof.'};
fs.writeFileSync(path.join(out,'geometry-validation.json'),JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({checks,results,failures:0,errors:0},null,2));
