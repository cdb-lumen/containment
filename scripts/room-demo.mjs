#!/usr/bin/env node
// Fixed-step real DepthGame + DepthRenderer video. No production files or RAF loop.
// Final: node scripts/room-demo.mjs --room=awakening-bay --source-sha=$(git rev-parse HEAD) --out=/absolute/delivery
// Pipeline check only: --provisional --seconds=2. Defaults: 6s, 20fps, desktop, high.
// Controlled encounter, not campaign/HUD/input/balance or target-device FPS evidence.
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,relative,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {once} from 'node:events';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function demoOptions(args) {
 const values={};
 for(const arg of args) {
  if(arg==='--provisional'){values.provisional=true;continue;}
  const match=/^--(room|out|seconds|fps|viewport|quality|source-sha)=(.+)$/.exec(arg);
  assert(match,`Unknown argument ${arg}; use --name=value`);
  assert(!(match[1] in values),`Duplicate argument ${match[1]}`);values[match[1]]=match[2];
 }
 const provisional=values.provisional===true,seconds=Number(values.seconds??6),fps=Number(values.fps??20);
 assert(provisional||/^[a-f0-9]{40}$/.test(values['source-sha']??''),'Final recording requires --source-sha=<exact 40-character HEAD>');
 assert((seconds>=6&&seconds<=10)||(provisional&&seconds===2),'seconds must be 6–10, or 2 with --provisional');
 assert(Number.isInteger(fps)&&fps>=20&&fps<=60&&Number.isInteger(seconds*fps),'fps must be integer 20–60 with integral frame count');
 const viewportName=values.viewport??'desktop',quality=values.quality??'high',room=values.room??'awakening-bay';
 assert(['desktop','phone'].includes(viewportName),'viewport must be desktop or phone');
 assert(['high','low'].includes(quality),'quality must be high or low');
 assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(room),'Invalid room identifier');
 return {room,provisional,seconds,fps,frames:seconds*fps,quality,viewportName,viewport:viewportName==='phone'?{width:390,height:844}:{width:1280,height:900},sourceSha:values['source-sha'],out:resolve(values.out??`docs/pr-screenshots/room-demo/${room}${provisional?'-provisional':''}`)};
}
export function verifyProbe(probe,options) {
 const stream=probe.streams[0];assert(stream,'Missing video stream');
 assert.equal(stream.codec_name,'h264');assert.equal(stream.pix_fmt,'yuv420p');
 assert.equal(stream.width,options.viewport.width);assert.equal(stream.height,options.viewport.height);
 assert.equal(Number(stream.nb_read_frames),options.frames,'Decoded frame count');
 const [n,d]=stream.avg_frame_rate.split('/').map(Number);assert.equal(n/d,options.fps);
 assert(Math.abs(Number(probe.format.duration)-options.seconds)<.025,'Video duration');
}
export function decodedMotion(raw,size,frames) {
 assert.equal(raw.length,size*frames,'Decoded crop byte length');
 const hashes=[],deltas=[];
 for(let frame=0;frame<frames;frame++) {
  const bytes=raw.subarray(frame*size,(frame+1)*size);hashes.push(hash(bytes));
  if(frame){let delta=0;for(let i=0;i<size;i++)delta+=Math.abs(bytes[i]-raw[(frame-1)*size+i]);deltas.push(delta/size);}
 }
 const uniqueFrames=new Set(hashes).size,maxMeanDelta=Math.max(...deltas);
 assert(uniqueFrames>5&&maxMeanDelta>.05,'No decoded actor-region motion');
 return {uniqueFrames,maxMeanDelta,hashes,deltas};
}
export function verifyRuntime(runtime,frames,options) {
 assert(Math.abs(runtime.elapsed-options.seconds)<1e-6,'Simulation duration');
 assert(runtime.travel>30,'No real player movement');
 assert(runtime.legalChecks>=options.frames,'Missing legal actor checks');
 assert(runtime.events.filter(e=>e.type==='shot').length>=Math.floor(options.seconds*2),'Too few live shots');
 assert(runtime.damage>0,'No authoritative enemy damage');
 assert(frames.some(f=>f.bullets>0),'No live projectiles');
}
function mp4Atoms(bytes) {
 const atoms=[];let offset=0;
 while(offset+8<=bytes.length){let size=bytes.readUInt32BE(offset);const type=bytes.toString('ascii',offset+4,offset+8);if(size===1)size=Number(bytes.readBigUInt64BE(offset+8));if(size===0)size=bytes.length-offset;assert(size>=8&&offset+size<=bytes.length,'Invalid MP4 atom');atoms.push({type,offset,size});offset+=size;}
 assert.equal(offset,bytes.length);assert(atoms.some(a=>a.type==='moov')&&atoms.some(a=>a.type==='mdat'));
 assert(atoms.find(a=>a.type==='moov').offset<atoms.find(a=>a.type==='mdat').offset,'MP4 lacks faststart');return atoms;
}

