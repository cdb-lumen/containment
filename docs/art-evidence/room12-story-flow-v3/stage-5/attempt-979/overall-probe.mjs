import {createRequire} from 'node:module';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/home/chernodubv/dev/.cron-worktrees/containment-rooms/safety-interlock-station-v3',out=new URL('.',import.meta.url).pathname;
const req=createRequire(root+'/package.json'),{createServer}=await import(req.resolve('vite'));
const result={scope:'CPU production game state, geometry and movement. No browser HUD/audio or ordinary gameplay claim.',checks:[],routes:[],story:[]};
let server;
try{
 server=await createServer({root,configFile:false,cacheDir:out+'.vite-cpu',optimizeDeps:{noDiscovery:true,include:[]},server:{hmr:false},logLevel:'error'});
 const {DepthGame}=await server.ssrLoadModule('/src/DepthGame.ts');
 const {expeditionRewardOffers}=await server.ssrLoadModule('/src/game/roguelike/expedition.ts');
 const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts');
 const {conciseStoryStatus}=await server.ssrLoadModule('/src/game/roguelike/storyRooms.ts');
 const {stageEvidenceGame}=await server.ssrLoadModule('/scripts/room-evidence-scene.mjs');
 const {canOccupyExpedition,canTraverseExpedition}=await server.ssrLoadModule('/src/game/world/expeditionGeometry.ts');
 const graph=generateRun(1729,3),node=graph.nodes[11];assert.equal(node.templateId,'safety-interlock-station');
 assert.equal(graph.nodes[10].templateId,'diagnostic-gallery');assert.equal(graph.nodes[12].templateId,'coolant-plant');result.checks.push('Canonical Room11 -> Room12 -> Room13 ordering');
 const g=new DepthGame();g.newRun(137);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);
 const reward=()=>{const offers=expeditionRewardOffers(g.expedition);if(offers.length)g.chooseMutation(offers[0].id);else g.claimResources();};
 for(let depth=0;depth<=11;depth++){
  assert.equal(g.status,'playing');g.skipStory();assert.equal(g.storyPresentation,undefined);
  const check=()=>{assert.equal(g.authorizeDestruction(),false);assert.match(g.storyStatus,/AI KNEW BEFORE AWAKENING/);assert.match(g.storyStatus,/PURGE KILLS EVERYONE/);assert.match(conciseStoryStatus(g.storyStatus),/AI knew before awakening/);assert.match(conciseStoryStatus(g.storyStatus),/Purge kills everyone/);result.story.push({phase:g.status,status:g.storyStatus,concise:conciseStoryStatus(g.storyStatus),authorization:false});};
  if(depth===11){assert.equal(g.node.templateId,node.templateId);assert.match(g.storyRoom.story,/Rescue impossible\. AI acknowledged\. Survival promise issued afterward/);check();}
  for(let i=0;i<2600&&g.status==='playing';i++){for(const e of g.enemies.snapshot.enemies)g.damage(e.id,100000);g.update(50);}
  assert.equal(g.status,'reward');if(depth===11)check();reward();assert.equal(g.status,'route');if(depth===11)check();
  g.route(g.node.next[0]);
 }
 assert.equal(g.node.templateId,'coolant-plant');result.checks.push('Skipped optional story through Room12, essential status persists during playing/reward/route; authorization denied; advances to coolant');
 const main=await readFile(root+'/src/main.ts','utf8');assert.match(main,/status==='route'&&game\.node\.templateId==='manual-control-chamber'/);result.checks.push('Source inspection confirms Destroy ship UI branch is manual-control-chamber only, not a live DOM test');
 const paths=[[[100,440],[1100,440]],[[100,440],[100,140],[1100,140],[1100,440]],[[100,440],[100,760],[1100,760],[1100,440]],[[410,440],[410,395]],[[780,440],[780,395]],[[600,440],[600,535]]];
 for(const radius of [16,28])for(const [index,path] of paths.entries()){
  const {game}=stageEvidenceGame(node);game.enemies.reset();game.player.radius=radius;Object.assign(game.player,{x:path[0][0],y:path[0][1]});let steps=0,distance=0;
  for(const [x,y]of path.slice(1)){
   assert(canTraverseExpedition(game.geometry,game.player,{x,y},radius));let budget=2000;
   while(Math.hypot(x-game.player.x,y-game.player.y)>1){assert(budget-->0,'movement stalled');const before={x:game.player.x,y:game.player.y},d=Math.hypot(x-before.x,y-before.y),speed=Math.min(1,d/(220/60));game.update(1000/60,{x:(x-before.x)/d*speed,y:(y-before.y)/d*speed,fire:false,angle:null,autoAim:false});assert(canOccupyExpedition(game.geometry,game.player,radius));distance+=Math.hypot(game.player.x-before.x,game.player.y-before.y);steps++;}
  }
  result.routes.push({radius,index,steps,distance,end:{x:game.player.x,y:game.player.y}});
 }
 const {game}=stageEvidenceGame(node);game.enemies.reset();
 for(const [x,y]of [[410,280],[780,280],[600,640]])assert.equal(canOccupyExpedition(game.geometry,{x,y},16),false);
 Object.assign(game.player,{x:410,y:395});for(let i=0;i<90;i++){game.update(1000/60,{x:0,y:-1,fire:false,angle:null,autoAim:false});assert(canOccupyExpedition(game.geometry,game.player,game.player.radius));}assert(game.player.y>=350+game.player.radius-1e-5);
 result.checks.push('All three reservations block occupancy; real player movement stops at recorder collision');
 result.passed=true;
}catch(e){result.passed=false;result.error=e.stack;process.exitCode=1;}
finally{await server?.close();result.cleanup='CPU Vite closed';await writeFile(out+'overall-probe.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));}
