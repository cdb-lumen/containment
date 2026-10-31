import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const source=execFileSync('git',['-C','/workspace/containment-spitter','rev-parse','HEAD'],{encoding:'utf8'}).trim();
const ssr=await createServer({root:'/workspace/containment-spitter',configFile:false,server:{middlewareMode:true,hmr:false},logLevel:'error'});
try{
 const {DepthGame}=await ssr.ssrLoadModule('/src/DepthGame.ts'),{generateRun}=await ssr.ssrLoadModule('/src/game/roguelike/run.ts'),{createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition}=await ssr.ssrLoadModule('/src/game/world/expeditionGeometry.ts'),{FacilityNavigation}=await ssr.ssrLoadModule('/src/game/world/FacilityNavigation.ts');
 const results=[],rejected=[];
 for(const room of ['infested-workshop','shielding-gate'])for(const start of [{x:156,y:100},{x:1044,y:100},{x:156,y:780},{x:1044,y:780},{x:600,y:200},{x:600,y:550}])for(const x of [200,400,600,800,1000])for(const y of [150,300,440,600,730]){
  const target={x,y},g=new DepthGame();g.node=generateRun(1729,3).nodes.find(n=>n.templateId===room);g.geometry=createExpeditionGeometry(g.node);g.navigation=new FacilityNavigation(g.geometry);g.enemies=g.makeEnemies();Object.assign(g.player,target);g.status='playing';g.director.update=()=>[];
  if(!canOccupyExpedition(g.geometry,target,16)||!canOccupyExpedition(g.geometry,start,18)||Math.hypot(x-start.x,y-start.y)<80){rejected.push({room,start,target});continue;}
  const spawned=g.enemies.spawn('spitter',start.x,start.y);if(!spawned.spawned){rejected.push({room,start,target,spawn:'rejected'});continue;}
  const id=spawned.enemy.id;let damage=0,attacks=0,legal=true,frames=0;
  const eu=g.enemies.update.bind(g.enemies);g.enemies.update=(...args)=>{const e=eu(...args);attacks+=e.filter(e=>e.type==='hazard-attack').length;return e;};
  const bu=g.updateBullets.bind(g);g.updateBullets=(...args)=>{const before=g.combat.snapshot.health+g.combat.snapshot.armor;bu(...args);damage+=before-g.combat.snapshot.health-g.combat.snapshot.armor;};
  for(;frames<900&&damage===0&&g.status==='playing';frames++){const prev=g.enemies.getSnapshot(id);g.update(50);const now=g.enemies.getSnapshot(id);legal&&=canOccupyExpedition(g.geometry,now,now.radius)&&canTraverseExpedition(g.geometry,prev,now,now.radius);}
  results.push({room,start,target,frames,damage,attacks,legal,final:g.enemies.getSnapshot(id),passed:legal&&damage>0});
 }
 await writeFile('/workspace/spitter-expanded-probe.json',JSON.stringify({source,scope:'Fresh 6 starts x25 target grid x2 rooms. Single ordinary spitter, director isolated, actual game.update and projectile-only damage,45s limit; not historical replay.',results,rejected},null,2));console.log(JSON.stringify({total:results.length,passed:results.filter(x=>x.passed).length,rejected:rejected.length,failures:results.filter(x=>!x.passed)}));
}finally{await ssr.close();}
