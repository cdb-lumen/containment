import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
import * as T from '/workspace/containment-ci/node_modules/three/build/three.module.js';
const s=await createServer({root:'/workspace/containment-room16-remodel',configFile:false,server:{middlewareMode:true},logLevel:'error'});
try{const {swarmJunctionBlockout}=await s.ssrLoadModule('/src/render/SwarmJunction.ts');const root=swarmJunctionBlockout();root.updateMatrixWorld(true);
for(const name of ['root-west-cut','root-east-cut','root-south-cut','distributor-front-panel']){const m=root.getObjectByName(name),b=new T.Box3().setFromObject(m),c=b.getCenter(new T.Vector3());let own=0,total=0;
 for(let i=1;i<5;i++)for(let j=1;j<5;j++){const x=b.min.x+(b.max.x-b.min.x)*i/5,z=b.min.z+(b.max.z-b.min.z)*j/5;const hit=new T.Raycaster(new T.Vector3(x,5,z),new T.Vector3(0,-1,0)).intersectObject(root,true)[0];if(hit?.object.name===name)own++;total++;}
 const dir=new T.Vector3(0,26,19).normalize(),hits=new T.Raycaster(c.clone().addScaledVector(dir,10),dir.negate()).intersectObject(root,true);
 console.log(JSON.stringify({name,center:c.toArray().map(x=>x*32),verticalVisible:own,total,nativeFirst:hits[0]?.object.name,topHits:new T.Raycaster(new T.Vector3(c.x,5,c.z),new T.Vector3(0,-1,0)).intersectObject(root,true).slice(0,3).map(h=>[h.object.name,h.point.y*32])}));
}}finally{await s.close();}
