#!/usr/bin/env node
// Real production main.frame, input, projectile deaths and native camera.
// --self-test is CPU-only. Imports never launch Vite, a browser or ffmpeg.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {once} from 'node:events';
const hash=b=>createHash('sha256').update(b).digest('hex');
export function demoOptions(argv) {
 const a={};for(const arg of argv){const m=/^--(provisional|self-test|help)$/.exec(arg)??/^--(out|source-sha|viewport|seconds|quality|measure-frames)=(.+)$/.exec(arg);assert(m,`Unknown option ${arg}`);assert(!(m[1] in a),`Duplicate --${m[1]}`);a[m[1]]=m[2]??true;}
 if(a.help||a['self-test']){assert.equal(Object.keys(a).length,1,'help/self-test must be used alone');return {help:!!a.help,selfTest:!!a['self-test']};}
 const provisional=a.provisional===true,seconds=Number(a.seconds??(provisional?2:6));
 assert(seconds===(provisional?2:6),'Use exactly 2 provisional seconds or 6 final seconds');
 const viewportName=a.viewport??'desktop';assert(['desktop','portrait'].includes(viewportName),'viewport must be desktop or portrait');
 const quality=a.quality??'high';assert(['high','low'].includes(quality),'quality must be high or low');
 if(!provisional)assert.match(a['source-sha']??'',/^[a-f0-9]{40}$/,'Final mode needs exact --source-sha');
 if(a['source-sha'])assert.match(a['source-sha'],/^[a-f0-9]{40}$/);
 const measureFrames=Number(a['measure-frames']??180);assert(Number.isInteger(measureFrames)&&measureFrames>=0&&measureFrames<=600,'measure-frames must be 0..600');
 return {provisional,seconds,fps:20,frames:seconds*20,viewportName,viewport:viewportName==='desktop'?{width:1280,height:720}:{width:390,height:844},quality,sourceSha:a['source-sha'],measureFrames,out:resolve(a.out??`artifacts/ragdoll-${viewportName}${provisional?'-provisional':''}`)};
}
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function verifyStats(s){
 for(const k of ['active','settled','bodies','joints','budget','stepMs'])assert(finite(s?.[k])&&s[k]>=0,`Invalid ragdoll ${k}`);
 for(const k of ['active','settled','bodies','joints','budget'])assert(Number.isInteger(s[k]),`Nonintegral ${k}`);
 assert(s.active<=s.budget,'Active budget exceeded');assert(s.bodies<=s.budget*20,'Body budget exceeded');assert(s.joints<=s.bodies,'Joint budget exceeded');
 if(s.active){assert(s.bodies>=s.active*3,'Missing articulated bodies');assert(s.joints>=s.active*2,'Missing joints');}
}
// Relative quaternion changes reject whole-body rigid spinning and translation.
function relativeQ(a,b){const x=-a.x,y=-a.y,z=-a.z,w=a.w;return [w*b.x+x*b.w+y*b.z-z*b.y,w*b.y-x*b.z+y*b.w+z*b.x,w*b.z+x*b.y-y*b.x+z*b.w,w*b.w-x*b.x-y*b.y-z*b.z];}
export function articulation(frames,id){
 let baseline;let maximum=0,observations=0;
 for(const f of frames){const parts=f.ragdolls.find(r=>r.id===id)?.parts;if(!parts?.length)continue;
  for(const p of parts){assert(typeof p.name==='string');for(const k of ['x','y','z'])assert(finite(p.position?.[k]),'Nonfinite body position');for(const k of ['x','y','z','w'])assert(finite(p.rotation?.[k]),'Nonfinite body rotation');}
  const root=parts[0],rel=new Map(parts.slice(1).map(p=>[p.name,relativeQ(root.rotation,p.rotation)]));
  if(!baseline){baseline=rel;continue;}observations++;
  for(const [name,q] of rel){const b=baseline.get(name);if(b)maximum=Math.max(maximum,Math.min(Math.hypot(...q.map((v,i)=>v-b[i])),Math.hypot(...q.map((v,i)=>v+b[i]))));}
 }
 assert(observations>=2,`Missing body-motion series for ${id}`);assert(maximum>.002,`No independent joint rotation for ${id}`);return {id,observations,maxRelativeQuaternionChange:maximum};
}
export function verifyBehavior(manifest){
 const {frames,events,targets,options}=manifest;assert.equal(frames.length,options.frames,'Frame count');assert.deepEqual(manifest.errors,[],'Browser/network errors');
 assert.equal(targets.length,2,'Need ordinary and heavy targets');assert.deepEqual(targets.map(t=>t.family),['crawler','brute']);assert.deepEqual(targets.map(t=>t.weapon),['shotgun','rocket']);
 for(let i=0;i<frames.length;i++){const f=frames[i];assert.equal(f.frame,i);verifyStats(f.stats);assert.equal(f.status,'playing');assert.equal(f.zoom,1,'Native gameplay zoom required');assert.equal(f.loading,false);assert.equal(f.busy,'false');assert.equal(f.glError,0);assert(f.drawCalls>0);for(const r of f.ragdolls)assert(finite(r.jointError)&&r.jointError<.5,'Joint error above 0.5 world units');if(i)assert(Math.abs(f.elapsed-frames[i-1].elapsed-.05)<1e-6,'Production frame did not advance 50ms');}
 return targets.map(t=>{assert(t.setupHealth>0,'Setup killed target');const deaths=events.filter(e=>e.type==='corpse'&&e.id===t.id);assert.equal(deaths.length,1,`Expected exactly one death for ${t.id}`);const d=deaths[0];assert(d.frame>=0&&d.frame<frames.length-3,'Death missing usable aftermath');assert(events.some(e=>e.type==='shot'&&e.weapon===t.weapon&&e.frame>=0&&e.frame<=d.frame),'No real lethal weapon shot');assert(frames.some(f=>f.hits.some(h=>h.id===t.id&&h.died&&h.healthDamage>0)),'No observed lethal EnemySystem.applyDamage');assert(frames.some(f=>f.bullets>0)||events.some(e=>e.contact&&e.targetId===t.id),'No projectile/contact witness');return articulation(frames,t.id);});
}
export function verifyProbe(p,o){assert.equal(p.streams.length,1,'Expected silent single-stream video');const s=p.streams[0];assert.equal(s.codec_name,'h264');assert.equal(s.pix_fmt,'yuv420p');assert.equal(s.width,o.viewport.width);assert.equal(s.height,o.viewport.height);assert.equal(Number(s.nb_read_frames),o.frames);assert.equal(Number(s.nb_frames),o.frames);assert.equal(s.avg_frame_rate,'20/1');assert(Math.abs(Number(p.format.duration)-o.seconds)<.025);}
export function selfTest(){
 let checks=0;const ok=fn=>{fn();checks++;},bad=fn=>{assert.throws(fn);checks++;};
 ok(()=>assert.equal(demoOptions(['--provisional']).frames,40));ok(()=>assert.deepEqual(demoOptions(['--provisional','--viewport=desktop']).viewport,{width:1280,height:720}));ok(()=>assert.deepEqual(demoOptions(['--provisional','--viewport=portrait']).viewport,{width:390,height:844}));
 for(const a of [[],['--provisional=false'],['--provisional','--viewport=phone'],['--provisional','--seconds=6'],['--provisional','--fps=20'],['--provisional','--provisional'],['--self-test','--out=x'],['--provisional','--measure-frames=601']])bad(()=>demoOptions(a));
 const stats={active:1,settled:0,bodies:3,joints:2,budget:3,stepMs:.1};ok(()=>verifyStats(stats));for(const patch of [{active:4},{bodies:61},{joints:4},{stepMs:NaN},{bodies:0},{settled:-1}])bad(()=>verifyStats({...stats,...patch}));
 const rotation={x:0,y:0,z:0,w:1};const frames=Array.from({length:5},(_,i)=>({ragdolls:[{id:7,parts:[{name:'root',position:{x:i,y:1,z:0},rotation},{name:'limb',position:{x:i+1,y:1,z:0},rotation:{x:Math.sin(i*.1),y:0,z:0,w:Math.cos(i*.1)}}]}]}));
 ok(()=>articulation(frames,7));bad(()=>articulation(frames.map(f=>({ragdolls:[{id:7,parts:f.ragdolls[0].parts.map(p=>({...p,rotation}))}]})),7));bad(()=>articulation([],7));
 const opts=demoOptions(['--provisional']);const probe={streams:[{codec_name:'h264',pix_fmt:'yuv420p',width:1280,height:720,nb_read_frames:'40',nb_frames:'40',avg_frame_rate:'20/1'}],format:{duration:'2'}};ok(()=>verifyProbe(probe,opts));bad(()=>verifyProbe({...probe,streams:[{...probe.streams[0],nb_read_frames:'39'}]},opts));
 const fixture={options:{frames:5},errors:[],targets:[{id:7,family:'crawler',weapon:'shotgun',setupHealth:1},{id:8,family:'brute',weapon:'rocket',setupHealth:1}],events:[{type:'shot',weapon:'shotgun',frame:0},{type:'shot',weapon:'rocket',frame:0},{type:'corpse',id:7,frame:1},{type:'corpse',id:8,frame:1}],frames:frames.map((f,i)=>({frame:i,elapsed:i*.05,status:'playing',zoom:1,loading:false,busy:'false',glError:0,drawCalls:1,bullets:1,stats,ragdolls:[{...f.ragdolls[0],jointError:.01},{...f.ragdolls[0],id:8,jointError:.01}],hits:i===1?[{id:7,died:true,healthDamage:1},{id:8,died:true,healthDamage:1}]:[]}))};
 ok(()=>verifyBehavior(fixture));
 for(const mutate of [m=>m.events.pop(),m=>m.frames[1].elapsed=.016,m=>m.frames[2].zoom=1.23,m=>m.frames[1].hits=[],m=>m.errors.push('net::ERR_ABORTED'),m=>m.frames[2].ragdolls[0].jointError=2,m=>m.targets[0].setupHealth=0,m=>m.events.push({type:'corpse',id:7,frame:1}),m=>m.frames[2].loading=true]){const broken=structuredClone(fixture);mutate(broken);bad(()=>verifyBehavior(broken));}
 console.log(JSON.stringify({passed:true,cpuOnly:true,checks}));return checks;
}
async function record(options){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=options.out;
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',timeout:15000}).trim();
 async function source(){const paths=git('ls-files','--cached','--others','--exclude-standard','--','src','public','scripts','index.html','package.json','package-lock.json','vite.config.ts','pnpm-lock.yaml','yarn.lock').split('\n').filter(Boolean).sort();const files=[];for(const path of [...new Set(paths)])files.push({path,sha256:hash(await readFile(join(root,path)))});return {sha:git('rev-parse','HEAD'),status:git('status','--porcelain','--untracked-files=all'),treeSha256:hash(JSON.stringify(files)),files};}
 // Never overwrite a previous attempt or its failure evidence.
 await mkdir(out,{recursive:false});
 const m={schema:1,options,root,command:process.argv,pid:process.pid,state:'starting',errors:[],frames:[],events:[],targets:[],samples:[],pixelReview:'pending independent inspection',disclosure:'Controlled opening-room encounter. Seeded run, director disabled, legal spawned crawler/shotgun and brute/rocket. Setup-only nonlethal armor/health reduction to 1 health. Native AI, InputController pointer, real main.frame, collision, death routing, loaded actors, room geometry, HUD and gameplay camera retained. No injected corpse/effect. Silent fixed-step video, not real-time or phone FPS evidence. External Google font CSS replaced by empty CSS, system fallback disclosed.'};
 const manifest=join(out,'manifest.json'),save=()=>writeFile(manifest,JSON.stringify(m,null,2)+'\n');let server,browser,browserServer,encoder,closing;
 const bounded=(p,ms,label)=>{let t;return Promise.race([p,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(`${label} timeout`)),ms);})]).finally(()=>clearTimeout(t));};
 const cleanup=()=>closing??=(async()=>{if(encoder&&encoder.exitCode===null){encoder.kill('SIGKILL');}if(browser)try{await bounded(browser.close(),10000,'browser close');}catch{}if(browserServer)try{await bounded(browserServer.close(),10000,'browser server close');}catch{browserServer.process()?.kill('SIGKILL');}if(server)await bounded(server.close(),10000,'Vite close');})();
 const signal=()=>{m.state='interrupted';void save().finally(cleanup).finally(()=>process.exit(130));};process.once('SIGINT',signal);process.once('SIGTERM',signal);const watchdog=setTimeout(signal,30*60*1000);
 try{
  m.sourceBefore=await source();if(!options.provisional){assert.equal(m.sourceBefore.sha,options.sourceSha);assert.equal(m.sourceBefore.status,'','Final capture requires clean complete worktree');}await save();
  const {createServer}=await import('vite'),{chromium}=await import('playwright');
  server=await createServer({root,configFile:join(root,'vite.config.ts'),base:'/',cacheDir:join(out,'.vite-cache'),optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0,hmr:false,preTransformRequests:false},logLevel:'error'});await server.listen();
  m.origin=`http://127.0.0.1:${server.httpServer.address().port}/`;
  browserServer=await chromium.launchServer({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader'],timeout:120000});m.browserPid=browserServer.process()?.pid;browser=await chromium.connect(browserServer.wsEndpoint());
  const context=await browser.newContext({viewport:options.viewport,deviceScaleFactor:1,isMobile:options.viewportName==='portrait',hasTouch:options.viewportName==='portrait'}),page=await context.newPage();page.setDefaultTimeout(120000);
  page.on('pageerror',e=>m.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')m.errors.push(e.text());});page.on('requestfailed',r=>m.errors.push(`${r.url()} ${r.failure()?.errorText}`));page.on('response',r=>{if(r.status()>=400)m.errors.push(`${r.status()} ${r.url()}`);});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__ragHold)cb(t);});});
  await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__ragDemo={game,renderer,input,frame,pacer,hud,syncScreen};\n'});});
  await page.goto(m.origin);await page.waitForFunction(()=>window.__ragDemo&&document.body.dataset.state==='menu');await page.evaluate(()=>{window.__ragHold=true;});await page.locator('#start').click();
  await page.evaluate(async quality=>{const d=window.__ragDemo,g=d.game;const {expeditionRewardOffers}=await import('/src/game/roguelike/expedition.ts');d.geometry=await import('/src/game/world/expeditionGeometry.ts');g.newRun(1729);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.skipStory();g.pending=[];g.director.update=()=>[];g.clearRequested=false;g.enemies.reset();d.renderer.setQuality(quality);d.syncScreen(true);d.now=1000;d.pacer.reset();d.frame(d.now);},options.quality);
  // Async owner waits never advance simulation. Only shipping frame clears recovery.
  await page.waitForFunction(()=>!window.__ragDemo.renderer.roomLoading,{},{polling:100});
  m.setup=await page.evaluate(()=>{const d=window.__ragDemo,r=d.renderer;d.now+=50;d.frame(d.now);d.hud();d.syncScreen(true);const owners=Object.fromEntries(['sealedBank','releasedBerth','recoveryKit','passengerVault','residentialGalleryEquipment'].filter(k=>r[k]).map(k=>[k,r[k].state]));if(!Object.keys(owners).length||Object.values(owners).some(s=>s!=='ready'))throw Error('Authored room assets not ready: '+JSON.stringify(owners));if(r.camera.zoom!==1||!document.querySelector('#room-loading').hidden||r.canvas.getAttribute('aria-busy')!=='false')throw Error('Native recovery incomplete');if(typeof r.ragdolls?.snapshot!=='function'||typeof r.ragdolls?.inspect!=='function'||typeof r.ragdolls?.maxJointError!=='function')throw Error('Ragdoll diagnostics unavailable');d.events=[];d.hits=[];d.index=-1;const effect=r.effect.bind(r);r.effect=e=>{d.events.push({...e,frame:d.index});return effect(e);};const damage=d.game.enemies.applyDamage.bind(d.game.enemies);d.game.enemies.applyDamage=(id,amount,k)=>{const result=damage(id,amount,k);d.hits.push({id,amount,knockback:k,frame:d.index,...result});return result;};d.targets=[];return {owners,room:d.game.node.templateId,nativeZoom:r.camera.zoom,player:{...d.game.player},quality:r.qualityTier};});
  // Prime reset pacer with zero elapsed before first 50ms gameplay tick.
  await page.evaluate(()=>{const d=window.__ragDemo;d.pacer.sample(d.now);});
  const stage=async(family,weapon)=>page.evaluate(({family,weapon})=>{const d=window.__ragDemo,g=d.game,r=d.renderer;d.input.reset();g.switchWeapon(weapon);const candidates=[];for(const distance of [170,200,140,230])for(let i=0;i<32;i++){const angle=i*Math.PI/16,p={x:g.player.x+Math.cos(angle)*distance,y:g.player.y+Math.sin(angle)*distance};if(d.geometry.canOccupyExpedition(g.geometry,p,32)&&d.geometry.hasClearExpeditionShot(g.geometry,g.player,p)&&r.visible(p.x,p.y))candidates.push(p);}if(!candidates.length)throw Error('No legal visible target position');const spawn=g.enemies.spawn(family,candidates[0].x,candidates[0].y);if(!spawn.spawned)throw Error('Spawn refused');const e=spawn.enemy;g.enemies.applyDamage(e.id,e.health+e.armor-1);const after=g.enemies.getSnapshot(e.id);if(!after||after.health!==1||after.armor!==0)throw Error('Setup weakening was not nonlethal');const t={id:e.id,family,weapon,initial:{...e},setupHealth:after.health,setupArmor:after.armor,position:candidates[0]};d.targets.push(t);d.targetId=e.id;return t;},{family,weapon});
  const mp4=join(out,`ragdolls-${options.viewportName}.mp4`);encoder=spawn('ffmpeg',['-v','error','-f','image2pipe','-framerate','20','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['pipe','ignore','pipe']});m.encoderPid=encoder.pid;let encoderErrors='';encoder.stderr.on('data',b=>encoderErrors+=b);encoder.stdin.on('error',()=>{});const encoded=once(encoder,'exit');
  for(let i=0;i<options.frames;i++){
   if(i===0||i===Math.floor(options.frames/2)){await page.mouse.up();m.targets.push(await stage(i===0?'crawler':'brute',i===0?'shotgun':'rocket'));}
   // One no-fire shipping frame materializes the new live actor before aiming.
   const aim=await page.evaluate(()=>{const d=window.__ragDemo,e=d.game.enemies.getSnapshot(d.targetId),r=d.renderer,model=r.actors.get(d.targetId);if(!e||!model)return null;const p=r.camera.position.clone().set(e.x/32,model.height*.5,e.y/32).project(r.camera),rect=r.canvas.getBoundingClientRect();return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};});
   if(aim){await page.mouse.move(aim.x,aim.y);await page.mouse.down();}else await page.mouse.up();
   const f=await page.evaluate(i=>{const d=window.__ragDemo,r=d.renderer,g=d.game;d.index=i;const hitStart=d.hits.length;const input=d.input.read();d.now+=50;const start=performance.now();d.frame(d.now);const frameMs=performance.now()-start;r.scene.updateMatrixWorld(true);const ragdolls=d.targets.map(t=>{const corpse=r.corpses.find(c=>c.id===t.id);const bones=[];corpse?.model.root.traverse(o=>{if(o.isBone)bones.push({name:o.name,position:o.position.toArray(),rotation:o.quaternion.toArray()});});return {id:t.id,parts:r.ragdolls.inspect(t.id)??[],jointError:r.ragdolls.maxJointError?.(t.id)??0,bones};});const gl=r.renderer.getContext();gl.finish();return {frame:i,elapsed:g.elapsed,status:g.status,input,bullets:g.bullets.length,enemies:g.enemies.snapshot.enemies,stats:r.ragdolls.snapshot(),ragdolls,hits:d.hits.slice(hitStart),zoom:r.camera.zoom,camera:{position:r.camera.position.toArray(),quaternion:r.camera.quaternion.toArray()},loading:!document.querySelector('#room-loading').hidden,busy:r.canvas.getAttribute('aria-busy'),drawCalls:r.renderer.info.render.calls,glError:gl.getError(),frameSubmissionMs:frameMs};},i);
   const png=await page.screenshot({timeout:120000});assert.equal(png.readUInt32BE(16),options.viewport.width);assert.equal(png.readUInt32BE(20),options.viewport.height);f.pngSha256=hash(png);m.frames.push(f);await appendFile(join(out,'frames.jsonl'),JSON.stringify(f)+'\n');
   if(!encoder.stdin.write(png))await bounded(Promise.race([once(encoder.stdin,'drain'),encoded.then(()=>{throw Error('Encoder exited');})]),30000,'encoder drain');
   if(i%20===0){await save();console.log(JSON.stringify({frame:i,total:options.frames,stats:f.stats}));}
  }
  await page.mouse.up();encoder.stdin.end();assert.equal((await bounded(encoded,60000,'encoder finish'))[0],0,encoderErrors);assert.equal(encoderErrors,'');
  m.events=await page.evaluate(()=>window.__ragDemo.events);m.behavior=verifyBehavior(m);
  // Separate screenshot-free physics stepping after real on-camera deaths. This
  // measures only the ragdoll CPU owner, not rendering, gameplay throughput or FPS.
  m.measurement=await page.evaluate(count=>{const r=window.__ragDemo.renderer.ragdolls,rows=[];for(let i=0;i<count;i++){const start=performance.now();r.update(1/60);rows.push({step:i,wallMs:performance.now()-start,...r.snapshot()});}return {label:'Screenshot-free CPU physics aftermath of real kills; not a crowd stress or phone FPS benchmark',rows};},options.measureFrames);
  for(const row of m.measurement.rows)verifyStats(row);
  const measured=m.measurement.rows.filter(r=>r.active>0).map(r=>r.stepMs).sort((a,b)=>a-b);m.measurement.activeSamples=measured.length;m.measurement.stepMs=measured.length?{mean:measured.reduce((a,b)=>a+b,0)/measured.length,p95:measured[Math.ceil(measured.length*.95)-1],max:measured.at(-1)}:null;
  m.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',mp4],{encoding:'utf8',timeout:120000}));verifyProbe(m.probe,options);
  execFileSync('ffmpeg',['-v','error','-xerror','-i',mp4,'-f','null','-'],{timeout:120000});
  const eventFrames=m.events.filter(e=>e.type==='corpse').map(e=>e.frame);for(const i of [...new Set([0,options.frames-1,...eventFrames,...eventFrames.map(i=>Math.min(i+6,options.frames-1))])].sort((a,b)=>a-b)){const file=`decoded-${String(i).padStart(3,'0')}.png`;execFileSync('ffmpeg',['-v','error','-i',mp4,'-vf',`select=eq(n\\,${i})`,'-frames:v','1',join(out,file)],{timeout:120000});m.samples.push({frame:i,file,sha256:hash(await readFile(join(out,file)))});}
  m.mp4={path:mp4,sha256:hash(await readFile(mp4))};m.sourceAfter=await source();assert.equal(m.sourceBefore.sha,m.sourceAfter.sha,'HEAD changed');assert.equal(m.sourceBefore.treeSha256,m.sourceAfter.treeSha256,'Source/assets/tooling changed');if(!options.provisional)assert.equal(m.sourceAfter.status,'','Worktree became dirty');assert.deepEqual(m.errors,[]);m.state='verified';m.finalEvidence=!options.provisional;await save();console.log(JSON.stringify({state:m.state,manifest,mp4,frames:m.frames.length,provisional:options.provisional,pixelReview:m.pixelReview}));
 }catch(e){m.state='failed';m.failure=e.stack??String(e);await save();throw e;}finally{clearTimeout(watchdog);process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);await cleanup();}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const o=demoOptions(process.argv.slice(2));if(o.selfTest)selfTest();else if(o.help)console.log('node scripts/ragdoll-demo.mjs --provisional --viewport=desktop|portrait --out=/new/absolute/path\nFinal: --source-sha=<full HEAD> [--viewport=desktop|portrait] [--quality=high|low] [--measure-frames=180]\nFinal 6s/20fps/120 frames; provisional 2s/20fps/40 frames. --self-test runs CPU validator checks only.');else await record(o);}
