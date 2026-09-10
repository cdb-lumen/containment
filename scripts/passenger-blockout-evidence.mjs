import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import {chromium} from 'playwright';
const out=resolve(process.argv[2]??'artifacts/passenger-blockout');
await mkdir(out,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['diff','HEAD','--','src','scripts/passenger-blockout-evidence.mjs'],{encoding:'utf8'}),'','Commit source and capture script first');
assert.equal(execFileSync('git',['ls-files','--error-unmatch','scripts/passenger-blockout-evidence.mjs'],{encoding:'utf8'}).trim(),'scripts/passenger-blockout-evidence.mjs');
assert.deepEqual(execFileSync('git',['show','HEAD:scripts/passenger-blockout-evidence.mjs']),await readFile('scripts/passenger-blockout-evidence.mjs'),'Capture script must match committed source');
// Local evidence build only. Keep production HUD, renderer, high composer,
// camera offset, zoom and roomFocus. Disable autonomous RAF so capture owns GPU.
// Stage room 2 via canonical progression, clear the staged encounter, then move
// with DepthGame.update. This is layout evidence, not a campaign playthrough.
const probe=`
import * as EvidenceThree from 'three';
import {canOccupyExpedition as evidenceLegal} from './game/world/expeditionGeometry';
const sampledErrors=[];let checks=0,travel=0;
const draw=()=>{renderer.render(game,.05,false);hud();syncScreen();const gl=renderer.renderer.getContext();gl.finish();let e;while((e=gl.getError())!==gl.NO_ERROR){sampledErrors.push(e);if(e===gl.CONTEXT_LOST_WEBGL)break;}};
window.__blockout={
 async stage(){
  game.newRun(1729);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game.clearRoom();game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);game.route(game.node.next[0]);
  if(game.node.templateId!=='passenger-vault')throw Error('Wrong route');
  game.pending=[];game.enemies.reset();game.director=game.makeDirector();
  await renderer.prepare(game.node);renderer.resize();lastRoom=game.roomRevision;roomRecovering=false;
  el('room-loading').hidden=true;el('world').setAttribute('aria-busy','false');draw();
  return this.snapshot();
 },
 move(route){
  for(const target of route){let steps=0;while(Math.hypot(target.x-game.player.x,target.y-game.player.y)>1&&steps++<400){
   const before={...game.player},dx=target.x-before.x,dy=target.y-before.y,d=Math.hypot(dx,dy);
   game.update(Math.min(50,d/220*1000),{x:dx/d,y:dy/d,fire:false,angle:null,autoAim:false});
   travel+=Math.hypot(game.player.x-before.x,game.player.y-before.y);checks++;
   if(!evidenceLegal(game.geometry,game.player,16))throw Error('Traversal clipped');
  }if(steps>=400)throw Error('Traversal stalled');}
  return this.snapshot();
 },
 draw(){draw();return this.snapshot();},
 overview(){
  draw();const t=ROOM_TEMPLATES[game.node.templateId],w=t.width/32,h=t.height/32,camera=renderer.camera,T=EvidenceThree,center=new T.Vector3(w/2,0,h/2);
  camera.position.copy(center).add(new T.Vector3(0,26,19));camera.lookAt(center);camera.updateMatrixWorld(true);
  const b=new T.Box3();for(const x of [-1,w+1])for(const y of [-1,5])for(const z of [-1,h+1])b.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const aspect=innerWidth/innerHeight,half=Math.max((b.max.y-b.min.y)/2,(b.max.x-b.min.x)/2/aspect)*1.08,cx=(b.min.x+b.max.x)/2,cy=(b.min.y+b.max.y)/2;
  camera.left=cx-half*aspect;camera.right=cx+half*aspect;camera.bottom=cy-half;camera.top=cy+half;camera.updateProjectionMatrix();
  renderer.composer.render();renderer.renderer.getContext().finish();return this.snapshot();
 },
 snapshot(){const T=EvidenceThree,actorVisibility=[.2,1,2.05].map(height=>{const world=new T.Vector3(game.player.x/32,height,game.player.y/32),p=world.clone().project(renderer.camera),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x,p.y),renderer.camera);const hit=ray.intersectObject(renderer.world,true)[0];return {height,pixel:[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2],occluded:!!hit&&hit.distance<ray.ray.origin.distanceTo(world)-.01};});return {equipmentBudget:renderer.world.getObjectByName('passenger-vault-equipment')?.userData,equipmentState:renderer.passengerVault?.state,equipmentError:String(renderer.passengerVault?.error??''),equipmentInstances:renderer.world.getObjectByName('passenger-vault-equipment')?.userData.instances,actorVisibility,state:game.status,room:game.node.templateId,player:{x:game.player.x,y:game.player.y},checks,travel,passengers:renderer.world.getObjectByName('authored-passenger-vault')?.userData.sealedPassengers,
 camera:{zoom:renderer.camera.zoom,position:renderer.camera.position.toArray(),focus:renderer.focus.toArray(),left:renderer.camera.left,right:renderer.camera.right,top:renderer.camera.top,bottom:renderer.camera.bottom},quality:renderer.qualityTier,drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,errors:[...sampledErrors],contextLost:renderer.renderer.getContext().isContextLost()};}
};`;
const outDir=resolve(out,'build');
await build({build:{outDir,emptyOutDir:true},plugins:[{name:'passenger-layout-evidence-only',enforce:'pre',transform(code,id){if(id.endsWith('/src/main.ts'))return code.replaceAll('requestAnimationFrame(frame);','')+probe;}}]});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:0}});
const views=[['opening',[]],['F1',[{x:180,y:440}]],['north-loop',[{x:260,y:440},{x:260,y:180},{x:600,y:180}]],['central-transfer',[{x:600,y:440}]],['south-loop',[{x:600,y:700}]],['exit',[{x:960,y:700},{x:960,y:440},{x:1100,y:440}]]];
const results=[];let browser;
const manifest={sha,evidenceClass:'Production-built app with local-only deterministic room-2 staging and inactive encounter director. Real DepthGame.update traversal; production HUD, high composer and shipping gameplay camera. Camera follow settles through 24 production 50ms render calls at each inspection point. Full-room images explicitly use fitted overview projection, not gameplay framing. No equipment or release acceptance.',results};
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const [name,viewport,mobile] of [['desktop',{width:1280,height:900},false],['portrait',{width:390,height:844},true]]){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(180000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  try{
   await page.goto(server.resolvedUrls.local[0]);await page.waitForFunction(()=>!!window.__blockout);console.log(name,'stage');await page.evaluate(()=>window.__blockout.stage());
   for(const [view,route] of [...views,['full-room',[]]]){
    await page.evaluate(r=>window.__blockout.move(r),route);
    if(view!=='full-room')for(let i=0;i<24;i++)await page.evaluate(()=>window.__blockout.draw());
    const snapshot=await page.evaluate(mode=>mode==='full-room'?window.__blockout.overview():window.__blockout.snapshot(),view);
    assert.equal(snapshot.equipmentState,'ready',snapshot.equipmentError);assert.equal(snapshot.equipmentInstances,25);for(const [key,limit] of Object.entries({draws:48,triangles:100000,materials:8,decodedTextureBytes:32*1024*1024})){assert.ok(snapshot.equipmentBudget[key]>0&&snapshot.equipmentBudget[key]<=limit,`${key} budget`);}assert.equal(snapshot.room,'passenger-vault');assert.equal(snapshot.state,'playing');assert.equal(snapshot.camera.zoom,1);assert.equal(snapshot.quality,'high');assert.equal(snapshot.passengers,16);assert.ok(snapshot.drawCalls>0);assert.equal(snapshot.contextLost,false);assert.deepEqual(snapshot.errors,[]);assert.deepEqual(errors,[]);
    if(view!=='full-room'){assert.ok(Math.abs(snapshot.camera.position[1]-snapshot.camera.focus[1]-26)<1e-6);assert.ok(Math.abs(snapshot.camera.position[2]-snapshot.camera.focus[2]-19)<1e-6);}
    const file=`${name}-${view}.png`,bytes=await page.screenshot({path:resolve(out,file)});assert.equal(bytes.readUInt32BE(16),viewport.width);assert.equal(bytes.readUInt32BE(20),viewport.height);
    results.push({name,view,file,viewport,snapshot,errors:[...errors],sha256:createHash('sha256').update(bytes).digest('hex'),pixelReview:'pending'});await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(name,view,JSON.stringify(snapshot));
   }
  }catch(error){await page.screenshot({path:resolve(out,`${name}-FAILED.png`)}).catch(()=>{});await writeFile(resolve(out,'failure.json'),JSON.stringify({sha,name,error:String(error),errors},null,2));throw error;}finally{await context.close();}
 }
 assert.equal(results.length,14);assert.equal(new Set(results.map(r=>r.file)).size,14);
 for(const r of results)assert.equal(createHash('sha256').update(await readFile(resolve(out,r.file))).digest('hex'),r.sha256);
 console.log('Verified 14 unique captures and hashes');
}finally{await browser?.close();await new Promise((res,rej)=>server.httpServer.close(e=>e?rej(e):res()));}
