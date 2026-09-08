// Isolated evidence only. No shipping imports or source edits.
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function transformRoom(code){
 const replace=(needle,value)=>{assert.equal(code.split(needle).length,2,`unique preview hook: ${needle}`);code=code.replace(needle,value);};
 replace('box(x,21,z,84,10,86,f.ivory,5);',`if(typeof window!=='undefined'&&window.cryoAudit){window.cryoAudit.shells.push({index,j,x,z,replaced:index===1&&j===0&&window.cryoReplace});if(index===1&&j===0){window.cryoTarget={x,z};if(window.cryoReplace){window.cryoAudit.omittedShells++;continue;}}}\n   box(x,21,z,84,10,86,f.ivory,5);`);
 replace('const branch=[[x,12,headerZ],[x,20,headerZ],[x,20,portZ]];',`if(typeof window!=='undefined'&&window.cryoAudit){window.cryoAudit.branches.push({index,j,circuit,x,headerZ,portZ,replaced:index===1&&j===0&&window.cryoReplace});if(index===1&&j===0&&window.cryoReplace){window.cryoAudit.omittedBranches++;continue;}}\n    const branch=[[x,12,headerZ],[x,20,headerZ],[x,20,portZ]];`);
 return code;
}
// Also exercised in Node against the actual GLB geometry, without a GPU.
export function installCandidate(T,model){
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const bounds=o=>{const b=new T.Box3().setFromObject(o,true);return {min:b.min.toArray().map(v=>v*32),max:b.max.toArray().map(v=>v*32)};};
 model.scale.setScalar(1);model.rotation.set(0,0,0);model.position.set(0,0,0);model.updateMatrixWorld(true);
 const local=new T.Box3().setFromObject(model,true);model.position.set(490/32,16/32-local.min.y,295/32);model.name='native-cryo-candidate';model.updateMatrixWorld(true);
 const b=bounds(model);check(b.min[0]>=448-1e-4&&b.max[0]<=532+1e-4&&b.min[2]>=252-1e-4&&b.max[2]<=338+1e-4,'candidate exceeds original shell reservation');check(Math.abs(b.min[1]-16)<1e-4,'unsupported candidate');
 // Export batches erase part names. Probe actual transformed vertices in
 // narrowly specified semantic regions and the correct material batch.
 const probe=(material,lo,hi)=>{const box=new T.Box3();let count=0;model.traverse(o=>{if(!o.isMesh||!o.name.includes(material))return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).multiplyScalar(32);if(v.toArray().every((n,a)=>n>=lo[a]-1e-4&&n<=hi[a]+1e-4)){box.expandByPoint(v);count++;}}});check(count>=12,'missing measured semantic geometry '+material);return {min:box.min.toArray(),max:box.max.toArray(),vertices:count};};
 const feet=[];const unions={};model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 for(const x of [469.52,510.48])for(const z of [267.16,322.84])feet.push(probe('graphite',[x-4,16,z-6],[x+4,17.92,z+6]));
 for(const [circuit,x] of [['SUPPLY',478.48],['RETURN',493.84]])unions[circuit]=probe('stainless',[x-1.7,24.31,258.04-2.6],[x+1.7,25.93,258.04+2.6]);
 check(feet.length===4,'expected four actual GLB feet');for(const f of feet)check(f.min[0]>=458-1e-4&&f.max[0]<=522+1e-4&&[267,323].some(z=>f.min[2]>=z-7-1e-4&&f.max[2]<=z+7+1e-4)&&Math.abs(f.min[1]-16)<1e-4,'foot misses retained saddle');
 const adapters=new T.Group();adapters.name='native-cryo-service-adapters';const routes=[];const segments=[];
 for(const circuit of ['SUPPLY','RETURN']){
  check(!!unions[circuit],`missing actual ${circuit} union`);const u=unions[circuit];const end=[(u.min[0]+u.max[0])/2,u.min[1]+.1,(u.min[2]+u.max[2])/2];
  // Return bypasses the east ends of both retained saddles at x526.
  // Vertical feeds enter the existing manifold blocks from below, then meet
  // the real union bottom. They do not impersonate the old shell terminals.
  const points=circuit==='SUPPLY'?[[490,12,247],[end[0],12,247],[end[0],12,end[2]],end]:[[490,12,343],[526,12,343],[526,12,255],[end[0],12,255],[end[0],12,end[2]],end];
  const material=new T.MeshStandardMaterial({color:circuit==='SUPPLY'?0x557984:0x8e795b,metalness:.65,roughness:.48});
  for(let i=1;i<points.length;i++){
   const a=new T.Vector3(...points[i-1]).divideScalar(32),z=new T.Vector3(...points[i]).divideScalar(32),d=z.clone().sub(a);const mesh=new T.Mesh(new T.CylinderGeometry(.8/32,.8/32,d.length(),12),material);mesh.position.copy(a).add(z).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());mesh.castShadow=true;mesh.receiveShadow=true;adapters.add(mesh);mesh.updateMatrixWorld(true);const sb=bounds(mesh);segments.push(sb);
   check(sb.min[0]>=440&&sb.max[0]<=840&&sb.min[2]>=240&&sb.max[2]<=350,'adapter escapes bank');
   for(const f of feet)check(sb.max[0]<f.min[0]||sb.min[0]>f.max[0]||sb.max[1]<f.min[1]||sb.min[1]>f.max[1]||sb.max[2]<f.min[2]||sb.min[2]>f.max[2],'adapter intersects foot');
   for(const sz of [267,323])for(const m of [{min:[454,0,sz-10],max:[526,4,sz+10]},{min:[458,10,sz-7],max:[522,16,sz+7]},{min:[444,4,sz-5],max:[836,10,sz+5]}])check(sb.max.some((n,a)=>n<m.min[a])||sb.min.some((n,a)=>n>m.max[a]),'adapter intersects retained mount '+JSON.stringify({sb,m}));
  }
  routes.push({circuit,points,unionBounds:u,endpoint:end,connection:'header axis to underside manifold feed and actual union bottom'});
 }
 return {model,adapters,diagnostics:{bounds:b,feet,adapterBounds:bounds(adapters),segments,routes,scale:1,supportTop:16,interiorFit:'not established'}};
}
export async function main(){
 const root=process.cwd(),out='/home/chernodubv/.hermes/workspaces/containment-cryo-model-benchmark/native-integration';
 const asset=resolve(root,'public/assets/benchmark/sealed-cryo.glb');const hash=async()=>createHash('sha256').update(await readFile(asset)).digest('hex');
 const expected=process.env.CRYO_FROZEN_SHA256;assert.match(expected??'',/^[a-f0-9]{64}$/,'Capture requires owner-confirmed CRYO_FROZEN_SHA256; do not capture changing assets');assert.equal(await hash(),expected,'frozen asset mismatch');
 await mkdir(out,{recursive:true});await mkdir(resolve(root,'.cryo-preview'),{recursive:true});
 await writeFile(resolve(root,'.cryo-preview/index.html'),'<html><style>body{margin:0;background:#071014}canvas{display:block;width:100vw;height:100vh}</style><canvas></canvas><script type="module" src="./view.ts"></script></html>');
 await writeFile(resolve(root,'.cryo-preview/view.ts'),`
import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DepthRenderer} from '/src/render/DepthRenderer';import {DepthGame} from '/src/DepthGame';import {preloadAssets} from '/src/render/assets';
import {AWAKENING_BLOCKOUT,AWAKENING_FUNCTIONAL_ENVELOPES,AUTHORED_ROOM_TOPOLOGIES} from '/src/game/roguelike/authoredRoomTopologies';
const installCandidate=${installCandidate.toString()};
await preloadAssets();const game=new DepthGame(()=>{});game.status='playing';const params=new URLSearchParams(location.search);
window.cryoReplace=false;window.cryoAudit={shells:[],branches:[],omittedShells:0,omittedBranches:0};let candidate=null,error=null,ready=false;
const assetPath=params.has('failed')?'/assets/benchmark/deliberately-missing-cryo.glb':'/assets/benchmark/sealed-cryo.glb';
if(params.has('after')||params.has('failed')){try{const model=(await new GLTFLoader().loadAsync(assetPath)).scene;candidate=installCandidate(T,model);ready=true;window.cryoReplace=true;}catch(e){error=String(e);}}
const renderer=new DepthRenderer(document.querySelector('canvas'));renderer.setQuality('high');await renderer.prepare(game.node);
if(candidate){renderer.scene.add(candidate.model,candidate.adapters);}
renderer.render(game,0,false);renderer.render(game,0,false);renderer.renderer.getContext().finish();
const camera=()=>({position:renderer.camera.position.toArray(),quaternion:renderer.camera.quaternion.toArray(),projection:renderer.camera.projectionMatrix.toArray()});
const lights=[];renderer.scene.traverse(o=>{if(o.isLight)lights.push({type:o.type,color:o.color.getHex(),intensity:o.intensity,position:o.getWorldPosition(new T.Vector3()).toArray()});});
const center=new T.Vector3(490/32,27/32,295/32).project(renderer.camera);const px=(center.x+1)*innerWidth/2,py=(1-center.y)*innerHeight/2;
window.result={ready,error,assetPath,inserted:!!candidate,instances:renderer.scene.children.filter(o=>o.name==='native-cryo-candidate').length,baselineRetained:!candidate,target:window.cryoTarget,audit:window.cryoAudit,geometry:candidate?.diagnostics,camera:camera(),lights,topology:{fixtures:AWAKENING_BLOCKOUT,access:AWAKENING_FUNCTIONAL_ENVELOPES,room:AUTHORED_ROOM_TOPOLOGIES['awakening-bay']},drawCalls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,region:{x:Math.max(0,Math.floor(px-100)),y:Math.max(0,Math.floor(py-100)),width:200,height:200}};
window.shadowDiagnostic=()=>{renderer.scene.traverse(o=>{if(o.isMesh){o.receiveShadow=false;o.material&&(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});renderer.composer.render();renderer.renderer.getContext().finish();};
window.detail=()=>{renderer.camera.position.set(490/32,5,235/32);renderer.camera.lookAt(490/32,18/32,285/32);renderer.camera.zoom=3;renderer.camera.updateProjectionMatrix();renderer.camera.updateMatrixWorld();renderer.composer.render();renderer.renderer.getContext().finish();return camera();};
`);
 const server=await createServer({root,logLevel:'error',server:{host:'127.0.0.1',port:0},plugins:[{name:'isolated-native-cryo',enforce:'pre',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url?.includes('deliberately-missing-cryo.glb')){res.statusCode=404;res.end('Not found');return;}next();});},transform(code,id){if(id.endsWith('/src/render/AuthoredRooms.ts'))return transformRoom(code);}}]});
 await server.listen();let browser;const results=[];
 try{
  browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
  for(const variant of ['before','after','failed']){
   assert.equal(await hash(),expected);const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],responses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('cryo.glb'))responses.push({url:r.url(),status:r.status()});});
   await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/.cryo-preview/index.html?'+variant);await page.waitForFunction(()=>window.result,{timeout:120000});
   const data=await page.evaluate(()=>window.result);const png=await page.screenshot({path:out+'/native-'+variant+'.png'});const region=await page.screenshot({clip:data.region,path:out+'/native-crop-'+variant+'.png'});const detailCamera=await page.evaluate(()=>window.detail());await page.screenshot({path:out+'/mount-service-'+variant+'.png'});await page.evaluate(()=>window.shadowDiagnostic());await page.screenshot({path:out+'/diagnostic-no-received-shadows-'+variant+'.png'});
   results.push({variant,...data,detailCamera,errors,responses,assetSha256:expected,sha256:createHash('sha256').update(png).digest('hex'),regionSha256:createHash('sha256').update(region).digest('hex')});await page.close();
  }
  const [before,after,failed]=results;assert(after.ready&&!after.error&&after.inserted&&!after.baselineRetained);assert.equal(after.instances,1);assert.equal(after.audit.omittedShells,1);assert.equal(after.audit.omittedBranches,2);assert.deepEqual(after.target,{x:490,z:295});assert.notEqual(after.regionSha256,before.regionSha256,'candidate region must change');
  assert(failed.error&&!failed.ready&&!failed.inserted&&failed.baselineRetained);assert(failed.responses.some(r=>r.status===404));assert.equal(failed.sha256,before.sha256,'404 retains exact baseline');assert.deepEqual(failed.audit,before.audit);assert.equal(failed.drawCalls,before.drawCalls);assert.equal(failed.triangles,before.triangles);
  for(const r of results){assert.deepEqual(r.camera,before.camera);assert.deepEqual(r.detailCamera,before.detailCamera);assert.deepEqual(r.lights,before.lights);assert.deepEqual(r.topology,before.topology);assert.deepEqual(r.errors,[]);}
  assert.deepEqual(after.audit.shells.filter(s=>!s.replaced),before.audit.shells.filter(s=>!(s.index===1&&s.j===0)));assert.deepEqual(after.audit.branches.filter(s=>!s.replaced),before.audit.branches.filter(s=>!(s.index===1&&s.j===0)));
  for(const box of [after.geometry.bounds,...after.geometry.segments])for(const e of after.topology.access.filter(e=>e.kind==='access'))assert(box.max[0]<=e.bounds.x||box.min[0]>=e.bounds.x+e.bounds.w||box.max[2]<=e.bounds.y||box.min[2]>=e.bounds.y+e.bounds.h,'access overlap');
  // Radius-aware horizontal route bands remain clear of every new solid.
  for(const radius of [16,28])for(const y of [190,440])for(let x=440;x<=840;x+=4)for(const b of [after.geometry.bounds,...after.geometry.segments])assert(Math.hypot(Math.max(b.min[0]-x,0,x-b.max[0]),Math.max(b.min[2]-y,0,y-b.max[2]))>=radius,'new geometry blocks aisle route');
  assert.equal(await hash(),expected);await writeFile(out+'/comparison.json',JSON.stringify({evidence:'static scene with production camera and lighting; no HUD interaction or combat claim',increment:{drawCalls:after.drawCalls-before.drawCalls,triangles:after.triangles-before.triangles},results},null,2));console.log(JSON.stringify({passed:true,out,increment:{drawCalls:after.drawCalls-before.drawCalls,triangles:after.triangles-before.triangles}},null,2));
 }finally{await browser?.close();await server.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
