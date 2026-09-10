import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import {chromium} from 'playwright';
const script='scripts/residential-blockout-evidence.mjs';
const out=resolve(process.argv[2]??'artifacts/residential-blockout');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(execFileSync('git',['diff','HEAD','--','src',script],{encoding:'utf8'}),'','Commit source and capture script first');
assert.equal(execFileSync('git',['ls-files','--error-unmatch',script],{encoding:'utf8'}).trim(),script);
assert.deepEqual(execFileSync('git',['show',`HEAD:${script}`]),await readFile(script),'Capture script must match committed source');
assert.equal(execFileSync('git',['ls-files','--others','--exclude-standard','--','src'],{encoding:'utf8'}),'','Commit untracked runtime source first');
await mkdir(dirname(out),{recursive:true});
await mkdir(out); // Exclusive destination: preserve existing successful AND failed evidence.
// Local evidence build only. Preserve shipping HUD, high composer, camera offset,
// zoom and roomFocus. Disable autonomous RAF so this fixture owns rendering.
// Canonical progression stages room 3; an unstarted replacement director removes
// combat pressure. Movement still uses actual DepthGame.update, never teleportation.
const probe=`
import * as EvidenceThree from 'three';
import {canOccupyExpedition as evidenceLegal,canTraverseExpedition as evidenceTraverse} from './game/world/expeditionGeometry';
const sampledErrors=[];let checks=0,travel=0;const progression=[],movements=[];
const sampleGL=()=>{const gl=renderer.renderer.getContext();gl.finish();let e;while((e=gl.getError())!==gl.NO_ERROR){sampledErrors.push(e);if(e===gl.CONTEXT_LOST_WEBGL)break;}};
const draw=()=>{renderer.render(game,.05,false);hud();syncScreen();sampleGL();};
const meshBudget=root=>{let meshes=0,triangles=0;const materials=new Set();root.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3*(o.isInstancedMesh?o.count:1);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m.uuid);});return {meshes,triangles,materials:materials.size};};
window.__blockout={
 async stage(){
  window.__residentialBlockoutParts=[];
  game.newRun(1729);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  progression.push(game.node.templateId);
  for(let step=0;step<2;step++){
   game.clearRoom();const offers=expeditionRewardOffers(game.expedition);
   if(offers.length)game.chooseMutation(offers[0].id);else game.claimResources();
   if(game.status!=='route'||!game.node.next[0])throw Error('Canonical route unavailable');
   game.route(game.node.next[0]);progression.push(game.node.templateId);
  }
  if(game.node.templateId!=='residential-gallery')throw Error('Wrong route');
  const solids=ROOM_TEMPLATES[game.node.templateId].obstacles.map(r=>[r.x,r.y,r.width,r.height]);
  if(JSON.stringify(solids)!==JSON.stringify([[280,160,240,100],[280,520,120,200],[650,270,260,100],[780,570,140,150]]))throw Error('Four-solid contract changed: review routes');
  game.pending=[];game.enemies.reset();game.director=game.makeDirector();
  if(!evidenceLegal(game.geometry,game.player,game.player.radius))throw Error('Illegal entry');
  await renderer.prepare(game.node);renderer.resize();lastRoom=game.roomRevision;roomRecovering=false;
  el('room-loading').hidden=true;el('world').setAttribute('aria-busy','false');draw();
  return this.snapshot();
 },
 move(route){
  for(const target of route){
   const start={x:game.player.x,y:game.player.y};
   if(!evidenceTraverse(game.geometry,start,target,game.player.radius))throw Error('Illegal route segment '+JSON.stringify({start,target}));
   let steps=0;
   while(Math.hypot(target.x-game.player.x,target.y-game.player.y)>1&&steps++<400){
    const before={x:game.player.x,y:game.player.y},dx=target.x-before.x,dy=target.y-before.y,d=Math.hypot(dx,dy);
    game.update(Math.min(50,d/220*1000),{x:dx/d,y:dy/d,fire:false,angle:null,autoAim:false});
    const moved=Math.hypot(game.player.x-before.x,game.player.y-before.y);travel+=moved;checks++;
    if(game.status!=='playing'||!evidenceTraverse(game.geometry,before,game.player,game.player.radius))throw Error('Traversal clipped or left playing');
    if(moved<.0001)throw Error('Traversal stalled');
   }
   if(steps>=400)throw Error('Traversal step limit');
   movements.push({start,target,end:{x:game.player.x,y:game.player.y},steps});
  }
  return this.snapshot();
 },
 draw(){draw();return this.snapshot();},
 overview(){
  draw();const t=ROOM_TEMPLATES[game.node.templateId],w=t.width/32,h=t.height/32,camera=renderer.camera,T=EvidenceThree,center=new T.Vector3(w/2,0,h/2);
  camera.position.copy(center).add(new T.Vector3(0,26,19));camera.lookAt(center);camera.updateMatrixWorld(true);
  const b=new T.Box3();for(const x of [-1,w+1])for(const y of [-1,5])for(const z of [-1,h+1])b.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const aspect=innerWidth/innerHeight,half=Math.max((b.max.y-b.min.y)/2,(b.max.x-b.min.x)/2/aspect)*1.08,cx=(b.min.x+b.max.x)/2,cy=(b.min.y+b.max.y)/2;
  camera.left=cx-half*aspect;camera.right=cx+half*aspect;camera.bottom=cy-half;camera.top=cy+half;camera.updateProjectionMatrix();
  renderer.composer.render();sampleGL();return this.snapshot();
 },
 snapshot(){
  const T=EvidenceThree;
  const hudBoxes=[...document.querySelectorAll('#hud .hud-top,#story-hud,#boss-hud,#build-strip,#run-stock,.weapon-hud,#weapon-picker,#touch-controls,#signature,#room-loading,#overlay')].map(o=>{
   const r=o.getBoundingClientRect(),s=getComputedStyle(o);return {selector:o.id?'#'+o.id:'.'+o.className,text:o.textContent,visible:o.checkVisibility()&&s.opacity!=='0'&&r.width>0&&r.height>0,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
  });
  renderer.world.updateMatrixWorld(true);
  const actorVisibility=[.2,1,2.05].map(height=>{
   const world=new T.Vector3(game.player.x/32,height,game.player.y/32),p=world.clone().project(renderer.camera),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(p.x,p.y),renderer.camera);
   const hit=ray.intersectObject(renderer.world,true)[0],pixel=[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2],occluded=!!hit&&hit.distance<ray.ray.origin.distanceTo(world)-.01;
   return {height,pixel,onScreen:Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&Math.abs(p.z)<=1,occluded,occluder:occluded?{name:hit.object.name,type:hit.object.type,bakedEnvironment:!!hit.object.userData.bakedEnvironment,distance:hit.distance}:null,hudOverlaps:hudBoxes.filter(b=>b.visible&&pixel[0]>=b.rect.x&&pixel[0]<=b.rect.x+b.rect.width&&pixel[1]>=b.rect.y&&pixel[1]<=b.rect.y+b.rect.height).map(b=>b.selector)};
  });
  return {blockoutParts:window.__residentialBlockoutParts,worldBudget:meshBudget(renderer.world),actorVisibility,hud:{visible:el('hud').checkVisibility(),objective:el('room-objective').textContent,boxes:hudBoxes},state:game.status,room:game.node.templateId,player:{x:game.player.x,y:game.player.y,radius:game.player.radius},solids:ROOM_TEMPLATES[game.node.templateId].obstacles,progression:[...progression],movements:[...movements],checks,travel,
   camera:{zoom:renderer.camera.zoom,position:renderer.camera.position.toArray(),focus:renderer.focus.toArray(),left:renderer.camera.left,right:renderer.camera.right,top:renderer.camera.top,bottom:renderer.camera.bottom},quality:renderer.qualityTier,drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,errors:[...sampledErrors],contextLost:renderer.renderer.getContext().isContextLost()};
 }
};`;
// appendEnvironment flattens groups; bakeWorld then merges their meshes by material.
// Observe actual returned blockout meshes BEFORE flattening. Do not rely on group
// names surviving, do not disable batching, and report post-batch whole-world totals
// separately. This instrumentation allocates no extra geometry or materials.
const partObserver=`{
 const root=residentialGalleryBlockout(footprint,index);let meshes=0,triangles=0;const materials=new Set();
 root.traverse(o=>{if(o instanceof T.Mesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m.uuid);}});
 (window.__residentialBlockoutParts??=[]).push({index,name:root.name,footprint:{...footprint},meshes,triangles,materials:materials.size});return root;
}`;
const outDir=resolve(out,'build');
await build({build:{outDir,emptyOutDir:true},plugins:[{name:'residential-layout-evidence-only',enforce:'pre',transform(code,id){
 if(id.endsWith('/src/main.ts')){assert.ok(code.includes('requestAnimationFrame(frame);'),'RAF hook changed');return code.replaceAll('requestAnimationFrame(frame);','')+probe;}
 if(id.endsWith('/src/render/ShipEnvironments.ts')){const hook='return residentialGalleryBlockout(footprint,index);';assert.equal(code.split(hook).length,2,'Blockout hook changed');return code.replace(hook,partObserver);}
}}]});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:0}});
// All segments stay outside the four expanded solids. Southern bay views are
// from legal north approaches, not inside apparent empty recesses/storage bases.
const views=[['entry',[]],['middle',[{x:580,y:440}]],['exit',[{x:1100,y:440}]],['bunk',[{x:580,y:440},{x:340,y:440},{x:340,y:480}]],['packing',[{x:580,y:480},{x:850,y:480},{x:850,y:530}]]];
const results=[];let browser;
const budgets={blockoutPart:{meshes:128,triangles:100000,materials:8},world:{meshes:256,triangles:500000,materials:64},drawCalls:1000,renderTriangles:1000000};
const manifest={sha,script,budgets,evidenceClass:'Production-built app with local-only deterministic room-3 canonical progression staging and inactive encounter director. Actual DepthGame.update player traversal; production HUD, high composer and shipping gameplay camera, settled through 24 production 50ms render calls per gameplay view. Fitted overview is diagnostic, not gameplay framing.',limitations:['Layout fixture, not a campaign playthrough or release acceptance. Prior rooms are cleared programmatically.','No enemy navigation, combat, shot, pickup, touch-input or objective-completion proof. Only recorded player route segments are exercised.','Three actor-height ray samples and HUD bounding rectangles are diagnostics, not complete painted-pixel occlusion proof; independent PNG review remains pending.','Source blockout part counts are observed before production material batching. World budgets describe actual post-batch room meshes, not isolated equipment draw calls. These are bounded blockout ceilings, not final equipment budgets.','Google Fonts CSS is intercepted with an empty response; production HUD DOM/CSS is retained but fallback font metrics may differ.','SwiftShader-enabled Chromium counters do not prove real-device FPS. No camera, light, HUD or geometry changes in production source.'],results};
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
    assert.deepEqual(snapshot.progression,['awakening-bay','passenger-vault','residential-gallery']);
    assert.equal(snapshot.blockoutParts.length,4);assert.deepEqual(snapshot.blockoutParts.map(p=>p.index).sort(),[0,1,2,3]);
    for(const part of snapshot.blockoutParts)for(const [key,limit] of Object.entries(budgets.blockoutPart))assert.ok(Number.isFinite(part[key])&&part[key]>0&&part[key]<=limit,`Part ${part.index} ${key} budget`);
    for(const [key,limit] of Object.entries(budgets.world))assert.ok(Number.isFinite(snapshot.worldBudget[key])&&snapshot.worldBudget[key]>0&&snapshot.worldBudget[key]<=limit,`World ${key} budget`);
    assert.equal(snapshot.room,'residential-gallery');assert.equal(snapshot.state,'playing');assert.equal(snapshot.camera.zoom,1);assert.equal(snapshot.quality,'high');
    assert.ok(snapshot.drawCalls>0&&snapshot.drawCalls<=budgets.drawCalls);assert.ok(snapshot.triangles>0&&snapshot.triangles<=budgets.renderTriangles);
    assert.equal(snapshot.contextLost,false);assert.deepEqual(snapshot.errors,[]);assert.deepEqual(errors,[]);assert.equal(snapshot.hud.visible,true);assert.match(snapshot.hud.objective,/Fight through the residential doorways\./);
    if(view!=='full-room'){assert.ok(Math.abs(snapshot.camera.position[1]-snapshot.camera.focus[1]-26)<1e-6);assert.ok(Math.abs(snapshot.camera.position[2]-snapshot.camera.focus[2]-19)<1e-6);}
    if(view!=='entry'){assert.ok(snapshot.checks>0);assert.ok(snapshot.travel>0);}
    const file=`${name}-${view}.png`,bytes=await page.screenshot({path:resolve(out,file)});assert.equal(bytes.readUInt32BE(16),viewport.width);assert.equal(bytes.readUInt32BE(20),viewport.height);
    results.push({name,view,file,viewport,snapshot,errors:[...errors],sha256:createHash('sha256').update(bytes).digest('hex'),pixelReview:'pending'});await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(name,view,JSON.stringify(snapshot));
   }
  }catch(error){await page.screenshot({path:resolve(out,`${name}-FAILED.png`)}).catch(()=>{});await writeFile(resolve(out,'failure.json'),JSON.stringify({sha,name,error:String(error),errors},null,2));throw error;}finally{await context.close();}
 }
 const expected=2*(views.length+1);assert.equal(results.length,expected);assert.equal(new Set(results.map(r=>r.file)).size,expected);
 for(const name of ['desktop','portrait'])assert.deepEqual(results.filter(r=>r.name===name).map(r=>r.view),[...views.map(v=>v[0]),'full-room']);
 for(const r of results)assert.equal(createHash('sha256').update(await readFile(resolve(out,r.file))).digest('hex'),r.sha256);
 console.log(`Verified ${expected} unique captures and hashes`);
}finally{await browser?.close();await new Promise((res,rej)=>server.httpServer.close(e=>e?rej(e):res()));}
