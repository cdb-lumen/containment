#!/usr/bin/env node
// Real-game effect evidence. Inventory: enemy-hit/shotgun-metal use response-only
// main.ts seams and fixed-step screenshots; room-demo adds decoded motion/probes.
// No renderer event injection, camera replacement, runtime edits or synthetic frames.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {verifyProbe,decodedMotion} from './room-demo.mjs';

// Each entry is a separate clip, not a claim to isolate overlapping production VFX.
// Extend declaratively. Requirements are checked against forwarded runtime events.
export const CASES = Object.freeze({
 'acid-impact': {hazard:'spitter',require:'acid'},
 'acid-pool': {hazard:'queen',require:'acid',runVersion:2},
});
export function options(argv) {
 const v={};for(const arg of argv){const m=/^--(case|out|root|source-sha|seconds|quality)=(.+)$/.exec(arg);if(arg==='--provisional'){assert(!v.provisional);v.provisional=true;}else{assert(m,`Unknown argument ${arg}`);assert(!(m[1] in v),`Duplicate ${m[1]}`);v[m[1]]=m[2];}}
 assert(Object.hasOwn(CASES,v.case),`Use --case=<id>; supported: ${Object.keys(CASES).join(', ')}`);
 const provisional=!!v.provisional,seconds=Number(v.seconds??(provisional?2:6));
 assert(provisional?(seconds>=2&&seconds<=6):seconds===6,'Final clips require six seconds');
 assert(Number.isInteger(seconds*20));assert(['high','low'].includes(v.quality??'high'));
 if(v['source-sha']!==undefined)assert.match(v['source-sha'],/^[a-f0-9]{40}$/);
 assert(provisional||v['source-sha'],'Final capture requires --source-sha=<full HEAD>');
 return {root:v.root?resolve(v.root):undefined,case:v.case,definition:CASES[v.case],provisional,seconds,fps:20,frames:seconds*20,viewport:{width:960,height:600},quality:v.quality??'high',sourceSha:v['source-sha'],out:resolve(v.out??`artifacts/vfx-audit/${v.case}${provisional?'-provisional':''}`)};
}