async function record(options) {
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.out;
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
 const source=async()=>{
  const paths=git('ls-files','--cached','--others','--exclude-standard','--','src','public','scripts','package.json','package-lock.json','vite.config.ts').split('\n').filter(Boolean).sort();
  const files=[];for(const path of [...new Set(paths)]){try{files.push({path,sha256:hash(await readFile(join(root,path)))});}catch(error){if(error.code!=='ENOENT')throw error;files.push({path,missing:true});}}
  return {sha:git('rev-parse','HEAD'),status:git('status','--porcelain','--','src','public','scripts','package.json','package-lock.json','vite.config.ts'),treeSha256:hash(JSON.stringify(files)),files};
 };
 let server,browser,temp,encoder,stopping=false;
 const errors=[],frames=[],encoders=new Set();
 await mkdir(out,{recursive:true});
 const name=`${options.room}-${options.viewportName}${options.provisional?'-provisional':''}`,mp4=join(out,name+'.mp4'),manifestPath=join(out,name+'.json');
 const manifest={schema:1,name,root,options,command:process.argv,pid:process.pid,startedAt:new Date().toISOString(),state:'starting',evidenceClass:'controlled-live-gameplay',staging:'Actual DepthGame.update and DepthRenderer with native gameplay camera/composer, seeded legal midpoint on a verified spawn-to-exit route. Three stationary high-health brutes, disabled enemy attacks and inactive encounter director. Normal move, aim, fire and reload commands, no fabricated effect events. No campaign progression or DOM HUD. Fixed-step software WebGL capture does not measure target-device FPS.',errors,frames,pixelReview:'pending; inspect decoded samples'};
 const save=()=>writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 const cleanup=async()=>{for(const child of encoders){if(child.exitCode===null)child.kill('SIGKILL');}await browser?.close();await server?.close();if(temp)await rm(temp,{recursive:true,force:true});};
 const signal=()=>{if(stopping)return;stopping=true;errors.push('Interrupted by signal');manifest.state='interrupted';void save().finally(()=>cleanup()).finally(()=>process.exit(130));};
 process.once('SIGINT',signal);process.once('SIGTERM',signal);
 const watchdog=setTimeout(signal,30*60*1000);watchdog.unref();
 try {
  manifest.sourceBefore=await source();
  if(!options.provisional){assert.equal(manifest.sourceBefore.sha,options.sourceSha,'Final source SHA mismatch');assert.equal(manifest.sourceBefore.status,'','Final source/tooling must be committed');}
  await save();
  const {createServer}=await import('vite'),{chromium}=await import('playwright');
  server=await createServer({root,configFile:join(root,'vite.config.ts'),base:'/',cacheDir:join(out,'.vite-cache'),optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0,hmr:false,preTransformRequests:false},logLevel:'error'});
  await server.listen();manifest.origin=`http://127.0.0.1:${server.httpServer.address().port}/`;
  manifest.vite={root,configFile:join(root,'vite.config.ts'),hmr:false};
  const {ROOM_TEMPLATES}=await server.ssrLoadModule('/src/game/roguelike/roomTemplates.ts');
  const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts');
  assert(ROOM_TEMPLATES[options.room],`Unknown room ${options.room}`);
  const node=generateRun(1729,3).nodes.find(n=>n.templateId===options.room);assert(node,`Room not in story route: ${options.room}`);manifest.node=node;
  temp=await mkdtemp(join(root,'.room-demo-'));
  await writeFile(join(temp,'index.html'),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>html,body{margin:0;overflow:hidden;background:#071014}canvas{display:block;width:100vw;height:100vh}#caption{position:fixed;left:12px;bottom:12px;padding:6px 9px;background:#061116e8;color:#e8f3f1;font:12px monospace;max-width:calc(100% - 42px);pointer-events:none}</style></head><body><canvas></canvas><div id="caption"></div><script type="module" src="./capture.ts"></script></body></html>');
  await writeFile(join(temp,'capture.ts'),`
import * as T from 'three';
import {stageEvidenceGame,traverseEvidenceRoom} from '/scripts/room-evidence-scene.mjs';
import {DepthRenderer} from '/src/render/DepthRenderer';
import {preloadAssets} from '/src/render/assets';
import {EnemySystem} from '/src/game/enemies/EnemySystem';
import {canOccupyExpedition} from '/src/game/world/expeditionGeometry';
let seed=1729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
await preloadAssets();
const renderer=new DepthRenderer(document.querySelector('canvas'));renderer.setQuality(${JSON.stringify(options.quality)});
const events=[];let game,route,index,direction=1,nativeZoom,travel=0,legalChecks=0,initialHealth=0;
const point=p=>({x:p.x,y:p.y});
const project=(x,y)=>{const p=new T.Vector3(x/32,1,y/32).project(renderer.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};};
window.demo={
 async stage(node) {
  const traversal=traverseEvidenceRoom(node);route=traversal.route;
  const fixture=stageEvidenceGame(node,e=>{events.push({...e,frame:window.demo.frameIndex??-1});renderer.effect(e);});game=fixture.game;
  game.enemies=new EnemySystem({balance:{health:100,damage:0,speed:0,eliteHealth:1,eliteDamage:1,specials:false},canMove:()=>false,canAttack:()=>false});
  for(const p of fixture.staged){const result=game.enemies.spawn('brute',p.x,p.y,false);if(!result.spawned)throw Error('Controlled enemy spawn failed');}
  initialHealth=game.enemies.snapshot.enemies.reduce((sum,e)=>sum+e.health,0);
  index=Math.floor(route.length/2)+1;game.aimVisible=(x,y)=>renderer.visible(x,y);
  await renderer.prepare(game.node);renderer.resize();renderer.render(game,0,false);nativeZoom=renderer.camera.zoom;
  if(!renderer.camera.isOrthographicCamera)throw Error('Expected native orthographic camera');
  document.querySelector('#caption').textContent=${JSON.stringify(`${options.provisional?'PROVISIONAL pipeline check · ':''}${options.room} · controlled live encounter · native gameplay camera`)};
  return {traversal,staged:fixture.staged,player:point(game.player),nativeZoom,seed:1729,webgl:renderer.renderer.getContext().getParameter(renderer.renderer.getContext().VERSION)};
 },
 step(frame,fps) {
  this.frameIndex=frame;
  // Follow the existing radius-checked route through real movement, never teleport.
  if(Math.hypot(game.player.x-route[index].x,game.player.y-route[index].y)<2){index+=direction;if(index>=route.length-1||index<=0){direction*=-1;index+=direction;}}
  const target=route[index],dx=target.x-game.player.x,dy=target.y-game.player.y,d=Math.hypot(dx,dy),speed=Math.min(.35,d/(220/fps));
  const before=point(game.player);if(game.combat.snapshot.magazine===0)game.reload();
  game.update(1000/fps,{x:d?dx/d*speed:0,y:d?dy/d*speed:0,fire:true,angle:null,autoAim:true});
  travel+=Math.hypot(game.player.x-before.x,game.player.y-before.y);
  if(game.status!=='playing')throw Error('Left playing state: '+game.status);
  const enemies=game.enemies.snapshot.enemies;
  for(const actor of [game.player,...enemies]){if(!canOccupyExpedition(game.geometry,actor,actor.radius))throw Error('Actor entered solid geometry');legalChecks++;}
  renderer.renderer.info.reset();renderer.render(game,1/fps,false);
  if(renderer.camera.zoom!==nativeZoom)throw Error('Gameplay zoom changed');
  const gl=renderer.renderer.getContext();gl.finish();const glError=gl.getError();
  if(glError||gl.isContextLost()||!renderer.renderer.info.render.calls)throw Error('Invalid WebGL frame '+glError);
  return {frame,elapsed:game.elapsed,player:point(game.player),playerPixel:project(game.player.x,game.player.y),enemies:enemies.map(e=>({...point(e),id:e.id,health:e.health,armor:e.armor})),bullets:game.bullets.length,travel,legalChecks,drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,webglError:glError,camera:{zoom:nativeZoom,left:renderer.camera.left,right:renderer.camera.right,top:renderer.camera.top,bottom:renderer.camera.bottom,position:renderer.camera.position.toArray()}};
 },
 result(){return {events,travel,legalChecks,damage:initialHealth-game.enemies.snapshot.enemies.reduce((sum,e)=>sum+e.health,0),elapsed:game.elapsed,activeEnemies:game.enemies.activeCount};}
};
`);
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:options.viewport,deviceScaleFactor:1,isMobile:options.viewportName==='phone',hasTouch:options.viewportName==='phone'});
  const page=await context.newPage();page.setDefaultTimeout(120000);const cdp=await context.newCDPSession(page);
  const aborted=[],finishedUrls=new Set();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  page.on('requestfinished',r=>finishedUrls.add(r.url()));
  page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED')aborted.push(r.url());else errors.push(`${r.url()} ${r.failure()?.errorText}`);});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(manifest.origin).origin?route.continue():route.abort('blockedbyclient'));
  await page.goto(manifest.origin+relative(root,temp)+'/index.html');await page.waitForFunction(()=>!!window.demo);
  manifest.setup=await page.evaluate(node=>window.demo.stage(node),node);
  encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate',String(options.fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['pipe','ignore','pipe']});
  encoders.add(encoder);manifest.encoderPid=encoder.pid;manifest.encoderErrors='';encoder.stderr.on('data',x=>manifest.encoderErrors+=x);encoder.stdin.on('error',e=>errors.push('encoder stdin: '+e.message));
  const encoded=once(encoder,'close');manifest.state='recording';await save();
  for(let frame=0;frame<options.frames;frame++) {
   assert(!stopping,'Interrupted');assert.deepEqual(errors,[]);
   const metrics=await page.evaluate(({frame,fps})=>window.demo.step(frame,fps),{frame,fps:options.fps});
   const png=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,optimizeForSpeed:true})).data,'base64');
   assert.equal(png.readUInt32BE(16),options.viewport.width);assert.equal(png.readUInt32BE(20),options.viewport.height);
   frames.push({...metrics,sha256:hash(png)});
   if(!encoder.stdin.write(png))await Promise.race([once(encoder.stdin,'drain'),encoded.then(()=>{throw Error('Encoder exited before drain');})]);
   if(frame%options.fps===0){await save();console.log(JSON.stringify({name,frame,total:options.frames}));}
  }
  encoder.stdin.end();const [code]=await encoded;encoders.delete(encoder);assert.equal(code,0,manifest.encoderErrors);assert.equal(manifest.encoderErrors,'');
  manifest.runtime=await page.evaluate(()=>window.demo.result());
  verifyRuntime(manifest.runtime,frames,options);
  assert.deepEqual(errors,[]);
  assert(aborted.every(url=>/\.(?:[cm]?[jt]sx?)(?:\?|$)/.test(url)&&finishedUrls.has(url)),`Unresolved aborted requests: ${JSON.stringify(aborted)}`);manifest.abortedDuplicateModules=aborted;
  manifest.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=codec_name,pix_fmt,width,height,avg_frame_rate,nb_frames,nb_read_frames:format=duration','-of','json',mp4],{encoding:'utf8',timeout:120000}));verifyProbe(manifest.probe,options);
  const bytes=await readFile(mp4);manifest.mp4={path:mp4,sha256:hash(bytes),bytes:bytes.length,atoms:mp4Atoms(bytes)};
  // Native camera tracks the player. Decode a fixed projected player/world crop,
  // entirely above the caption; this cannot pass from caption/HUD-only animation.
  const p=frames[Math.floor(frames.length/2)].playerPixel,size=160;
  const x=Math.max(0,Math.min(options.viewport.width-size,Math.round(p.x)-size/2)),y=Math.max(0,Math.min(options.viewport.height-size-64,Math.round(p.y)-size/2));
  assert(p.x>=x&&p.x<x+size&&p.y>=y&&p.y<y+size,'Player outside motion crop');
  const raw=execFileSync('ffmpeg',['-v','error','-i',mp4,'-vf',`crop=${size}:${size}:${x}:${y},format=gray`,'-f','rawvideo','pipe:1'],{maxBuffer:32*1024*1024,timeout:120000});
  manifest.motion={crop:[x,y,size,size],...decodedMotion(raw,size*size,options.frames)};
  manifest.samples=[];
  for(const frame of [...new Set([0,Math.floor(options.frames/3),Math.floor(2*options.frames/3),options.frames-1])]) {
   const file=`${name}-decoded-${frame}.png`;
   execFileSync('ffmpeg',['-v','error','-y','-i',mp4,'-vf',`select=eq(n\\,${frame})`,'-frames:v','1',join(out,file)],{timeout:120000});
   manifest.samples.push({frame,file,sha256:hash(await readFile(join(out,file)))});
  }
  // Decode entire file, fail on any decoder error, beyond ffprobe metadata alone.
  execFileSync('ffmpeg',['-v','error','-xerror','-i',mp4,'-f','null','-'],{timeout:120000,stdio:['ignore','pipe','pipe']});manifest.decodeErrors=[];
  manifest.sourceAfter=await source();manifest.sourceStable=manifest.sourceBefore.sha===manifest.sourceAfter.sha&&manifest.sourceBefore.treeSha256===manifest.sourceAfter.treeSha256;
  if(!options.provisional){assert(manifest.sourceStable,'Source changed during final recording');assert.equal(manifest.sourceAfter.status,'','Final source dirtied during recording');}
  manifest.state='verified';manifest.completedAt=new Date().toISOString();await save();
  console.log(JSON.stringify({state:manifest.state,mp4,manifest:manifestPath,frames:options.frames,motionUniqueFrames:manifest.motion.uniqueFrames,sourceStable:manifest.sourceStable,provisional:options.provisional}));
 } catch(error) {errors.push(error.stack??String(error));manifest.state='failed';await save();throw error;}
 finally {clearTimeout(watchdog);process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);await cleanup();}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await record(demoOptions(process.argv.slice(2)));
