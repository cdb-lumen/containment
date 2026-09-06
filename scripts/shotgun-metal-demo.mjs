import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {createServer as reserveServer} from 'node:net';
import {createServer} from 'vite';
import {chromium} from 'playwright';

// Response-only recorder seam. The shipped game has no capture API.
const root=resolve(process.env.DEMO_ROOT||process.cwd()),out=resolve(process.env.DEMO_OUT||'/home/chernodubv/artifacts/shotgun-metal'),label=process.env.DEMO_LABEL||'after';
const sha=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const assertSource=()=>{assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha);execFileSync('git',['-C',root,'diff','--exit-code','HEAD','--','src']);};
assertSource();
await mkdir(out,{recursive:true});
const reservation=reserveServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const server=await createServer({root,configFile:join(root,'vite.config.ts'),base:'/',server:{host:'127.0.0.1',port,strictPort:true,hmr:false}});
let browser,encoder;const errors=[],samples=[];
try{
 await server.listen();browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__metalGate)cb(t);});});
 await page.route('**/src/main.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__metalDemo={game,renderer,hud,syncScreen};\n'});});
 await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>window.__metalDemo&&document.body.dataset.state==='menu');
 await page.evaluate(()=>{window.__metalGate=true;document.querySelector('#start').click();});
 const setup=await page.evaluate(async ({quality,north})=>{
  const d=window.__metalDemo,g=d.game,r=d.renderer;
  const {expeditionRewardOffers}=await import('/src/game/roguelike/expedition.ts');const {canOccupyExpedition}=await import('/src/game/world/expeditionGeometry.ts');
  g.newRun(1729);g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.skipStory();
  // Remove encounter scheduling only. Fire, projectile motion and collisions stay authoritative.
  g.pending=[];g.director.update=()=>[];g.switchWeapon('shotgun');Object.assign(g.player,north?{x:760,y:180,angle:-Math.PI/2}:{x:1040,y:440,angle:0});
  if(!canOccupyExpedition(g.geometry,g.player,g.player.radius))throw Error('Invalid demo position');
  let seed=1729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  r.setQuality(quality);r.loadRoom(g.node);r.render(g,1,false);d.hud();d.syncScreen(true);d.events=[];d.frame=0;
  const original=r.effect.bind(r);r.effect=e=>{const p=r.camera.position.clone().set(e.x/32,.8,e.y/32).project(r.camera);d.events.push({...e,frame:d.frame,pixel:{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}});original(e);};
  const caption=document.createElement('div');caption.id='metal-caption';caption.style.cssText='position:fixed;left:12px;bottom:78px;z-index:999;padding:7px 10px;background:#061116df;color:#eff5ef;font:13px sans-serif;pointer-events:none';document.body.append(caption);
  return {player:{...g.player},room:g.node.templateId,quality:r.qualityTier,controlled:true,nativeZoom:r.camera.zoom};
 },{quality:process.env.DEMO_QUALITY||'low',north:!!process.env.DEMO_NORTH});
 await page.screenshot({path:join(out,`${label}-setup.png`)});console.log('SETUP',JSON.stringify(setup));
 const fps=30,total=process.env.DEMO_PROBE?30:180,mp4=join(out,`${label}.mp4`);
 encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['pipe','inherit','inherit']});encoder.stdin.on('error',()=>{});const finished=once(encoder,'exit');
 for(let frame=0;frame<total;frame++){
  const state=await page.evaluate(({frame,fps,label,north})=>{
   const d=window.__metalDemo,g=d.game,r=d.renderer;d.frame=frame;
   const oblique=frame>=90,angle=(north?-Math.PI/2:0)+(oblique?.45:0),fire=[15,55,105,145].includes(frame);
   document.querySelector('#metal-caption').textContent=`${label.toUpperCase()}  /  SHOTGUN  /  ${oblique?'OBLIQUE':'FRONT'} WALL  /  CONTROLLED GAMEPLAY`;
   g.update(1000/fps,{x:0,y:0,fire,angle,autoAim:false});r.render(g,1/fps,false);d.hud();
   if(g.status!=='playing')throw Error(`Left gameplay: ${g.status}`);
   return {frame,bullets:g.bullets.length,counts:r.effects.counts,elapsed:g.elapsed};
  },{frame,fps,label,north:!!process.env.DEMO_NORTH});samples.push(state);
  const png=await page.screenshot();if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
  if([17,18,19,20,22,25,107,108,109,110,112,115].includes(frame))await writeFile(join(out,`${label}-${frame}.png`),png);
  if(frame%30===0){console.log('FRAME',label,frame);await writeFile(join(out,`${label}-progress.json`),JSON.stringify({sha,frame,total,pid:process.pid}));}
 }
 encoder.stdin.end();assert.equal((await finished)[0],0);
 assertSource();
 const events=await page.evaluate(()=>window.__metalDemo.events);assert.deepEqual(errors,[]);assert(samples.every(s=>s.counts&&Number.isFinite(s.counts.glow)));
 const hits=events.filter(e=>e.type==='hit'&&e.weapon==='shotgun');
 if(!process.env.DEMO_PROBE){assert.equal(hits.length,32);assert(hits.some(e=>e.frame<90)&&hits.some(e=>e.frame>=90));if(label==='after')assert(hits.every(e=>e.wall&&e.shotId));}
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,pix_fmt,width,height,nb_frames:format=duration','-of','json',mp4],{encoding:'utf8'}));assert.equal(probe.streams[0].codec_name,'h264');assert.equal(Number(probe.streams[0].nb_frames),total);assert.equal(probe.streams[0].pix_fmt,'yuv420p');
 execFileSync('ffmpeg',['-v','error','-i',mp4,'-f','null','-']);
 await writeFile(join(out,`${label}.json`),JSON.stringify({root,sha,setup,fps,total,events,samples,errors,probe},null,2));console.log('PASS',JSON.stringify({mp4,hits:hits.length,total,errors}));
}finally{if(encoder&&encoder.exitCode===null)encoder.kill('SIGTERM');await browser?.close();await server.close();}
