import {readFile,writeFile} from 'node:fs/promises';
import {createServer} from '/workspace/containment-ci/node_modules/vite/dist/node/index.js';
const d='/workspace/room9-desktop-final',m=JSON.parse(await readFile(d+'/manifest.json')),ss=JSON.parse(await readFile(d+'/movement-segments.json'));
const v=await createServer({root:'/workspace/containment-room9-repair',configFile:false,server:{middlewareMode:true,hmr:false},logLevel:'error'});
try{const {createExpeditionGeometry,canTraverseExpedition}=await v.ssrLoadModule('/src/game/world/expeditionGeometry.ts');const g=createExpeditionGeometry({templateId:m.room,id:'review'});const errors=[];let chains=0;const same=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-7;const moves=ss.filter(s=>s.allowed&&(s.fromX!==s.toX||s.fromY!==s.toY));
for(const s of moves)if(!canTraverseExpedition(g,{x:s.fromX,y:s.fromY},{x:s.toX,y:s.toY},s.radius))errors.push({segment:s});
for(let i=1;i<m.frames.length;i++){const f=m.frames[i],p=m.frames[i-1];for(const e of f.enemies){const old=p.enemies.find(x=>x.id===e.id);if(!old)continue;const steps=moves.filter(s=>s.frame===f.i&&s.enemyId===e.id);let pos=old;for(const s of steps){if(!same(pos,{x:s.fromX,y:s.fromY}))errors.push({chain:f.i,id:e.id});pos={x:s.toX,y:s.toY};}if(!same(pos,e))errors.push({endpoint:f.i,id:e.id});chains++;}}
for(let i=1;i<m.frames.length;i++){const a=m.frames[i-1].player,b=m.frames[i].player;if(!canTraverseExpedition(g,a,b,b.radius))errors.push({playerFrame:i});}
const result={playerSweeps:m.frames.length-1,segments:moves.length,chains,errors,witness:ss.filter(s=>s.frame===443&&s.enemyId===13)};await writeFile('/workspace/room9-independent-segment-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}finally{await v.close();}
