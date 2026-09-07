// Isolated evidence only. Never imported by the shipping app.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const out='/home/chernodubv/.hermes/workspaces/containment-cryo-model-benchmark';
const root=process.cwd();await mkdir(out,{recursive:true});await mkdir(resolve(root,'.cryo-preview'),{recursive:true});
await writeFile(resolve(root,'.cryo-preview/index.html'),`<html><style>body{margin:0;background:#071014}canvas{display:block}p{position:absolute;bottom:0;color:white;font:14px monospace}</style><canvas></canvas><p>Single model benchmark / native gameplay camera and lighting / static scene</p><script type="module" src="./view.ts"></script></html>`);
await writeFile(resolve(root,'.cryo-preview/view.ts'),`
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DepthRenderer} from '/src/render/DepthRenderer';import {DepthGame} from '/src/DepthGame';import {preloadAssets} from '/src/render/assets';
await preloadAssets();const game=new DepthGame(()=>{});game.status='playing';
let model;let ready=false;let error=null;const params=new URLSearchParams(location.search);
// Adult model exceeds approved reservation. Load validation only, never insert into room.
window.cryoReplace=false;
const assetPath=params.has('failed')?'/assets/benchmark/deliberately-missing-cryo.glb':'/assets/benchmark/sealed-cryo.glb';
if(params.has('after')||params.has('failed')){try{model=(await new GLTFLoader().loadAsync(assetPath)).scene;ready=true;window.cryoReplace=false;}catch(e){error=String(e);}}
const renderer=new DepthRenderer(document.querySelector('canvas'));renderer.setQuality('high');await renderer.prepare(game.node);
if(model&&window.cryoReplace){model.scale.setScalar(50/32);model.position.set(window.cryoTarget.x/32,0,window.cryoTarget.z/32);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});renderer.scene.add(model);}
renderer.render(game,0,false);renderer.renderer.info.reset();renderer.render(game,0,false);renderer.renderer.getContext().finish();
window.result={ready,error,assetPath,baselineRetained:!window.cryoReplace,target:window.cryoTarget,camera:{position:renderer.camera.position.toArray(),projection:renderer.camera.projectionMatrix.toArray()},drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles};
`);
const server=await createServer({root,logLevel:'error',server:{host:'127.0.0.1',port:0},plugins:[{name:'one-cassette-evidence-only',enforce:'pre',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url?.includes('deliberately-missing-cryo.glb')){res.statusCode=404;res.end('Not found');return;}next();});},transform(code,id){if(!id.endsWith('/src/render/AuthoredRooms.ts'))return;const needle='box(x,21,z,84,10,86,f.ivory,5);';assert.equal(code.split(needle).length,2,'exactly one cassette insertion point');return code.replace(needle,`if(index===1&&j===0&&typeof window!=='undefined'){window.cryoTarget={x,z};if(window.cryoReplace)continue;}\n   ${needle}`);}}]});
await server.listen();let browser;const results=[];
try{browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});for(const variant of ['before','after','failed']){const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];const responses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('cryo.glb'))responses.push({url:r.url(),status:r.status()});});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/.cryo-preview/index.html?${variant}`);await page.waitForFunction(()=>window.result,{timeout:120000});const path=out+'/gameplay-'+variant+'.png';await page.screenshot({path});results.push({variant,...await page.evaluate(()=>window.result),errors,responses,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});await page.close();}
const [before,after,failed]=results;assert(after.ready&&!after.error&&after.baselineRetained);assert.equal(after.sha256,before.sha256,'oversized model must not alter approved room');assert(failed.error&&!failed.ready&&failed.baselineRetained);assert(failed.responses.some(r=>r.status===404));for(const r of results){assert.deepEqual(r.camera,before.camera);assert.deepEqual(r.errors,[]);}assert.equal(failed.drawCalls,before.drawCalls);assert.equal(failed.triangles,before.triangles);assert.equal(failed.sha256,before.sha256,'failed asset must paint the exact baseline');assert(after.drawCalls-before.drawCalls<20,'material batching draw budget');await writeFile(out+'/comparison.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));console.log('PASS: model loaded but NOT inserted due to fit limit; actual 404 and fit-gate baseline pixel parity; same camera');}finally{await browser?.close();await server.close();}
