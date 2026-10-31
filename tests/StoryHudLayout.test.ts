import {readFileSync} from 'node:fs';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {chromium, type Browser, type Page} from 'playwright';
import {positionStatusHud,positionVitalsHud} from '../src/StatusHud';

// CPU-only DOM regression. This does not render the game or prove actor visibility.
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8').replace(/@import[^;]+;/g,'');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const markup=main.slice(main.indexOf('<div id="hud"'),main.indexOf('<div id="weapon-picker"')).replace("${icon('pause')}",'Ⅱ')+'</div>';
const copy={
  'story-status':'Passengers alive · AI promises survival',
  'room-objective':'Break through the fortified checkpoint.',
  'story-line':'The crew held this line. Their weapons remain.',
};
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});});
afterAll(async()=>{await browser?.close();});
async function mount(width:number,height=900){
  const page=await browser.newPage({viewport:{width,height}});
  await page.setContent(`<style>${css}</style><canvas id="world"></canvas><div id="app">${markup}</div>`);
  await page.evaluate(copy=>{
    document.body.dataset.state='playing';
    for(const id of ['hud','story-hud']) document.getElementById(id)!.hidden=false;
    const values={...copy,health:'100',armor:'50','depth-label':'SECURITY · 05 / 20','room-name':'Crew checkpoint',credits:'0 CR','encounter-count':'15 remaining','build-strip':'Kinetic 1', 'weapon-name':'SHOTGUN',magazine:'08',reserve:'/ 21'};
    for(const [id,text] of Object.entries(values)) document.getElementById(id)!.textContent=text;
  },copy);
  await page.addScriptTag({content:`window.positionStatusHud=${positionStatusHud.toString()};window.positionVitalsHud=${positionVitalsHud.toString()}`});
  return page;
}
async function rect(page:Page,selector:string){return page.locator(selector).evaluate(el=>el.getBoundingClientRect().toJSON());}

const witness={left:86.05780838287984,top:118.83017102549077,right:126.96689929197085,bottom:201.34074454224842};
const overlaps=(a:typeof witness,b:typeof witness)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
async function position(page:Page,box= witness){
 await page.evaluate(box=>{(window as any).positionStatusHud(document.getElementById('status-hud'),box,innerWidth);},box);
}
test('moves the status column clear of recorded Room6 frame199 and preserves Skip access',async()=>{
 const page=await mount(1280);
 try{
  // This exact native marine rectangle intersected the previous fixed-left panel.
  expect(overlaps(await rect(page,'#story-hud'),witness)).toBe(true);
  await position(page);
  for(const id of ['status-hud','story-hud','run-stock','build-strip'])expect(overlaps(await rect(page,'#'+id),witness)).toBe(false);
  expect(await page.locator('#status-hud').getAttribute('data-side')).toBe('right');
  await page.evaluate(()=>{document.getElementById('skip-story')!.addEventListener('click',()=>document.body.dataset.skipped='yes');});
  await page.locator('#skip-story').focus();
  await page.keyboard.press('Enter');
  expect(await page.locator('body').getAttribute('data-skipped')).toBe('yes');
  await page.evaluate(()=>delete document.body.dataset.skipped);
  await page.locator('#skip-story').click();
  expect(await page.locator('body').getAttribute('data-skipped')).toBe('yes');
  // Move the marine to the opposite side and keep focus on the same DOM control.
  await position(page,{...witness,left:1280-witness.right,right:1280-witness.left});
  expect(await page.locator('#status-hud').getAttribute('data-side')).toBe('left');
  expect(await page.locator('#skip-story').evaluate(el=>el===document.activeElement)).toBe(true);
 }finally{await page.close();}
});
test('uses hysteresis and responds to resized desktop windows without overlapping status rows',async()=>{
 const page=await mount(1280);
 try{
  await position(page);
  await position(page,{...witness,left:420,right:460});
  expect(await page.locator('#status-hud').getAttribute('data-side')).toBe('right');
  await position(page,{...witness,left:480,right:520});
  expect(await page.locator('#status-hud').getAttribute('data-side')).toBe('left');
  for(const [width,height] of [[1280,900],[640,900],[960,480]]){
   await page.setViewportSize({width,height});
   await page.locator('#desktop-stock').evaluate(el=>el.textContent='E 3 medkits · G 4 grenades');
   await position(page,{left:40,right:80,top:120,bottom:200});
   const build=await rect(page,'#build-strip'),stock=await rect(page,'#run-stock'),story=await rect(page,'#story-hud');
   expect(build.bottom).toBeLessThanOrEqual(stock.top);
   expect(stock.bottom).toBeLessThanOrEqual(story.top);
   expect(story.left).toBeGreaterThanOrEqual(0);expect(story.right).toBeLessThanOrEqual(width);
   expect(story.bottom).toBeLessThan(height-76);
   await page.locator('#skip-story').click();
   await page.locator('#story-presentation').evaluate(el=>(el as HTMLElement).hidden=true);
   await position(page,{left:40,right:80,top:120,bottom:200});
   expect(overlaps(await rect(page,'#status-hud'),{left:40,right:80,top:120,bottom:200})).toBe(false);
   await page.locator('#story-presentation').evaluate(el=>(el as HTMLElement).hidden=false);
  }
 }finally{await page.close();}
});

