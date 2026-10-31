import assert from 'node:assert/strict';
import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
import {chromium} from '/workspace/containment-ci/node_modules/playwright/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const [root,room,viewportName='desktop',outArg]=process.argv.slice(2),out=resolve(outArg||`/workspace/campaign-${room}-${viewportName}`),mobile=viewportName==='phone';
assert(root&&room);const viewport=mobile?{width:390,height:844}:{width:1280,height:900};
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim(),hash=b=>createHash('sha256').update(b).digest('hex');
const source=async()=>{const files=[];for(const p of git('ls-files','src','public','scripts','package.json','package-lock.json','vite.config.ts').split('\n'))files.push({path:p,sha256:hash(await readFile(join(root,p)))});return {commit:git('rev-parse','HEAD'),status:git('status','--porcelain','--','src','public','scripts','tests','package.json','package-lock.json','vite.config.ts'),hash:hash(JSON.stringify(files)),files};};
let server,browser;const m={room,viewport,viewportName,started:new Date().toISOString(),state:'starting',errors:[],frames:[],disclosure:'Seeded validated prior-room checkpoint with default resources and no boons. Ordinary encounter director, enemy health/counts, damage, native input/controller, main frame, HUD, camera and rendering retained. Automated play policy uses read-only game observations and real keyboard or two-finger CDP touch events. RAF is held and real main.frame advances in 50ms steps. This is a fixed-step full-encounter playtest, not wall-time/device FPS or historical replay proof. Production source served through Vite with an observation hook; no shipping source edits. External font CSS replaced with empty CSS.'};
await mkdir(join(out,'frames'),{recursive:true});const save=()=>writeFile(join(out,'manifest.json'),JSON.stringify(m,null,2));
try{
 m.sourceBefore=await source();assert.equal(m.sourceBefore.status,'');m.harnessSha256=hash(await readFile(new URL(import.meta.url)));await save();
 server=await createServer({root,configFile:join(root,'vite.config.ts'),base:'/',cacheDir:join(out,'.vite-cache'),optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0,hmr:false,preTransformRequests:false},logLevel:'error'});await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts'),{serializeCheckpoint,CHECKPOINT_STORAGE_KEY}=await server.ssrLoadModule('/src/game/roguelike/checkpoints.ts'),{CombatSystem}=await server.ssrLoadModule('/src/game/combat/CombatSystem.ts');
 const nodes=generateRun(1729,3).nodes,idx=nodes.findIndex(n=>n.templateId===room),previous=nodes[idx-1];assert(idx>0);
 const checkpoint=serializeCheckpoint({version:1,savedAt:0,run:{version:3,seed:1729,currentNodeId:previous.id,completedNodeIds:nodes.slice(0,idx).map(n=>n.id),phase:'route'},build:{mutations:[]},resources:new CombatSystem().getRunResources()});assert(checkpoint);m.checkpoint=JSON.parse(checkpoint);
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});const page=await context.newPage();page.setDefaultTimeout(120000);
 page.on('pageerror',e=>m.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')m.errors.push(e.text());});page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)m.errors.push(`${r.status()} ${r.url()}`);});
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(t=>{if(!window.__campaignHold)cb(t);});},{key:CHECKPOINT_STORAGE_KEY,value:checkpoint});
 await page.route('**/src/main.ts*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+'\nwindow.__campaign={game,renderer,input,frame,pacer,hud,syncScreen};\n'});});
 await page.goto(origin);await page.waitForFunction(()=>window.__campaign&&document.body.dataset.state==='menu');await page.evaluate(()=>{window.__campaignHold=true;});await page.locator('#continue').click();await page.locator(`[data-route="${nodes[idx].id}"]`).click();
 await page.evaluate(async()=>{const d=window.__campaign;const {FacilityNavigation}=await import('/src/game/world/FacilityNavigation.ts');d.geometry=await import('/src/game/world/expeditionGeometry.ts');d.nav=new FacilityNavigation(d.game.geometry);d.now=1000;d.pacer.reset();d.frame(d.now);});
 await page.waitForFunction(()=>!window.__campaign.renderer.roomLoading);await page.evaluate(()=>{const d=window.__campaign;d.now+=50;d.frame(d.now);d.hud();d.syncScreen(true);d.pacer.sample(d.now);});
 await page.locator('[data-weapon="rifle"]').click();
 const touch=mobile?await context.newCDPSession(page):null;let held=new Set(),touchStarted=false;
 const fireBox=mobile?await page.locator('#fire').boundingBox():null,fire=fireBox?{x:fireBox.x+fireBox.width/2,y:fireBox.y+fireBox.height/2,id:2}:null;
 let done=false;
 for(let i=0;i<3600;i++){
  if(i%4===0){
   const action=await page.evaluate(()=>{const d=window.__campaign,g=d.game,p=g.player,es=g.enemies.snapshot.enemies,s=g.combat.snapshot;let x=0,y=0;const target=[...es].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(target){const candidates=[];for(let k=0;k<16;k++){const a=k*Math.PI/8,q={x:target.x+Math.cos(a)*270,y:target.y+Math.sin(a)*270};if(!d.geometry.canOccupyExpedition(g.geometry,q,20))continue;const wp=d.nav.waypoint(p,q,1)??q;if(Math.hypot(wp.x-p.x,wp.y-p.y)<2)continue;let danger=0;for(const e of es)danger+=Math.exp(-Math.hypot(q.x-e.x,q.y-e.y)/130);const score=danger*300+Math.hypot(q.x-p.x,q.y-p.y)+(d.geometry.hasClearExpeditionShot(g.geometry,q,target)?0:500);candidates.push({wp,score});}candidates.sort((a,b)=>a.score-b.score);const q=candidates[0]?.wp??d.nav.waypoint(p,target,1)??target;x=Math.abs(q.x-p.x)>12?Math.sign(q.x-p.x):0;y=Math.abs(q.y-p.y)>12?Math.sign(q.y-p.y):0;}return{x,y,heal:s.health<60&&s.medkits>0,reload:s.magazine===0,pistol:s.reserve===0&&s.magazine===0,status:g.status};});
   if(action.status!=='playing'){done=true;break;}
   if(mobile){
    if(!touchStarted){await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y:680,id:1},fire]});touchStarted=true;}
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90+action.x*48,y:680+action.y*48,id:1},fire]});
    if(action.heal||action.reload||action.pistol){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touchStarted=false;if(action.heal)await page.locator('#heal').tap();if(action.reload)await page.locator('#reload').tap();if(action.pistol)await page.locator('[data-weapon="pistol"]').tap();}
   }else{const next=new Set(['Space',...(action.x>0?['d']:action.x<0?['a']:[]),...(action.y>0?['s']:action.y<0?['w']:[])]);for(const k of held)if(!next.has(k))await page.keyboard.up(k);for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;if(action.heal)await page.keyboard.press('e');if(action.reload)await page.keyboard.press('r');if(action.pistol)await page.keyboard.press('1');}
  }
  const f=await page.evaluate(i=>{const d=window.__campaign,g=d.game,before={...g.player};d.now+=50;d.frame(d.now);d.hud();d.syncScreen();const legal=d.geometry.canTraverseExpedition(g.geometry,before,g.player,g.player.radius);const gl=d.renderer.renderer.getContext();gl.finish();return {i,status:g.status,elapsed:g.elapsed,player:{...g.player},health:g.combat.snapshot.health,armor:g.combat.snapshot.armor,kills:g.kills,remaining:g.encounterRemaining,enemies:g.enemies.snapshot.enemies,legal,zoom:d.renderer.camera.zoom,glError:gl.getError(),loading:d.renderer.roomLoading};},i);
  assert(f.legal);assert.equal(f.zoom,1);assert.equal(f.glError,0);assert.deepEqual(m.errors,[]);m.frames.push(f);
  await page.screenshot({path:join(out,'frames',String(i).padStart(5,'0')+'.png')});
  if(i%50===0){console.log(JSON.stringify({frame:i,elapsed:f.elapsed,status:f.status,kills:f.kills,remaining:f.remaining}));await save();}
  if(f.status!=='playing'){done=true;break;}
 }
 if(mobile&&touchStarted)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else for(const k of held)await page.keyboard.up(k);
 m.encounter=await page.evaluate(()=>{const g=window.__campaign.game;return {status:g.status,room:g.node.templateId,kills:g.kills,remaining:g.encounterRemaining,elapsed:g.elapsed};});assert(done);assert.equal(m.encounter.status,'reward');assert.equal(m.encounter.remaining,0);
 await page.screenshot({path:join(out,'reward.png')});const reward=page.locator('[data-mutation]').first();if(await reward.count()){if(mobile)await reward.tap();else await reward.click();}else{if(mobile)await page.locator('#claim').tap();else await page.locator('#claim').click();}
 assert.equal(await page.evaluate(()=>document.body.dataset.state),'route');await page.screenshot({path:join(out,'route.png')});const route=page.locator('[data-route]').first();if(mobile)await route.tap();else await route.click();
 await page.evaluate(()=>{const d=window.__campaign;d.now+=50;d.frame(d.now);});await page.waitForFunction(()=>!window.__campaign.renderer.roomLoading);await page.evaluate(()=>{const d=window.__campaign;d.now+=50;d.frame(d.now);d.hud();d.syncScreen();});
 m.onward=await page.evaluate(()=>({status:window.__campaign.game.status,room:window.__campaign.game.node.templateId}));assert.equal(m.onward.status,'playing');assert.notEqual(m.onward.room,room);await page.screenshot({path:join(out,'onward.png')});assert.deepEqual(m.errors,[]);
 await context.close();await browser.close();browser=null;
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','20','-i',join(out,'frames','%05d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',join(out,'combat.mp4')]);execFileSync('ffmpeg',['-v','error','-i',join(out,'combat.mp4'),'-f','null','-']);
 m.video={sha256:hash(await readFile(join(out,'combat.mp4'))),probe:JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',join(out,'combat.mp4')],{encoding:'utf8'}))};assert.equal(Number(m.video.probe.streams[0].nb_read_frames),m.frames.length);
 m.sourceAfter=await source();assert.equal(m.sourceAfter.hash,m.sourceBefore.hash);assert.equal(m.sourceAfter.commit,m.sourceBefore.commit);assert.equal(m.sourceAfter.status,'');m.state='passed';console.log(JSON.stringify({state:m.state,encounter:m.encounter,onward:m.onward}));
}catch(e){m.state='failed';m.error=String(e);throw e;}finally{await save();await browser?.close();await server?.close();}
