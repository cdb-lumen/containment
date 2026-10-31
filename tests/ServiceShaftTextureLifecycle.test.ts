import {afterAll,beforeAll,expect,test} from 'vitest';
import {chromium,type Browser} from 'playwright';
import {createServer,type ViteDevServer} from 'vite';

// Browser canvas lifecycle only: no WebGL context or gameplay acceptance.
let server:ViteDevServer,browser:Browser,origin:string;
beforeAll(async()=>{
 server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 await server.listen();origin=`http://127.0.0.1:${(server.httpServer!.address() as {port:number}).port}`;
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});
});
afterAll(async()=>{await browser?.close();await server?.close();});
test('retires room-owned grain and canvas sign through actual flatten/bake/dispose on repeat visits',async()=>{
 const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__shaft-lifecycle',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Room14 lifecycle</title>'}));
 await page.goto(origin+'/__shaft-lifecycle');
 const result=await page.evaluate(async()=>{
  const load=new Function('path','return import(path)') as (path:string)=>Promise<any>;
  const {serviceShaftLanding}=await load('/src/render/ServiceShaftLanding.ts');
  const {ROOM_TEMPLATES}=await load('/src/game/roguelike/roomTemplates.ts');
  const {appendEnvironment}=await load('/src/render/ShipEnvironments.ts');
  const {DepthRenderer}=await load('/src/render/DepthRenderer.ts');
  const {disposeModel,MAT}=await load('/src/render/meshParts.ts');
  let sharedDisposals=0;const shared=()=>sharedDisposals++;MAT.steel.addEventListener('dispose',shared);
  const visits=[];
  for(let visit=0;visit<3;visit++){
   const root=serviceShaftLanding(ROOM_TEMPLATES['service-shaft-landing']),world=new root.constructor();
   const meshes:any[]=[];root.traverse((o:any)=>{if(o.isMesh)meshes.push(o);});
   const materials=[...new Set<any>(meshes.map(o=>o.material))],textures=[...new Set<any>(materials.map(m=>m.map).filter(Boolean))];
   const sources=meshes.map(o=>o.geometry),counts=new Map<any,number>();
   const observe=(o:any)=>{counts.set(o,0);o.addEventListener('dispose',()=>counts.set(o,counts.get(o)!+1));};
   [...materials,...textures,...sources].forEach(observe);
   appendEnvironment(world,root);DepthRenderer.prototype.bakeWorld.call({world,floorMaterial:null});
   const baked=world.children.map((o:any)=>o.geometry);baked.forEach(observe);
   const before={sourceOnce:sources.every(o=>counts.get(o)===1),texturesLive:textures.every(o=>counts.get(o)===0)};
   disposeModel(world);
   visits.push({...before,buckets:baked.length,textureKinds:textures.map(t=>t.isCanvasTexture?'canvas':t.isDataTexture?'data':'other').sort(),allOnce:[...materials,...textures,...sources,...baked].every(o=>counts.get(o)===1)});
  }
  MAT.steel.removeEventListener('dispose',shared);return {visits,sharedDisposals};
 });
 expect(errors).toEqual([]);expect(result.sharedDisposals).toBe(0);expect(result.visits).toHaveLength(3);
 for(const visit of result.visits){expect(visit).toMatchObject({sourceOnce:true,texturesLive:true,allOnce:true,textureKinds:['canvas','data']});expect(visit.buckets).toBe(8);}
 await page.close();
},30000);
