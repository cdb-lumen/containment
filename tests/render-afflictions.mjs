// Native-scale real actors, concrete floor, orthographic camera, no bloom.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:0},base:'/'});await server.listen();
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/affliction-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#18252b"><div style="position:absolute;top:170px;width:100%;display:flex;justify-content:space-around;color:#e2efef;font:16px monospace"><span>Burn</span><span>Chill 1</span><span>Chill 3</span><span>Frozen</span><span>Poison</span><span>Combined</span></div></body></html>'}));
 await page.goto(`${origin}/affliction-fixture`);
 await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');const {preloadAssets}=await import('/src/render/assets.ts');const {alien}=await import('/src/render/models.ts');const {AfflictionBatches}=await import('/src/render/afflictions.ts');await preloadAssets();
  const manager=new T.LoadingManager();const ready=new Promise(resolve=>manager.onLoad=resolve),loader=new T.TextureLoader(manager),batch=new AfflictionBatches(loader);
  const concrete=loader.load('/assets/environment/concrete_diff.jpg');concrete.colorSpace=T.SRGBColorSpace;concrete.wrapS=concrete.wrapT=T.RepeatWrapping;concrete.repeat.set(7,4);await ready;
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;document.body.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x18252b);scene.add(batch.root);scene.add(new T.HemisphereLight(0xbadbdc,0x485557,2.5));const light=new T.DirectionalLight(0xe8efdb,3);light.position.set(12,25,9);scene.add(light);
  const camera=new T.OrthographicCamera(-15,15,8.4375,-8.4375,.1,100);camera.position.set(0,18,13);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const floor=new T.Mesh(new T.PlaneGeometry(36,24),new T.MeshStandardMaterial({map:concrete,color:0x889499,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
  const models=Array.from({length:6},(_,i)=>{const m=alien('brute');m.root.position.x=(i-2.5)*4.7;m.animate(0,1,0);m.animate(.05,1,0);scene.add(m.root);return m;});
  const statuses=[{chilled:false,burning:true},{chilled:true,burning:false,chillStacks:1},{chilled:true,burning:false,chillStacks:3},{chilled:false,burning:false,frozen:true},{chilled:false,burning:false,poisoned:true},{chilled:true,burning:true,poisoned:true,frozen:true,chillStacks:3}];
  const warning=new T.Mesh(new T.RingGeometry(1.7,1.8,48),new T.MeshBasicMaterial({color:0xee7766,side:T.DoubleSide}));warning.rotation.x=-Math.PI/2;warning.position.set(11.75,.03,0);scene.add(warning);
  window.fixture={models,statuses,renderer,scene,camera,batch,paint:(t=1)=>{batch.update(scene.children,camera,t);renderer.render(scene,camera);}};window.fixture.paint();
 });
 await mkdir('docs/pr-screenshots',{recursive:true});
 const result=await page.evaluate(()=>{const f=window.fixture;const before=f.renderer.info.render.calls;f.models.forEach((m,i)=>m.setAffliction(f.statuses[i]));f.paint(1.2);return{drawCalls:f.renderer.info.render.calls,extraCalls:f.renderer.info.render.calls-before,counts:f.batch.counts};});
 assert.equal(result.extraCalls,5);assert.deepEqual(result.counts,{fire:6,poison:4,ice:28,drops:8,embers:8});
 await page.screenshot({path:'docs/pr-screenshots/persistent-status-vfx.png'});
 await page.evaluate(()=>{const f=window.fixture;f.models.forEach(m=>m.setAffliction({chilled:false,burning:false}));f.paint();if(Object.values(f.batch.counts).some(Boolean))throw Error('stale statuses');});assert.deepEqual(errors,[]);console.log(JSON.stringify({fixture:'real aliens / concrete / no bloom',...result,errors}));
}finally{await browser.close();await server.close();}
