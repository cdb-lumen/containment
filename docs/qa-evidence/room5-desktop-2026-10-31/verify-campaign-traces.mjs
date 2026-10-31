import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
const [root,out]=process.argv.slice(2),m=JSON.parse(await readFile(out+'/manifest.json','utf8'));
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false},logLevel:'error'});
try{
 const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts'),{createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition}=await server.ssrLoadModule('/src/game/world/expeditionGeometry.ts');
 const geometry=createExpeditionGeometry(generateRun(m.checkpoint.run.seed,m.checkpoint.run.version).nodes.find(n=>n.templateId===m.room));
 let enemyPositions=0,enemySweeps=0,playerSweeps=0;const errors=[];let previous=null;
 for(const f of m.frames){
  if(!canOccupyExpedition(geometry,f.player,f.player.radius))errors.push({frame:f.i,actor:'player',check:'occupancy'});
  if(previous){playerSweeps++;if(!canTraverseExpedition(geometry,previous.player,f.player,f.player.radius))errors.push({frame:f.i,actor:'player',check:'sweep'});}
  const prev=new Map(previous?.enemies.map(e=>[e.id,e])??[]);
  for(const e of f.enemies){enemyPositions++;if(!canOccupyExpedition(geometry,e,e.radius))errors.push({frame:f.i,actor:e.id,check:'occupancy'});if(prev.has(e.id)){enemySweeps++;if(!canTraverseExpedition(geometry,prev.get(e.id),e,e.radius))errors.push({frame:f.i,actor:e.id,check:'sweep'});}}
  previous=f;
 }
 const result={source:m.sourceBefore.commit,room:m.room,frames:m.frames.length,encounterState:m.encounter?.status,enemyPositions,enemySweeps,playerSweeps,errors};await writeFile(out+'/trace-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));assert.deepEqual(errors,[]);
}finally{await server.close();}
