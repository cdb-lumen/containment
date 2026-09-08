import assert from 'node:assert/strict';
import {mkdir, mkdtemp, writeFile, readFile, rm, access} from 'node:fs/promises';
import {resolve, relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {evidenceOptions,selectRooms,captureModes} from './room-evidence-options.mjs';

// Run from the repository root. Each invocation owns its server and temporary entry.
const args = process.argv.slice(2);
const options=evidenceOptions(args), {option,viewport}=options;
const root = process.cwd(), out = resolve(option('out', 'docs/pr-screenshots/rooms'));

const quality=option('quality','high');assert.ok(['low','high'].includes(quality));
let server, browser, temp;
try {
  server = await createServer({root, configFile:false, base:'/', optimizeDeps:{noDiscovery:true,include:[]}, server:{host:'127.0.0.1', port:0,preTransformRequests:false}, logLevel:'error'});
  await server.listen();
  const {ROOM_TEMPLATES:templates} = await server.ssrLoadModule('/src/game/roguelike/roomTemplates.ts');
  const {generateRun, RUN_LENGTH} = await server.ssrLoadModule('/src/game/roguelike/run.ts');
  let story;
  try { await access(resolve(root, 'src/game/roguelike/storyRooms.ts')); story = (await server.ssrLoadModule('/src/game/roguelike/storyRooms.ts')).ROOM_STORY_ROUTE; }
  catch (error) { if(error.code !== 'ENOENT') throw error; }
  const graph = generateRun(1729);
  const rooms = (story ?? Object.values(templates).map(t => ({templateId:t.id, name:t.name}))).map((room, index) => {
    assert.ok(templates[room.templateId], `Missing template ${room.templateId}`);
    const existing = graph.nodes.find(n => n.templateId === room.templateId);
    const depth = story ? index : existing?.depth ?? 8;
    const node = {...(existing ?? {kind:'combat',reward:'upgrade',next:[]}), id:`evidence-${index}-${room.templateId}`, depth, templateId:room.templateId};
    return {...room, roomId:room.id ?? `${String(index+1).padStart(2,'0')}-${room.templateId}`, index, node,
      environment:room.environment ?? templates[room.templateId].environment ?? `legacy-act-${Math.min(2,Math.floor(depth/4))}`};
  });
  assert.equal(new Set(rooms.map(r=>r.roomId)).size, rooms.length);
  if(option('expect', '') !== '') assert.equal(rooms.length, Number(option('expect')), 'Room inventory count');
  if(option('expect-environments', '') !== '') assert.equal(new Set(rooms.map(r=>r.environment)).size, Number(option('expect-environments')));
  const {scope,selected}=selectRooms(rooms,options);
  await mkdir(out, {recursive:true});
  const inventory = {commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), source:story?'ROOM_STORY_ROUTE':'ROOM_TEMPLATES baseline fallback', seed:1729, templateCount:Object.keys(templates).length, roomCount:rooms.length, environmentCount:new Set(rooms.map(r=>r.environment)).size, runLength:RUN_LENGTH, graphNodeCount:graph.nodes.length, rooms, scopeRoomCount:scope.length, scopeRoomIds:scope.map(r=>r.roomId), selectedRoomCount:selected.length, selectedRoomIds:selected.map(r=>r.roomId)};
  await writeFile(resolve(out,'inventory.json'), JSON.stringify(inventory,null,2)+'\n');
  if(args.includes('--inventory-only')) { console.log(JSON.stringify(inventory,null,2)); }
  else {
    temp = await mkdtemp(resolve(root,'.room-evidence-'));
    await writeFile(resolve(temp,'index.html'), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><style>html,body{margin:0;overflow:hidden}canvas{display:block;width:100vw;height:100vh}</style></head><body><canvas></canvas><script type="module" src="./harness.ts"></script></body></html>');
    await writeFile(resolve(temp,'harness.ts'), `
import * as T from 'three';
import {stageEvidenceGame,traverseEvidenceRoom,fightEvidenceGame} from '/scripts/room-evidence-scene.mjs';
import {DepthRenderer} from '/src/render/DepthRenderer';
import {preloadAssets} from '/src/render/assets';
import {createExpeditionGeometry,canOccupyExpedition} from '/src/game/world/expeditionGeometry';
import {FacilityNavigation} from '/src/game/world/FacilityNavigation';
import {ROOM_TEMPLATES} from '/src/game/roguelike/roomTemplates';
await preloadAssets();
const renderer = new DepthRenderer(document.querySelector('canvas')!);
renderer.setQuality(${JSON.stringify(quality)});
let game,fixture,combat,traversal;
window.evidence = {
 async stage(room) {
  traversal=traverseEvidenceRoom(room.node);
  fixture=stageEvidenceGame(room.node,e=>renderer.effect(e));game=fixture.game;combat=null;
  await renderer.prepare(game.node);
  let passengerExemplar=null;
  if(game.node.templateId==='passenger-vault'){
   const owner=(renderer as any).passengerExemplar;await owner.ready;
   if(owner.state!=='ready')throw Error('Passenger exemplar '+owner.state+': '+String(owner.error));
   const installed=renderer.scene.getObjectByName('passenger-exemplar');
   if(!installed||renderer.scene.getObjectByName('passenger-exemplar-fallback'))throw Error('Passenger replacement missing');
   passengerExemplar={state:owner.state,installed:true,scale:installed.scale.toArray(),mount:installed.position.toArray()};
  }
  return {enemies:game.enemies.activeCount,modelsPreloaded:true,materialsReady:true,prepared:true,traversal,passengerExemplar};
 },
 frame(mode) {
  renderer.resize();
  if(mode==='gameplay'&&!combat)combat=fightEvidenceGame(fixture,(g,dt)=>renderer.render(g,dt,false));
  renderer.renderer.info.reset();renderer.render(game,0,false);
  let corners=[];
  if(mode==='overview') {
   const t=ROOM_TEMPLATES[game.node.templateId], w=t.width/32,h=t.height/32;
   const camera=renderer.camera,center=new T.Vector3(w/2,0,h/2);
   camera.position.copy(center).add(new T.Vector3(0,36,26));camera.lookAt(center);camera.updateMatrixWorld(true);
   const bounds=new T.Box3();
   for(const x of [-1,w+1]) for(const y of [-1,5]) for(const z of [-1,h+1]) bounds.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
   const aspect=innerWidth/innerHeight, halfH=Math.max((bounds.max.y-bounds.min.y)/2,(bounds.max.x-bounds.min.x)/2/aspect)*1.08;
   const cx=(bounds.min.x+bounds.max.x)/2,cy=(bounds.min.y+bounds.max.y)/2;
   camera.left=cx-halfH*aspect;camera.right=cx+halfH*aspect;camera.bottom=cy-halfH;camera.top=cy+halfH;camera.updateProjectionMatrix();
   for(const x of [0,w]) for(const z of [0,h]) {const p=new T.Vector3(x,0,z).project(camera);corners.push([p.x,p.y]);}
  }
  // No RAF loop: this is the final actual scene draw before the screenshot.
  // Gameplay retains the production composer and world health bars. Only the
  // overview redraw uses the fitted camera outside normal production framing.
  if(mode==='overview'){
   renderer.renderer.info.reset();renderer.renderer.setRenderTarget(null);
   if(renderer.qualityTier==='high')renderer.composer.render();
   else renderer.renderer.render(renderer.scene,renderer.camera);
  }
  const gl=renderer.renderer.getContext();gl.finish();
  return {drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,webglError:gl.getError(),contextLost:gl.isContextLost(),corners,camera:{position:renderer.camera.position.toArray(),left:renderer.camera.left,right:renderer.camera.right,top:renderer.camera.top,bottom:renderer.camera.bottom}, player:{x:game.player.x,y:game.player.y},enemies:game.enemies.activeCount,combat:mode==='gameplay'?combat:null,composition:renderer.qualityTier==='high'?'production-high-composer':'production-direct'};
 }
};
`);
    browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
    const manifestPath=resolve(out,'manifest.json');
    let manifest={...inventory, viewport, quality, gameplayAll:options.gameplayAll, evidenceClass:'controlled-live-simulation', staging:'Controlled legal actors on a spawn-to-exit route verified with actual DepthGame.update. Fixed-step production combat and renderer; inactive encounter director, no boss, no campaign progression, no DOM HUD or real touch input. Overview fits room; gameplay retains production camera/composition.', results:[]};
    if(args.includes('--append')) {
      const previous=JSON.parse(await readFile(manifestPath,'utf8'));
      assert.equal(previous.commit,inventory.commit,'Cannot mix commits');
      assert.equal(previous.quality,quality,'Cannot mix quality settings');
      assert.deepEqual(previous.viewport,viewport,'Cannot mix viewports; use separate output directories');
      assert.deepEqual(previous.scopeRoomIds,inventory.scopeRoomIds,'Cannot mix scopes');
      assert.equal(previous.gameplayAll,options.gameplayAll,'Cannot mix mode policies');
      assert.deepEqual(previous.rooms,rooms,'Cannot mix inventories');
      manifest.results=previous.results;
    }

    for(const room of selected) {
      const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<600,hasTouch:viewport.width<600});
      const watchdog=setTimeout(()=>void context.close().catch(()=>{}),360000);
      await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1' ? route.continue() : route.abort('blockedbyclient'));
      const page=await context.newPage(), errors=[], abortedRequests=[], loadedUrls=new Set();
      page.setDefaultTimeout(120000);
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
      page.on('requestfinished',r=>loadedUrls.add(r.url()));
      page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED') abortedRequests.push(r.url()); else errors.push(r.url()+': '+r.failure()?.errorText);});
      try {
        await page.goto(server.resolvedUrls.local[0]+relative(root,temp)+'/index.html');
        await page.waitForFunction(()=>!!window.evidence);
        const readiness=await page.evaluate(r=>window.evidence.stage(r),room);
        for(const mode of captureModes(room,rooms.length,options)) {
          const metrics=await page.evaluate(m=>window.evidence.frame(m),mode);
          assert.ok(metrics.drawCalls>0 && metrics.triangles>0 && !metrics.contextLost);
          assert.equal(metrics.webglError,0);
          assert.ok(metrics.corners.every(p=>p.every(v=>Math.abs(v)<1)), 'Overview clips room');
          const file=`${String(room.index+1).padStart(2,'0')}-${room.templateId}-${mode}.png`;
          const bytes=await page.screenshot({path:resolve(out,file),animations:'disabled'});
          assert.equal(bytes.readUInt32BE(16),viewport.width);assert.equal(bytes.readUInt32BE(20),viewport.height);
          assert.deepEqual(errors,[]);
          // Chromium can cancel duplicate Vite module preloads. Accept only a
          // JS/TS module whose exact URL also completed; never normalize queries.
          assert.ok(abortedRequests.every(url=>/\.(?:[cm]?[jt]sx?)(?:\?|$)/.test(url) && loadedUrls.has(url)), JSON.stringify({abortedRequests,loadedUrls:[...loadedUrls]}));
          const row={abortedDuplicateModules:[...abortedRequests],roomId:room.roomId,templateId:room.templateId,environment:room.environment,mode,file,viewport,readiness,metrics,errors:[...errors],sha256:createHash('sha256').update(bytes).digest('hex'),pixelReview:'pending'};
          manifest.results=manifest.results.filter(r=>!(r.roomId===row.roomId && r.mode===mode));manifest.results.push(row);
          await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
          console.log(JSON.stringify({roomId:room.roomId,mode,drawCalls:metrics.drawCalls,file}));
        }
      } finally {clearTimeout(watchdog);await context.close();}
    }
    const overviews=manifest.results.filter(r=>r.mode==='overview');
    assert.equal(new Set(overviews.map(r=>r.roomId)).size,overviews.length);
    for(const row of manifest.results) {const bytes=await readFile(resolve(out,row.file));assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);}
    if(args.includes('--verify-all')) {assert.deepEqual(overviews.map(r=>r.roomId).sort(),scope.map(r=>r.roomId).sort());assert.equal(new Set(overviews.map(r=>r.sha256)).size,scope.length,'Duplicate overview pixels');assert.deepEqual(manifest.results.filter(r=>r.mode==='gameplay').map(r=>r.roomId).sort(),scope.filter(r=>captureModes(r,rooms.length,options).includes('gameplay')).map(r=>r.roomId).sort());}
    console.log(JSON.stringify({capturedOverviews:overviews.length,expected:scope.length,inventoryRooms:rooms.length,images:manifest.results.length,pixelReview:'pending; inspect images before making visual claims'}));
  }
} finally {
  await browser?.close();await server?.close();if(temp) await rm(temp,{recursive:true,force:true});
}
