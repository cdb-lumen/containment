import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.SEALED_EVIDENCE_OUT??'/home/chernodubv/.hermes/workspaces/containment-awakening-completion/evidence';
await mkdir(out,{recursive:true});await mkdir('.sealed-evidence',{recursive:true});
await writeFile('.sealed-evidence/index.html','<html><style>body{margin:0}canvas{display:block}</style><canvas></canvas><script type="module" src="./view.ts"></script></html>');
await writeFile('.sealed-evidence/view.ts',`
import * as T from 'three';import {DepthRenderer} from '/src/render/DepthRenderer';import {DepthGame} from '/src/DepthGame';import {preloadAssets} from '/src/render/assets';
await preloadAssets();const game=new DepthGame(()=>{});game.status='playing';const renderer=new DepthRenderer(document.querySelector('canvas'));renderer.setQuality('high');
const state=()=>JSON.stringify({player:game.player,node:game.node,status:game.status});const before=state();await renderer.prepare(game.node);await renderer.sealedBank.ready;
renderer.render(game,0,false);renderer.render(game,0,false);renderer.renderer.getContext().finish();
const pods=[];renderer.world.traverse(o=>{if(o instanceof T.InstancedMesh)pods.push({count:o.count,normal:!!o.geometry.attributes.normal,uv:!!o.geometry.attributes.uv,shadow:o.receiveShadow});});
window.result={state:renderer.sealedBank.state,unchanged:before===state(),pods,calls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,camera:{p:renderer.camera.position.toArray(),q:renderer.camera.quaternion.toArray(),projection:renderer.camera.projectionMatrix.toArray()}};
window.reenter=async()=>{renderer.loadRoom(game.node);await renderer.sealedBank.ready;return {state:renderer.sealedBank.state,banks:renderer.world.getObjectsByProperty('name','sealed-chamber-bank').length};};
window.retire=()=>renderer.dispose();
`);
const server=await createServer({server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();let browser;const results=[];
try{browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});for(const variant of ['success','404']){const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let requests=0;await page.route('**/assets/benchmark/sealed-cryo.glb',async route=>{requests++;if(variant==='404')await route.fulfill({status:404,body:'missing'});else await route.continue();});await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/.sealed-evidence/index.html');await page.waitForFunction(()=>window.result,{timeout:120000});const data=await page.evaluate(()=>window.result);await page.screenshot({path:out+'/native-'+variant+'.png'});assert(data.unchanged);assert.equal(data.state,variant==='success'?'ready':'fallback');assert.equal(requests,1);if(variant==='success'){assert.equal(data.pods.length,8);assert(data.pods.every(p=>p.count===8&&p.normal&&p.uv&&p.shadow));}else assert.equal(data.pods.length,0);const reentry=await page.evaluate(()=>window.reenter());assert.equal(reentry.state,data.state);assert.equal(reentry.banks,variant==='success'?1:0);assert.equal(requests,2);await page.evaluate(()=>window.retire());assert.deepEqual(errors,[]);results.push({variant,...data,reentry,requests,errors});await page.close();}assert.deepEqual(results[0].camera,results[1].camera);await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));}finally{await browser?.close();await server.close();}