test('status copy preserves canvas mouse aim and fire while Skip remains clickable',async()=>{
 const page=await mount(1280);
 try{
  await position(page);
  await page.evaluate(()=>{
   const canvas=document.getElementById('world')!;
   canvas.addEventListener('mousemove',()=>document.body.dataset.aimed='yes');
   canvas.addEventListener('mousedown',()=>document.body.dataset.fired='yes');
  });
  for(const selector of ['#story-status','#room-objective','#story-line','.room-label']){
   const box=await rect(page,selector);
   await page.mouse.click(box.x+2,box.y+2);
   expect(await page.locator('body').getAttribute('data-aimed')).toBe('yes');
   expect(await page.locator('body').getAttribute('data-fired')).toBe('yes');
   await page.evaluate(()=>{delete document.body.dataset.aimed;delete document.body.dataset.fired;});
  }
 }finally{await page.close();}
});

test('moves vitals clear of Room12 frame495 and restores them safely as the marine moves',async()=>{
 const page=await mount(1280);
 const body={left:136.76889616257478,right:177.6779870716657,top:32.91517519581806,bottom:115.42574871257571};
 const place=async(box:typeof body)=>page.evaluate(box=>(window as any).positionVitalsHud(document.querySelector('.vitals'),box,innerHeight),box);
 try{
  expect(overlaps(await rect(page,'.vitals'),body)).toBe(true);
  await place(body);
  expect(await page.locator('.vitals').getAttribute('data-anchor')).toBe('bottom');
  expect(overlaps(await rect(page,'.vitals'),body)).toBe(false);
  expect(await page.locator('#health').textContent()).toBe('100');
  expect(await page.locator('#armor').textContent()).toBe('50');
  // Keep the alternative placement through its hysteresis band.
  await place({...body,top:100,bottom:180});
  expect(await page.locator('.vitals').getAttribute('data-anchor')).toBe('bottom');
  await place({...body,top:160,bottom:240});
  expect(await page.locator('.vitals').getAttribute('data-anchor')).toBe('top');
  for(const [width,height] of [[1280,900],[640,900],[960,480]]){
   await page.setViewportSize({width,height});await place(body);
   const vital=await rect(page,'.vitals');
   expect(overlaps(vital,body)).toBe(false);expect(vital.left).toBeGreaterThanOrEqual(0);expect(vital.right).toBeLessThan(width);expect(vital.bottom).toBeLessThan(height-76);
   await page.evaluate(()=>{document.getElementById('world')!.addEventListener('mousedown',()=>document.body.dataset.fired='yes');});
   await page.mouse.click(vital.left+10,vital.top+10);
   expect(await page.locator('body').getAttribute('data-fired')).toBe('yes');
   await place({left:vital.left,right:vital.right,top:vital.top,bottom:vital.bottom});
   expect(await page.locator('.vitals').getAttribute('data-anchor')).toBe('top');
  }
 }finally{await page.close();}
});

test('keeps the room heading and Pause clear of the recorded north-east marine',async()=>{
 const page=await mount(1280);
 try{
  await page.locator('#room-name').evaluate(el=>el.textContent='Safety-interlock station');
  await page.locator('#depth-label').evaluate(el=>el.textContent='ENGINEERING · 12 / 20');
  const body={left:1018.6609690645946,top:49.77284403710499,right:1059.5700599736856,bottom:132.2834175538627};
  await position(page,body);
  expect(overlaps(await rect(page,'.room-label'),body)).toBe(false);
  await page.evaluate(()=>document.getElementById('pause')!.addEventListener('click',()=>document.body.dataset.paused='yes'));
  for(const pose of [body,{left:1200,top:25,right:1250,bottom:108}]){
   await position(page,pose);
   for(const selector of ['.room-label','#pause'])expect(overlaps(await rect(page,selector),pose)).toBe(false);
   await page.locator('#pause').click();expect(await page.locator('body').getAttribute('data-paused')).toBe('yes');
   await page.evaluate(()=>delete document.body.dataset.paused);await page.locator('#pause').focus();await page.keyboard.press('Enter');
   expect(await page.locator('body').getAttribute('data-paused')).toBe('yes');await page.evaluate(()=>delete document.body.dataset.paused);
  }
  for(const [width,height] of [[640,900],[960,480]]){
   await page.setViewportSize({width,height});await position(page,{left:width-90,right:width-50,top:30,bottom:115});
   const heading=await rect(page,'.room-label'),pause=await rect(page,'#pause'),build=await rect(page,'#build-strip');
   expect(heading.right).toBeLessThanOrEqual(pause.left);expect(Math.max(heading.bottom,pause.bottom)).toBeLessThanOrEqual(build.top);
   expect(await page.locator('#room-name').textContent()).toBe('Safety-interlock station');await page.locator('#pause').click();
  }
 }finally{await page.close();}
});
