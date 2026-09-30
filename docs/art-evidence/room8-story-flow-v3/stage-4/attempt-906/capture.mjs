import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/home/chernodubv/dev/.cron-worktrees/containment-rooms/breached-loading-bay-v3',out=new URL('.',import.meta.url).pathname;
const req=createRequire(root+'/package.json'),{chromium}=req('playwright'),{createServer}=await import(req.resolve('vite'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const result={evidenceClass:'Room8 stage4 model iteration, actual desktop runtime, attempt906',limitations:['Checkpoint stages Room8. Simulation paused for reproducible art capture. Player legally staged. Desktop retains shipping camera and HUD. Overview fits camera in capture only. The canvas parent retains the visible DOM HUD. No combat or campaign acceptance. Chromium software WebGL.'],rows:[],errors:[],aborted:[],completed:[],source:{}};
for(const f of ['src/render/AuthoredRooms.ts','src/game/roguelike/authoredRoomTopologies.ts'])result.source[f]=hash(await readFile(root+'/'+f));
result.head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
let server,browser;
try{
 server=await createServer({root,base:'/',cacheDir:out+'.vite',logLevel:'error',server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();const origin=server.resolvedUrls.local[0];
 const main=await (await fetch(origin+'src/main.ts')).text(),line=main.split('\n').findLastIndex(x=>x.includes('lastRoom = game.roomRevision;'));assert(line>=0);
 const {generateRun}=await server.ssrLoadModule('/src/game/roguelike/run.ts'),{serializeCheckpoint,CHECKPOINT_STORAGE_KEY}=await server.ssrLoadModule('/src/game/roguelike/checkpoints.ts'),{CombatSystem}=await server.ssrLoadModule('/src/game/combat/CombatSystem.ts');
 const nodes=generateRun(1729,3).nodes,c=new CombatSystem();c.switchWeapon('shotgun');const checkpoint=serializeCheckpoint({version:1,savedAt:0,run:{version:3,seed:1729,currentNodeId:nodes[6].id,completedNodeIds:nodes.slice(0,7).map(n=>n.id),phase:'route'},build:{mutations:[]},resources:c.getRunResources()});
 browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});const ctx=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1});
 await ctx.addInitScript(({key,value})=>{localStorage.setItem(key,value);window.requestAnimationFrame=()=>1;},{key:CHECKPOINT_STORAGE_KEY,value:checkpoint});
 const page=await ctx.newPage();page.setDefaultTimeout(90000);
 page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED')result.aborted.push(r.url());else result.errors.push(r.url()+': '+r.failure()?.errorText);});page.on('requestfinished',r=>result.completed.push(r.url()));
 const fonts='/home/chernodubv/.hermes/workspaces/containment-art-roadmap/passenger-vault/recovery-43/normal-native/fonts';
 for(const f of JSON.parse(await readFile(fonts+'/resources.json','utf8'))){const body=await readFile(fonts+'/'+f.file);assert.equal(hash(body),f.sha256);await page.route(f.url,r=>r.fulfill({status:200,contentType:f.contentType,body}));}
 const cd=await ctx.newCDPSession(page);await cd.send('Debugger.enable');const bp=await cd.send('Debugger.setBreakpointByUrl',{url:origin+'src/main.ts',lineNumber:line});
 cd.on('Debugger.paused',async e=>{try{const r=await cd.send('Debugger.evaluateOnCallFrame',{callFrameId:e.callFrames[0].callFrameId,expression:'globalThis.__art={game,renderer,frame,hud};'});assert(!r.exceptionDetails);await cd.send('Debugger.removeBreakpoint',{breakpointId:bp.breakpointId});}catch(e){result.errors.push(String(e));}finally{await cd.send('Debugger.resume');}});
 await page.goto(origin);await page.waitForFunction(()=>window.__art&&document.body.dataset.state==='menu',null,{polling:100});await cd.send('Debugger.disable');
 await page.locator('#continue').dispatchEvent('click');await page.locator(`[data-route="${nodes[7].id}"]`).dispatchEvent('click');await page.evaluate(()=>{__art.frame(0);__art.frame(50);});await page.waitForFunction(()=>!__art.renderer.roomLoading,null,{polling:100});await page.evaluate(()=>{__art.frame(100);__art.hud();});await page.locator('#skip-story').dispatchEvent('click');
 for(const mode of ['desktop-in-scene','overview']){
  const metrics=await page.evaluate(async mode=>{
   const {game:g,renderer:r}=__art,{canOccupyExpedition}=await import('/src/game/world/expeditionGeometry.ts');
   Object.assign(g.player,{x:590,y:620,moving:false,vx:0,vy:0});if(!canOccupyExpedition(g.geometry,g.player,g.player.radius))throw Error('illegal pose');
   for(let i=0;i<30;i++)r.render(g,.1,false);__art.hud();
   if(mode==='overview'){
    const T=await import('/node_modules/three/build/three.module.js'),camera=r.camera,center=new T.Vector3(600/32,0,440/32);camera.position.copy(center).add(new T.Vector3(0,36,26));camera.lookAt(center);camera.updateMatrixWorld(true);
    const bounds=new T.Box3();for(const x of [-1,1200/32+1])for(const y of [-1,5])for(const z of [-1,880/32+1])bounds.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
    const aspect=innerWidth/innerHeight,hh=Math.max((bounds.max.y-bounds.min.y)/2,(bounds.max.x-bounds.min.x)/2/aspect)*1.08,cx=(bounds.min.x+bounds.max.x)/2,cy=(bounds.min.y+bounds.max.y)/2;
    camera.left=cx-hh*aspect;camera.right=cx+hh*aspect;camera.bottom=cy-hh;camera.top=cy+hh;camera.updateProjectionMatrix();
    for(const e of document.body.children)if(e.tagName!=='CANVAS'&&!e.querySelector('canvas'))e.style.visibility='hidden';
    r.renderer.setRenderTarget(null);r.composer.render();
   }
   const gl=r.renderer.getContext();gl.finish();return {node:g.node.templateId,legal:canOccupyExpedition(g.geometry,g.player,g.player.radius),player:{x:g.player.x,y:g.player.y},loading:r.roomLoading,quality:r.qualityTier,drawCalls:r.renderer.info.render.calls,webglError:gl.getError(),contextLost:gl.isContextLost(),camera:{position:r.camera.position.toArray(),zoom:r.camera.zoom},state:document.body.dataset.state};
  },mode);
  assert.equal(metrics.node,'breached-loading-bay');assert(metrics.legal&&!metrics.loading&&metrics.drawCalls>0&&!metrics.contextLost);assert.equal(metrics.webglError,0);assert.equal(metrics.quality,'high');assert.equal(metrics.state,'playing');
  const file=mode+'.png',bytes=await page.screenshot({path:out+file});result.rows.push({file,sha256:hash(bytes),metrics});console.log(file);
 }
 assert.deepEqual(result.errors,[]);assert(result.aborted.every(url=>result.completed.includes(url)),'unresolved aborted requests');result.passed=true;
}catch(e){result.failure=e.stack;process.exitCode=1;}
finally{await browser?.close();await server?.close();result.cleanup='owned Chromium and Vite closed';for(const [f,h]of Object.entries(result.source))assert.equal(hash(await readFile(root+'/'+f)),h);await writeFile(out+'capture-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,errors:result.errors,failure:result.failure}));}
