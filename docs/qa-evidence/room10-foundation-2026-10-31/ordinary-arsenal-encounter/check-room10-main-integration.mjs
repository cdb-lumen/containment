import {execFileSync} from 'node:child_process';import vm from 'node:vm';import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
const main='87878c15',out=[];
for(const [root,old] of [['/workspace/containment-room10-current-integration','9ffcb83']]){
 const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8'}).trim();const blob=(rev,p)=>git('show',`${rev}:${p}`);const changed=git('diff','--name-only',old,'HEAD','--','src','tests','scripts','.github','package.json','package-lock.json').split('\n');const exceptions=['tests/unit/__snapshots__/awakeningTopology.test.ts.snap','tests/unit/__snapshots__/passengerBlockout.test.ts.snap','tests/unit/authoredTopology.test.ts','src/render/AuthoredRooms.ts','src/game/roguelike/authoredRoomTopologies.ts'];
 const exactMain=[];for(const p of changed.filter(p=>!exceptions.includes(p))){assert.equal(blob('HEAD',p),blob(main,p),p);exactMain.push(p);}
 for(const p of ['src/game/world/FacilityNavigation.ts','src/main.ts','src/render/roomFraming.ts','src/render/DepthRenderer.ts','src/HudLayout.ts','package.json'])assert.equal(blob('HEAD',p),blob(main,p),p);
 assert.equal(git('diff','--name-only',main,'HEAD','--','scripts','.github','package.json','package-lock.json'),'');
 const snaps=[];for(const p of exceptions.slice(0,2)){
  const parse=rev=>{const ctx={exports:{}};vm.runInNewContext(blob(rev,p),ctx);return Object.fromEntries(Object.entries(ctx.exports).map(([k,v])=>[k,JSON.parse(JSON.stringify(vm.runInNewContext(`(${v})`)))]));};
  const before=parse(old),current=parse('HEAD'),base=parse(main);assert.deepEqual(Object.keys(current),Object.keys(base));
  for(const [key,arr] of Object.entries(current)){
   if(!Array.isArray(arr)||!arr.every(x=>x&&x.id)){assert.deepEqual(arr,base[key]);continue;}
   assert.deepEqual(arr.map(x=>x.id),base[key].map(x=>x.id));const changedIds=[];for(const item of arr){const expected=base[key].find(x=>x.id===item.id),prior=before[key].find(x=>x.id===item.id);if(JSON.stringify(item)!==JSON.stringify(expected)){assert.equal(item.id,'transmission-chamber');assert.deepEqual(item,prior);changedIds.push(item.id);}}
   snaps.push({path:p,key,changedIdsVsMain:changedIds});
  }
 }
 out.push({root,head:git('rev-parse','HEAD'),old,exactMainIncomingFiles:exactMain,snapshots:snaps});
}
writeFileSync('/workspace/room10-main-integration-proof.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
