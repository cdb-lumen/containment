// Real WebGL renderer fixture, isolated from gameplay and its diagnostics.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:0},base:'/'});await server.listen();
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/affliction-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#18252b"><div id="labels" style="position:absolute;top:35px;width:100%;display:flex;justify-content:space-around;color:#e2efef;font:16px monospace"><span>Burn</span><span>Chill 1</span><span>Chill 3</span><span>Frozen</span><span>All statuses</span></div></body></html>'}));
 await page.goto(`${origin}/affliction-fixture`);
 await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');const {preloadAssets}=await import('/src/render/assets.ts');const {alien}=await import('/src/render/models.ts');await preloadAssets();
  const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);document.body.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x18252b);scene.add(new T.HemisphereLight(0xeaf8ff,0x485c43,3));const light=new T.DirectionalLight(0xffffff,3);light.position.set(0,10,5);scene.add(light);
  const camera=new T.OrthographicCamera(-12,12,6.75,-6.75,.1,100);camera.position.set(0,18,13);camera.lookAt(0,0,0);
  const floor=new T.Mesh(new T.PlaneGeometry(28,16),new T.MeshStandardMaterial({color:0x46545b,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;scene.add(floor);
  const models=Array.from({length:5},(_,i)=>{const m=alien('brute');m.root.position.x=(i-2)*4.5;m.animate(0,1,0);m.animate(.05,1,0);scene.add(m.root);return m;});
  const statuses=[{chilled:false,burning:true},{chilled:true,burning:false,chillStacks:1},{chilled:true,burning:false,chillStacks:3},{chilled:false,burning:false,frozen:true},{chilled:true,burning:true,poisoned:true,frozen:true,chillStacks:3}];
  // A floor warning remains visible around the combined-status actor.
  const warning=new T.Mesh(new T.RingGeometry(1.7,1.8,48),new T.MeshBasicMaterial({color:0xee7766,side:T.DoubleSide}));warning.rotation.x=-Math.PI/2;warning.position.set(9,.03,0);scene.add(warning);
  window.fixture={models,statuses,renderer,scene,camera,paint:()=>renderer.render(scene,camera)};window.fixture.paint();
 });
 await mkdir('docs/pr-screenshots',{recursive:true});
 await page.screenshot({path:'docs/pr-screenshots/boon-vfx-fixture-before.png'});
 const result=await page.evaluate(()=>{const f=window.fixture;f.models.forEach((m,i)=>{m.setAffliction(f.statuses[i]);m.animate(.1,1,0);});f.paint();return {drawCalls:f.renderer.info.render.calls,cues:f.models.map(m=>m.root.children.filter(c=>c.name.startsWith('status-')&&c.visible).map(c=>c.name))};});
 assert.deepEqual(result.cues,[['status-burning'],['status-chill'],['status-chill'],['status-frozen'],['status-burning','status-chill','status-frozen','status-poison']]);
 await page.screenshot({path:'docs/pr-screenshots/boon-vfx-fixture-after.png'});
 await page.evaluate(()=>{const f=window.fixture;f.models.forEach(m=>m.setAffliction({chilled:false,burning:false}));f.paint();});assert.deepEqual(errors,[]);console.log(JSON.stringify({fixture:'real actor models / WebGL',...result,errors}));
}finally{await browser.close();await server.close();}