async function stage(o) {
 const d=window.__vfxAudit,g=d.game,r=d.renderer;
 const {expeditionRewardOffers}=await import('/src/game/roguelike/expedition.ts');
 const geometry=await import('/src/game/world/expeditionGeometry.ts');
 const {EnemySystem}=await import('/src/game/enemies/EnemySystem.ts');
 const {createBuild}=await import('/src/game/roguelike/builds.ts');
 let seed=1729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 g.newRun(1729);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.skipStory();
 if(o.definition.hazard==='queen'){
  const {generateRun}=await import('/src/game/roguelike/run.ts');
  const node=generateRun(1729,o.definition.runVersion).nodes.find(n=>n.kind==='boss');
  if(!node)throw Error('Missing production boss room');
  g.expedition={...g.expedition,run:{...g.expedition.run,version:o.definition.runVersion,currentNodeId:node.id}};
  g.enterRoom(false);g.skipStory();
 }
 const build=createBuild();g.combat.setBuild(build);g.expedition={...g.expedition,build};
 g.pending=[];g.director.update=()=>[];g.clearRequested=false;
 g.enemies=new EnemySystem({balance:{health:1,damage:1,speed:0,eliteHealth:1,eliteDamage:1,specials:true},canMove:()=>false,canAttack:(a,b)=>geometry.hasClearExpeditionShot(g.geometry,a,b)});
 r.setQuality(o.quality);r.loadRoom(g.node);r.render(g,1,false);d.hud();d.syncScreen(true);
 if(g.status!=='playing'||!r.camera.isOrthographicCamera)throw Error('Startup failed');
 d.nativeZoom=r.camera.zoom;d.events=[];d.domainEvents=[];d.frame=-1;
 const effect=r.effect.bind(r);r.effect=e=>{const p=r.camera.position.clone().set(e.x/32,.3,e.y/32).project(r.camera);d.events.push({...e,frame:d.frame,pixel:{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}});return effect(e);};
 for(const [owner,name] of [[g.enemies,'enemy'],[g.boss,'queen']]){const update=owner.update.bind(owner);owner.update=(...args)=>{const events=update(...args);d.domainEvents.push(...events.map(e=>({...e,owner:name,frame:d.frame})));return events;};}
 const {NEST_DISTANCE,MAX_QUEEN_NESTS}=await import('/src/game/enemies/QueenBossSystem.ts');
 const candidates=[],queen=o.definition.hazard==='queen',origin=queen?g.geometry.bossSpawn:g.player,radius=queen?90:32;
 if(queen&&!geometry.canOccupyExpedition(g.geometry,origin,76))throw Error('Production queen spawn is not occupiable');
 for(const distance of [240,210,180,270,320,360,400])for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,p={x:origin.x+Math.cos(angle)*distance,y:origin.y+Math.sin(angle)*distance};
  const clearOfNests=!queen||Array.from({length:MAX_QUEEN_NESTS},(_,slot)=>slot*Math.PI*2/MAX_QUEEN_NESTS).every(a=>Math.hypot(p.x-origin.x-Math.cos(a)*NEST_DISTANCE,p.y-origin.y-Math.sin(a)*NEST_DISTANCE)>150);
  const screen=r.camera.position.clone().set(p.x/32,.3,p.y/32).project(r.camera),sy=(1-screen.y)*innerHeight/2;
  if(clearOfNests&&geometry.canOccupyExpedition(g.geometry,p,radius)&&geometry.hasClearExpeditionShot(g.geometry,origin,p)&&r.visible(p.x,p.y)&&(!queen||(sy>190&&sy<340)))candidates.push(p);
 }
 if(!candidates.length)throw Error('No legal visible unobstructed hazard source');
 let hazardSource=candidates[0];
 if(!queen){const spawn=g.enemies.spawn('spitter',hazardSource.x,hazardSource.y);if(!spawn.spawned)throw Error('Spawn rejected');}
 else{Object.assign(g.player,candidates[0]);hazardSource={...origin};if(!g.boss.start(origin.x,origin.y))throw Error('Queen start failed');}
 d.initialTotal=g.combat.snapshot.health+g.combat.snapshot.armor;
 const caption=document.createElement('div');caption.id='vfx-audit-caption';caption.style.cssText='position:fixed;left:12px;bottom:78px;z-index:999;padding:6px 9px;background:#061116ef;color:#eff5ef;font:12px monospace;pointer-events:none';
 caption.textContent=`${o.provisional?'PROVISIONAL / ':''}${o.case}${queen?' / LEGACY BOSS':''} / CONTROLLED / NATIVE CAMERA / ${o.quality.toUpperCase()} / SILENT`;document.body.append(caption);
 return {room:g.node.templateId,runVersion:g.expedition.run.version,player:{...g.player},hazardSource,build,nativeZoom:d.nativeZoom,quality:r.qualityTier,controls:'Stationary player and spitter; normal damage, specials and boss timers. Encounter director disabled. The queen case uses the supported legacy v2 Reactor Vault through production room entry, with a legal nearby player position; not current story-campaign progression. Actual DepthGame.update hazard collision/queen area attacks, unchanged danger radius and pool lifetime. No injected effects, player fire, DOM input, audio or performance evidence.'};
}
function step({frame,o}) {
 const d=window.__vfxAudit,g=d.game,r=d.renderer;d.frame=frame;
 g.update(1000/o.fps,{x:0,y:0,fire:false,angle:0,autoAim:false});
 d.confirmation.update(1/o.fps,g.status==='playing');r.render(g,1/o.fps,false);d.hud();
 if(g.status!=='playing')throw Error(`Left playing: ${g.status}`);
 if(r.camera.zoom!==d.nativeZoom)throw Error('Camera zoom changed');
 const gl=r.renderer.getContext();gl.finish();const error=gl.getError();if(error||gl.isContextLost())throw Error(`WebGL error ${error}`);
 const p=r.camera.position.clone().set(g.player.x/32,.3,g.player.y/32).project(r.camera);
 let poolShader=null;
 if(g.pools.length){const material=r.poolMeshes.values().next().value?.material;poolShader={material:material?.constructor.name,clock:material?.surfaceTime?.value,compiled:r.renderer.info.programs.some(program=>gl.getShaderSource(program.fragmentShader)?.includes('acidWet'))};}
 return {frame,elapsed:g.elapsed,poolShader,bullets:g.bullets.map(b=>({x:b.x,y:b.y,kind:b.kind,weapon:b.request.weaponId})),pools:g.pools.map(p=>({...p})),boss:g.boss.snapshot,damage:d.initialTotal-g.combat.snapshot.health-g.combat.snapshot.armor,counts:r.effects.counts,zoom:r.camera.zoom,targetPixel:{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}};
}
export function verifyEvents(events,frames,o,domainEvents=[]) {
 const acid=events.filter(e=>e.type==='acid'&&e.targetId===undefined&&e.contact===undefined);
 assert(acid.length,'Missing untargeted production acid; targetId acid is NOT hazard evidence');
 assert(!events.some(e=>e.type==='shot'),'Unexpected player firing');
 assert(frames.some(f=>f.damage>0),'No real armor+health damage');
 if(o.definition.hazard==='spitter'){
  assert(domainEvents.some(e=>e.type==='hazard-attack'&&e.enemyType==='spitter'),'No real spitter attack');
  assert(frames.some(f=>f.bullets.some(b=>b.kind==='hazard')),'No live hazard projectile');
  assert(acid.some(e=>e.radius===undefined&&Number.isFinite(e.angle)),'Missing projectile acid impact');
 }else{
  assert(domainEvents.some(e=>e.type==='area-attack'),'No real queen area attack');
  assert(acid.some(e=>e.radius>0),'Missing queen acid burst radius');
  assert(frames.some(f=>f.pools.some(p=>p.life>0)),'No real lingering pool');
  if(!o.provisional)assert(frames.filter(f=>f.pools.length).length>=30,'Missing settled pool lifetime');
 }
 assert(frames.every(f=>f.zoom===frames[0].zoom),'Changed zoom');
}
const hash=b=>createHash('sha256').update(b).digest('hex');
async function record(o) {
 const root=o.root??resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=o.out;
 const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8',timeout:15000}).trim();
 const paths=['src','public','index.html','vite.config.ts','package.json','package-lock.json','pnpm-lock.yaml','yarn.lock'];
 const source=async()=>{const names=[...new Set(git('ls-files','--cached','--others','--exclude-standard','--',...paths).split('\n').filter(Boolean))].sort(),files=[];for(const path of names){try{files.push({path,sha256:hash(await readFile(join(root,path)))});}catch(e){if(e.code!=='ENOENT')throw e;files.push({path,missing:true});}}return {sha:git('rev-parse','HEAD'),status:git('status','--porcelain','--',...paths),treeSha256:hash(JSON.stringify(files)),files};};
 await mkdir(out,{recursive:true});const mp4=join(out,`${o.case}.mp4`),manifestPath=join(out,`${o.case}.json`);
 const m={schema:1,case:o.case,options:o,root,command:process.argv,pid:process.pid,state:'starting',errors:[],events:[],frames:[],samples:[],evidenceClass:'controlled-real-gameplay',silent:true,pixelReview:'pending; inspect samples. Event verification alone does not prove visual quality.',recorderSha256:hash(await readFile(fileURLToPath(import.meta.url)))};
 const save=()=>writeFile(manifestPath,JSON.stringify(m,null,2)+'\n');
 let server,browser,encoder,closing;
 const bounded=(p,ms)=>{let t;return Promise.race([p,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error('Operation timed out')),ms);})]).finally(()=>clearTimeout(t));};
 const cleanup=()=>closing??=(async()=>{if(encoder&&encoder.exitCode===null)encoder.kill('SIGKILL');if(browser)await bounded(browser.close(),15000).catch(()=>{});if(server)await bounded(server.close(),10000).catch(()=>{});})();
 const signal=()=>{m.state='interrupted';void save().finally(cleanup).finally(()=>process.exit(130));};
 process.once('SIGINT',signal);process.once('SIGTERM',signal);const watchdog=setTimeout(signal,30*60*1000);watchdog.unref();
 try {
  m.sourceBefore=await source();if(o.sourceSha)assert.equal(m.sourceBefore.sha,o.sourceSha);if(!o.provisional)assert.equal(m.sourceBefore.status,'','Final runtime/assets/config must be clean; use provisional for dirty source');await save();
  const {createServer}=await import('vite'),{chromium}=await import('playwright');
  server=await createServer({root,configFile:join(root,'vite.config.ts'),base:'/',server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader'],timeout:120000});
  const page=await browser.newPage({viewport:o.viewport,deviceScaleFactor:1});page.setDefaultTimeout(120000);
  page.on('pageerror',e=>m.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')m.errors.push(e.text());});page.on('response',r=>{if(r.status()>=400)m.errors.push(`${r.status()} ${r.url()}`);});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__vfxGate)cb(t);});});
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__vfxAudit={game,renderer,confirmation,hud,syncScreen};\n'});});
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);await page.waitForFunction(()=>window.__vfxAudit&&document.body.dataset.state==='menu');
  await page.evaluate(()=>{window.__vfxGate=true;});await page.locator('#start').click();m.setup=await page.evaluate(stage,o);
  // Bounded native-timer preroll stops at a real warning/projectile, before impact.
  m.preroll=[];let ready=false;for(let n=0;n<200;n++){const state=await page.evaluate(step,{frame:n-200,o});m.preroll.push(state);if(state.bullets.some(b=>b.kind==='hazard')||state.boss.pendingTelegraph){ready=true;break;}}assert(ready,'No native hazard within ten-second preroll');
  encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(o.fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['pipe','ignore','pipe']});
  m.encoderPid=encoder.pid;m.encoderErrors='';encoder.stderr.on('data',x=>m.encoderErrors+=x);encoder.stdin.on('error',e=>m.errors.push(e.message));const finished=once(encoder,'close');m.state='recording';await save();
  for(let frame=0;frame<o.frames;frame++){
   assert.deepEqual(m.errors,[]);const s=await page.evaluate(step,{frame,o});const png=await page.screenshot({timeout:120000});m.frames.push({...s,sha256:hash(png)});
   if(frame===0)await writeFile(join(out,`${o.case}-first-frame.png`),png);
   if(!encoder.stdin.write(png))await bounded(Promise.race([once(encoder.stdin,'drain'),finished.then(()=>{throw Error('Encoder ended early');})]),30000);
   if(frame%o.fps===0){m.events=await page.evaluate(()=>window.__vfxAudit.events);await save();console.log(JSON.stringify({case:o.case,frame,total:o.frames}));}
  }
  encoder.stdin.end();assert.equal((await bounded(finished,60000))[0],0,m.encoderErrors);
  m.events=await page.evaluate(()=>window.__vfxAudit.events);m.domainEvents=await page.evaluate(()=>window.__vfxAudit.domainEvents);verifyEvents(m.events,m.frames,o,m.domainEvents);assert.deepEqual(m.errors,[]);
  m.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',mp4],{encoding:'utf8',timeout:60000}));assert.equal(m.probe.streams.length,1);verifyProbe(m.probe,o);
  execFileSync('ffmpeg',['-v','error','-xerror','-i',mp4,'-f','null','-'],{timeout:60000});m.decodeErrors=[];
  const p=m.events.find(e=>e.type==='acid'&&e.targetId===undefined&&e.frame>=0)?.pixel;assert(p,'Missing event centroid');const size=128,x=Math.max(0,Math.min(o.viewport.width-size,Math.round(p.x)-size/2)),y=Math.max(90,Math.min(370-size,Math.round(p.y)-size/2));
  assert(p.x>=x&&p.x<x+size&&p.y>=y&&p.y<y+size,'Target crop would overlap HUD/caption; choose another legal location');
  const raw=execFileSync('ffmpeg',['-v','error','-i',mp4,'-vf',`crop=${size}:${size}:${x}:${y},format=gray`,'-f','rawvideo','pipe:1'],{maxBuffer:16*1024*1024,timeout:60000});m.motion={crop:[x,y,size,size],...decodedMotion(raw,size*size,o.frames)};
  const first=m.events.find(e=>e.type==='acid'&&e.targetId===undefined)?.frame??4;
  for(const frame of [...new Set([0,first,first+1,first+3,first+10,first+25,first+35,Math.floor(o.frames/2),o.frames-1])].filter(f=>f<o.frames)){
   const file=`${o.case}-decoded-${frame}.png`;execFileSync('ffmpeg',['-v','error','-y','-i',mp4,'-vf',`select=eq(n\\,${frame})`,'-frames:v','1',join(out,file)],{timeout:60000});m.samples.push({frame,file,sha256:hash(await readFile(join(out,file)))});
  }
  m.sourceAfter=await source();assert.equal(m.sourceAfter.sha,m.sourceBefore.sha,'HEAD changed');assert.equal(m.sourceAfter.treeSha256,m.sourceBefore.treeSha256,'Source changed');if(!o.provisional)assert.equal(m.sourceAfter.status,'');
  m.mp4={path:mp4,sha256:hash(await readFile(mp4))};m.state='verified';m.finalEvidence=!o.provisional;await save();console.log(JSON.stringify({state:m.state,case:o.case,mp4,manifestPath,provisional:o.provisional}));
 }catch(e){m.state='failed';m.errors.push(e.stack??String(e));await save();throw e;}
 finally{clearTimeout(watchdog);process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);await cleanup();}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv.slice(2).join(' ')==='--list')console.log(JSON.stringify(CASES,null,2));else await record(options(process.argv.slice(2)));}
