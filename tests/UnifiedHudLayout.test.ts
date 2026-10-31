import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,expect,it} from 'vitest';
import {chromium,type Browser,type Page} from 'playwright';
import {createServer,type ViteDevServer} from 'vite';
import ts from 'typescript';

// Real desktop DOM only. No WebGL renderer, encounter or frame-time claim.
// The original 180-case RED audit remains /workspace/unified-hud-audit.{json,log}.
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8').replace(/@import[^;]+;/g,'');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const markup=main.slice(main.indexOf('<div id="hud"'),main.indexOf('<div id="room-loading"'))
 .replace("${icon('pause')}",'Ⅱ')
 .replace(/\$\{\(\['pistol'[\s\S]*?join\(''\)\}/,['pistol','rifle','shotgun','plasma','rocket'].map((id,i)=>`<button data-weapon="${id}" aria-label="Equip ${id}"><small>${i+1}</small><span>${id}</span></button>`).join(''));
// Exercise actual startup listeners/capture registration, with execution counters
// standing in for game actions. Do not silently install a test-only capture hook.
const registrationStart=main.indexOf("captureWeaponPointer(el('pause')");
const registration=main.slice(registrationStart>=0?registrationStart:main.indexOf("el('pause').addEventListener"),main.indexOf('const routeCopy='));
const listeners=ts.transpileModule(`
const el=(id:string)=>document.getElementById(id)!;
const captureWeaponPointer=(window as any).__weapon.captureWeaponPointer;
const game={roomRevision:1,switchWeapon:(id:string)=>{(window as any).__actions.push(id);},skipStory:()=>{(window as any).__actions.push('skip');}};
const roomRecovering=false,lastRoom=1,renderer={roomLoading:false},graphicsLost=false;
const pause=()=>{(window as any).__actions.push('pause');};const hud=()=>{};
${registration}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const sizes=[[640,360],[600,600],[960,540],[1280,900],[1920,1080]] as const;
const cases=sizes.flatMap(([w,h])=>[true,false].flatMap(expanded=>[false,true].map(boss=>[w,h,expanded,boss] as const)));
const copy={health:'100',armor:'50','depth-label':'ENGINEERING · 12 / 20','room-name':'Safety-interlock station','build-strip':'Kinetic 4 · Cryo 3 · Reactor 4 · Recovery 3',credits:'1250 CR','desktop-stock':'E 2 medkits · G 3 grenades','encounter-count':'26 remaining','story-status':'New Earth warned · Passengers alive · Purge kills everyone · AI knew before awakening','room-objective':'Clear the interlock station. Review the pre-awakening safety record.','story-line':'LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward.','weapon-name':'SHOTGUN',magazine:'08',reserve:'/ 21','reload-label':'RELOADING','boss-phase':'ARMORED · 12s'};
let browser:Browser,server:ViteDevServer,origin:string;
beforeAll(async()=>{
 server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0},logLevel:'error'});await server.listen();origin=`http://127.0.0.1:${(server.httpServer!.address() as {port:number}).port}`;
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});
});
afterAll(async()=>{await browser?.close();await server?.close();});
async function mount(width:number,height:number){
 const page=await browser.newPage({viewport:{width,height}});
 await page.route('**/__unified-hud',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><style>${css}</style><body data-state="playing"><canvas id="world"></canvas><div id="app">${markup}</div>`}));
 await page.goto(origin+'/__unified-hud');
 await page.evaluate(async values=>{
  const load=new Function('path','return import(path)') as (p:string)=>Promise<any>;
  (window as any).__place=(await load('/src/HudLayout.ts')).positionHudPanels;
  (window as any).__weapon=await load('/src/WeaponHud.ts');(window as any).__actions=[];
  for(const id of ['hud','story-hud'])document.getElementById(id)!.hidden=false;
  for(const[id,text]of Object.entries(values))document.getElementById(id)!.textContent=text;
 },copy);
 await page.addScriptTag({content:listeners});return page;
}
async function inspect(page:Page,x:number,y:number){
 return page.evaluate(({x,y})=>{
  const actor={left:x-21,right:x+21,top:y-40,bottom:y+40};
  const selectors=['.vitals','.room-label','#pause','#build-strip','#run-stock','#story-hud','.weapon-hud','#weapon-picker','.desktop-hint',...(!document.getElementById('boss-hud')!.hidden?['#boss-hud']:[])];
  const frames:any[]=[];
  for(let i=0;i<8;i++){
   const success=(window as any).__place(actor,innerWidth,innerHeight);
   const boxes=Object.fromEntries(selectors.map(s=>[s,document.querySelector(s)!.getBoundingClientRect().toJSON()]));
   const overlap=(a:any,b:any)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
   const pairs:string[]=[];for(let a=0;a<selectors.length;a++)for(let b=a+1;b<selectors.length;b++)if(overlap(boxes[selectors[a]],boxes[selectors[b]])>0)pairs.push(selectors[a]+' / '+selectors[b]);
   const actorHits=selectors.filter(s=>overlap(boxes[s],actor)>0);
   const invalid=selectors.filter(s=>{const b=boxes[s],el=document.querySelector(s)!;return !el.getClientRects().length||getComputedStyle(el).visibility==='hidden'||b.width<=0||b.height<=0||b.left<0||b.top<0||b.right>innerWidth+.01||b.bottom>innerHeight+.01;});
   frames.push({success,boxes,pairs,actorHits,invalid});
  }
  const passThrough:string[]=[];
  for(const s of ['.vitals','.room-label','#build-strip','#run-stock','.weapon-hud','.desktop-hint','#story-status','#room-objective']){
   const r=document.querySelector(s)!.getBoundingClientRect();const hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);if(hit?.id!=='world')passThrough.push(s+' -> '+(hit?.id||hit?.tagName));
  }
  const skip=document.getElementById('skip-story')!,sr=skip.getBoundingClientRect(),story=document.getElementById('story-hud')!.getBoundingClientRect();
  const skipAccessible=document.getElementById('story-presentation')!.hidden||(sr.width>0&&sr.height>0&&sr.left>=story.left&&sr.right<=story.right+.01&&sr.top>=story.top&&sr.bottom<=story.bottom+.01&&document.elementFromPoint((sr.left+sr.right)/2,(sr.top+sr.bottom)/2)===skip);
  return {frames,passThrough,skipAccessible};
 },{x,y});
}
function assertClear(result:Awaited<ReturnType<typeof inspect>>,label:string){
 for(const f of result.frames){expect(f.success,label+' solution').toBe(true);expect(f.pairs,label+' panel overlap').toEqual([]);expect(f.actorHits,label+' marine overlap').toEqual([]);expect(f.invalid,label+' visible/in viewport').toEqual([]);}
 // Require a stable solution on repeated identical calls, not alternate clear positions.
 for(const f of result.frames.slice(1))expect(f.boxes,label+' stable repeated call').toEqual(result.frames[0].boxes);
 expect(result.passThrough,label+' read-only pass-through').toEqual([]);expect(result.skipAccessible,label+' Skip access').toBe(true);
}
it.each(cases)('joint HUD is clear and stable at %ix%i expanded=%s boss=%s',async(width,height,expanded,boss)=>{
 const page=await mount(width,height);
 try{
  // Boss+expanded Room12 copy is a conservative layout stress fixture, not a
  // claim this authored story and boss occur together in campaign gameplay.
  await page.evaluate(({expanded,boss})=>{document.getElementById('story-presentation')!.hidden=!expanded;document.getElementById('boss-hud')!.hidden=!boss;},{expanded,boss});
  for(const[name,x,y]of [['NW',40,60],['N',width/2,60],['NE',width-40,60],['W',40,height/2],['C',width/2,height/2],['E',width-40,height/2],['SW',40,height-60],['S',width/2,height-60],['SE',width-40,height-60]] as const){assertClear(await inspect(page,x,y),`${width}x${height} ${name}`);}
  for(const[id,text]of Object.entries(copy))expect(await page.locator('#'+id).textContent()).toBe(text);
 }finally{await page.close();}
},30000);
it('reflows the same live HUD across desktop resize and dialogue changes',async()=>{
 const page=await mount(1280,900);
 try{
  for(const[width,height]of [...sizes,[1280,900] as const]){
   await page.setViewportSize({width,height});
   for(const expanded of [true,false]){
    await page.evaluate(expanded=>{document.getElementById('story-presentation')!.hidden=!expanded;document.getElementById('boss-hud')!.hidden=false;},expanded);
    assertClear(await inspect(page,width-40,height-60),`${width}x${height} resize expanded=${expanded}`);
   }
  }
 }finally{await page.close();}
},30000);
it('preserves native weapon, Pause and Skip gestures through relocation and keyboard use',async()=>{
 const page=await mount(1280,900);
 try{
  assertClear(await inspect(page,640,450),'initial input layout');
  for(const[selector,action]of [['[data-weapon="rifle"]','rifle'],['#pause','pause'],['#skip-story','skip']] as const){
   const target=page.locator(selector);await target.click();
   expect(await page.evaluate(()=>(window as any).__actions.splice(0))).toEqual([action]);
   const before=(await target.boundingBox())!;await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();
   const outcome=await page.evaluate(({selector,before})=>{const button=document.querySelector(selector)!;const player={left:before.x,right:before.x+before.width,top:before.y,bottom:before.y+before.height};const success=(window as any).__place(player,innerWidth,innerHeight);return {success,after:button.getBoundingClientRect().toJSON()};},{selector,before});
   expect(outcome.success).toBe(true);expect(outcome.after.x!==before.x||outcome.after.y!==before.y).toBe(true);
   await page.mouse.up();expect(await page.evaluate(()=>(window as any).__actions.splice(0))).toEqual([action]);
   await target.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>(window as any).__actions.splice(0))).toEqual([action]);
  }
  // A temporary draggable diagnostic target provokes a genuine browser mouse
  // pointercancel. Production controls remain nondraggable; no touch emulation.
  const rifle=page.locator('[data-weapon="rifle"]');
  await rifle.evaluate(el=>{el.setAttribute('draggable','true');(window as any).__cancelEvents=[];for(const name of ['pointercancel','lostpointercapture'])el.addEventListener(name,e=>(window as any).__cancelEvents.push({type:e.type,trusted:e.isTrusted}));});
  const drag=(await rifle.boundingBox())!;await page.mouse.move(drag.x+drag.width/2,drag.y+drag.height/2);await page.mouse.down();await page.mouse.move(drag.x+drag.width/2+100,drag.y-80,{steps:12});await page.mouse.up();
  expect(await page.evaluate(()=>(window as any).__cancelEvents)).toEqual([{type:'pointercancel',trusted:true},{type:'lostpointercapture',trusted:true}]);
  expect(await page.evaluate(()=>(window as any).__actions.splice(0))).toEqual([]);
  await rifle.evaluate(el=>el.removeAttribute('draggable'));await rifle.click();
  expect(await page.evaluate(()=>(window as any).__actions.splice(0))).toEqual(['rifle']);
  await page.evaluate(()=>document.body.dataset.state='paused');
  for(const selector of ['#pause','#skip-story','[data-weapon="rifle"]'])expect(await page.locator(selector).evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
 }finally{await page.close();}
},30000);
