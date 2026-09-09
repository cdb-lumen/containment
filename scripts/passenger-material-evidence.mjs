// Temporary presentation fixture only. No shipping source is written.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build,preview} from 'vite';
import {chromium} from 'playwright';
const out=resolve(process.argv[2]??'docs/art-evidence/passenger-materials');
await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const probe=`
import * as MT from 'three';
import {GLTFLoader as MaterialLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries as mergeMaterialGeometry} from 'three/addons/utils/BufferGeometryUtils.js';
import {roomFocus as materialFocus} from './render/roomFraming';
const materialGroups={};let activeMaterial='neutral';
function materialDraw(){renderer.render(game,0,false);hud();syncScreen();renderer.renderer.getContext().finish();}
window.__materials={
 async stage(){
  game.newRun(1729);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);game.clearRoom();game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);game.route(game.node.next[0]);
  if(game.node.templateId!=='passenger-vault')throw Error('Wrong route');
  game.pending=[];game.enemies.reset();game.director=game.makeDirector();
  await renderer.prepare(game.node);renderer.resize();lastRoom=game.roomRevision;roomRecovering=false;
  el('room-loading').hidden=true;el('world').setAttribute('aria-busy','false');
  const loader=new MaterialLoader();
  for(const stage of ['neutral','material','wear']){
   const chamber=(await loader.loadAsync(import.meta.env.BASE_URL+'assets/passenger-vault/materials/'+stage+'-chamber.glb')).scene;
   const carrier=(await loader.loadAsync(import.meta.env.BASE_URL+'assets/passenger-vault/materials/'+stage+'-row-carrier.glb')).scene;
   const bins=new Map(),materials=new Map(),inventory=[];
   const add=(source,transform,family)=>{source.updateMatrixWorld(true);let upwardCueSegments=0,closedLids=0;source.traverse(o=>{if(!o.isMesh)return;if(o.name.includes('upward_live_relief_'))upwardCueSegments++;if(o.name.includes('closed_domed_lid'))closedLids++;const key=o.material.name,g=o.geometry.clone();g.applyMatrix4(new MT.Matrix4().multiplyMatrices(transform,o.matrixWorld));if(!bins.has(key))bins.set(key,[]);bins.get(key).push(g);if(!materials.has(key))materials.set(key,o.material);});const bounds=new MT.Box3().setFromObject(source).applyMatrix4(transform);inventory.push({family,translation:new MT.Vector3().setFromMatrixPosition(transform).toArray(),bounds:[bounds.min.toArray(),bounds.max.toArray()],upwardCueSegments,closedLids});};
   for(const [x,z,angle] of [[420,300,0],[780,300,0],[420,580,Math.PI],[780,580,Math.PI]]){
    const row=new MT.Matrix4().compose(new MT.Vector3(x/32,0,z/32),new MT.Quaternion().setFromAxisAngle(new MT.Vector3(0,1,0),angle),new MT.Vector3(1,1,1));
    add(carrier,row,'carrier');for(const dx of [-2.34375,-.78125,.78125,2.34375])add(chamber,row.clone().multiply(new MT.Matrix4().makeTranslation(dx,0,.25)),'chamber');
   }
   const group=new MT.Group();group.name='material-fixture-'+stage;group.userData.inventory=inventory;
   for(const [key,geometries] of bins){const geometry=mergeMaterialGeometry(geometries,false);if(!geometry)throw Error('Merge failed '+key);const mesh=new MT.Mesh(geometry,materials.get(key));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);for(const g of geometries)g.dispose();}
   group.visible=false;materialGroups[stage]=group;renderer.world.add(group);
  }
  // Static staging only. No simulation or VFX time passes between variants.
  renderer.shadowsDirty=true;return this.view('opening');
 },
 view(name){
  const points={opening:[100,440],F1:[180,440],'south-loop':[600,700],'full-room':[600,440],closeup:[420,400]},p=points[name];game.player.x=p[0];game.player.y=p[1];
  const camera=renderer.camera,t=ROOM_TEMPLATES[game.node.templateId];renderer.resize();
  const f=materialFocus(p[0]/32,p[1]/32,t.width/32,t.height/32,camera.right-camera.left,camera.top-camera.bottom,game.node.templateId);renderer.focus.set(f.x,0,f.z);
  materialDraw();
  if(name==='full-room'){
   const w=t.width/32,h=t.height/32,center=new MT.Vector3(w/2,0,h/2);camera.position.copy(center).add(new MT.Vector3(0,26,19));camera.lookAt(center);camera.updateMatrixWorld(true);
   const b=new MT.Box3();for(const x of [-1,w+1])for(const y of [-1,5])for(const z of [-1,h+1])b.expandByPoint(new MT.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
   const aspect=innerWidth/innerHeight,half=Math.max((b.max.y-b.min.y)/2,(b.max.x-b.min.x)/2/aspect)*1.08,cx=(b.min.x+b.max.x)/2,cy=(b.min.y+b.max.y)/2;
   camera.left=cx-half*aspect;camera.right=cx+half*aspect;camera.bottom=cy-half;camera.top=cy+half;
  }else if(name==='closeup'){
   const center=new MT.Vector3(420/32,.5,308/32);camera.position.copy(center).add(new MT.Vector3(0,26,19));camera.lookAt(center);const h=3.5;camera.left=-h*innerWidth/innerHeight;camera.right=h*innerWidth/innerHeight;camera.top=h;camera.bottom=-h;
  }
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);return this.snapshot();
 },
 variant(stage){
  activeMaterial=stage;for(const [name,g] of Object.entries(materialGroups))g.visible=name===stage;
  // Render the frozen production scene/composer directly. Camera, light/VFX
  // uniforms, player and HUD are unchanged across the three material frames.
  renderer.renderer.info.reset();renderer.renderer.shadowMap.needsUpdate=true;renderer.composer.render();renderer.renderer.getContext().finish();return this.snapshot();
 },
 snapshot(){const gl=renderer.renderer.getContext(),errors=[];let e;while((e=gl.getError())!==gl.NO_ERROR){errors.push(e);if(e===gl.CONTEXT_LOST_WEBGL)break;}
 return {variant:activeMaterial,room:game.node.templateId,quality:renderer.qualityTier,inventory:materialGroups[activeMaterial]?.userData.inventory??[],passengers:(materialGroups[activeMaterial]?.userData.inventory??[]).filter(i=>i.family==='chamber'&&i.closedLids===1).length,carriers:(materialGroups[activeMaterial]?.userData.inventory??[]).filter(i=>i.family==='carrier').length,fixtureMeshes:materialGroups[activeMaterial]?.children.length,camera:{zoom:renderer.camera.zoom,position:renderer.camera.position.toArray(),focus:renderer.focus.toArray(),left:renderer.camera.left,right:renderer.camera.right,top:renderer.camera.top,bottom:renderer.camera.bottom},player:{x:game.player.x,y:game.player.y},triangles:renderer.renderer.info.render.triangles,drawCalls:renderer.renderer.info.render.calls,errors,contextLost:gl.isContextLost(),gpu:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)};}
};`;
const outDir=resolve(out,'temporary-build');
const transformHashes={};
await build({build:{outDir,emptyOutDir:true},plugins:[{name:'isolated-material-presentation',enforce:'pre',transform(code,id){
 if(id.endsWith('/src/main.ts')){const result=code.replaceAll('requestAnimationFrame(frame);','')+probe;transformHashes.main=hash(result);return result;}
 if(id.endsWith('/src/render/AuthoredRooms.ts')){const needle='for(const [i,role] of PASSENGER_BLOCKOUT.entries()){';assert.equal(code.split(needle).length,2);const result=code.replace(needle,needle+'\n if(role.row)continue; // temporary GLB presentation owns rows only');transformHashes.authored=hash(result);return result;}
}}]});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:0}});
const manifest={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scriptSha256:hash(await readFile('scripts/passenger-material-evidence.mjs')),assetManifestSha256:hash(await readFile('public/assets/passenger-vault/materials/manifest.json')),evidenceClass:'NOT INTEGRATED RUNTIME. Local Vite transform replaces only blockout rows with imported accepted-geometry material variants. Production room, floor, services blockout, lighting, high composer, HUD, actor and shipping camera retained. Deterministic inactive encounter, teleported legal inspection positions, no gameplay/performance acceptance. Full-room/closeup are diagnostic projections, not shipping framing. Material variants share frozen camera/light/VFX time.',transformHashes,inventoryInterpretation:'Physical imported instances and named mesh segments only. Closed lids and six upward segments per chamber do not prove pixel-readable live cues.',counterInterpretation:'drawCalls and triangles are diagnostic renderer counters, not isolated added-main-pass or whole-room shipping budget measurements.',results:[],independentReview:'pending'};
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const [name,viewport,mobile] of [['desktop',{width:1280,height:900},false],['portrait',{width:390,height:844},true]]){
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1}),page=await context.newPage(),errors=[];page.setDefaultTimeout(180000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  try{
   await page.goto(server.resolvedUrls.local[0]);await page.waitForFunction(()=>!!window.__materials);await page.evaluate(()=>window.__materials.stage());
   for(const view of ['opening','F1','south-loop','full-room',...(name==='desktop'?['closeup']:[])]){
    await page.evaluate(v=>window.__materials.view(v),view);let camera;
    for(const stage of ['neutral','material','wear']){
     const snapshot=await page.evaluate(s=>window.__materials.variant(s),stage);
     assert.equal(snapshot.camera.zoom,1);assert.equal(snapshot.quality,'high');assert.equal(snapshot.passengers,16);assert.equal(snapshot.carriers,4);assert.ok(snapshot.fixtureMeshes<=5);assert.equal(snapshot.contextLost,false);assert.deepEqual(snapshot.errors,[]);assert.deepEqual(errors,[]);
     assert.equal(snapshot.inventory.length,20);
     assert.equal(new Set(snapshot.inventory.map(i=>i.family+JSON.stringify(i.translation))).size,20);
     for(const item of snapshot.inventory){
      assert.equal(item.closedLids,item.family==='chamber'?1:0);
      assert.equal(item.upwardCueSegments,item.family==='chamber'?6:0);
      assert.ok(item.bounds.flat().every(Number.isFinite));
      for(let axis=0;axis<3;axis++)assert.ok(item.bounds[1][axis]>item.bounds[0][axis]);
     }
     if(camera)assert.deepEqual(snapshot.camera,camera);camera=snapshot.camera;
     if(!['full-room','closeup'].includes(view)){assert.ok(Math.abs(camera.position[1]-camera.focus[1]-26)<1e-6);assert.ok(Math.abs(camera.position[2]-camera.focus[2]-19)<1e-6);}
     const file=name+'-'+view+'-'+stage+'.png',bytes=await page.screenshot({path:resolve(out,file)});assert.equal(bytes.readUInt32BE(16),viewport.width);assert.equal(bytes.readUInt32BE(20),viewport.height);
     manifest.results.push({file,name,view,stage,viewport,snapshot,sha256:hash(bytes),pixelReview:'pending'});await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(file,JSON.stringify(snapshot));
    }
   }
  }catch(e){await page.screenshot({path:resolve(out,name+'-FAILED.png')}).catch(()=>{});await writeFile(resolve(out,'failure.json'),JSON.stringify({error:String(e),errors},null,2));throw e;}finally{await context.close();}
 }
 assert.equal(manifest.results.length,27);for(const r of manifest.results)assert.equal(hash(await readFile(resolve(out,r.file))),r.sha256);
 console.log('Verified 27 PNGs, fixed cameras, no browser/WebGL errors. Independent review pending.');
}finally{await browser?.close();await new Promise((res,rej)=>server.httpServer.close(e=>e?rej(e):res()));await rm(outDir,{recursive:true,force:true});}
