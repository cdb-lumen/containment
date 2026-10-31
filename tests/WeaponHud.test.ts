import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,expect,it} from 'vitest';
import {chromium,type Browser} from 'playwright';
import ts from 'typescript';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {weaponHudSide,type ScreenBox} from '../src/WeaponHud';

const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8').replace(/@import[^;]+;/g,'');
const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
const markup=main.slice(main.indexOf('<div class="weapon-hud"'),main.indexOf('<div id="weapon-picker"'));
const script=ts.transpileModule(readFileSync(new URL('../src/WeaponHud.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^export /gm,'')+'\nwindow.__placeWeaponHud=positionWeaponHud; window.__captureWeaponPointer=captureWeaponPointer;';
const intersects=(a:ScreenBox,b:ScreenBox)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});});
afterAll(async()=>{await browser?.close();});
async function mount(width:number,height:number){
 const page=await browser.newPage({viewport:{width,height}});
 await page.setContent(`<style>${css}</style><div id="app"><div id="hud">${markup}</div></div>`);
 await page.addScriptTag({content:script});
 await page.evaluate(()=>{document.getElementById('weapon-name')!.textContent='RIFLE';document.getElementById('magazine')!.textContent='17';document.getElementById('reserve')!.textContent='/ 20';});
 return page;
}
it('clears the marine in the recorded Room15 frame500 camera without changing the camera',async()=>{
 // Source8c9f8c5 native capture: the marine was behind the ammo panel at this pose.
 const camera=new T.OrthographicCamera(-22*1280/900/2,22*1280/900/2,11,-11,.1,120);
 camera.position.set(22.555555555555554,26,33.575871994669704);
 camera.quaternion.set(-.4527600968822728,0,0,.8916323764148287);camera.updateMatrixWorld(true);
 const root=new T.Group();root.position.set(1173.963838901654/32,0,771.1201346227588/32);
 const renderer=Object.assign(Object.create(DepthRenderer.prototype),{camera,player:{root,height:2.2},canvas:{getBoundingClientRect:()=>({left:0,top:0,width:1280,height:900})}}) as DepthRenderer;
 const player=renderer.playerScreenBounds(16),matrix=camera.projectionMatrix.toArray(),page=await mount(1280,900);
 try{
  const before=await page.locator('.weapon-hud').evaluate(el=>el.getBoundingClientRect().toJSON());expect(intersects(before,player)).toBe(true);
  await page.evaluate(player=>(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),player,innerWidth),player);
  const after=await page.locator('.weapon-hud').evaluate(el=>el.getBoundingClientRect().toJSON());expect(intersects(after,player)).toBe(false);
  expect(after.left).toBeGreaterThanOrEqual(0);expect(after.right).toBeLessThan(640);expect(camera.projectionMatrix.toArray()).toEqual(matrix);
  expect(await page.locator('#magazine').innerText()).toBe('17');expect(await page.locator('#reserve').innerText()).toBe('/ 20');
 }finally{await page.close();}
});
it.each([[600,600],[960,540],[1280,900],[1920,1080]])('keeps ammo on screen and away from the marine at desktop %ix%i',async(width,height)=>{
 const page=await mount(width,height);
 try{
  const normal=await page.locator('.weapon-hud').evaluate(el=>el.getBoundingClientRect().toJSON());
  const player={left:normal.left+5,right:normal.right-5,top:normal.top,bottom:normal.bottom};
  await page.evaluate(player=>(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),player,innerWidth),player);
  const left=await page.locator('.weapon-hud').evaluate(el=>el.getBoundingClientRect().toJSON());
  expect(intersects(left,player)).toBe(false);expect(left.left).toBeGreaterThanOrEqual(0);expect(left.right).toBeLessThanOrEqual(width);expect(left.top).toBeGreaterThanOrEqual(0);expect(left.bottom).toBeLessThanOrEqual(height);
  await page.evaluate(player=>(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),player,innerWidth),left);
  const restored=await page.locator('.weapon-hud').evaluate(el=>el.getBoundingClientRect().toJSON());expect(restored).toEqual(normal);
 }finally{await page.close();}
});
it('holds the alternate side through the edge margin rather than flickering',()=>{
 const panel={left:1100,right:1250,top:700,bottom:800},near={left:1060,right:1090,top:710,bottom:760};
 expect(weaponHudSide(panel,near,1280,'right')).toBe('left');
 expect(weaponHudSide(panel,{...near,left:1040,right:1065},1280,'left')).toBe('left');
 expect(weaponHudSide(panel,{left:600,right:650,top:400,bottom:450},1280,'left')).toBe('right');
});
it('recalculates an already relocated panel after a desktop window resize',async()=>{
 const page=await mount(1280,900);
 try{
  const panel=page.locator('.weapon-hud');
  const original=await panel.evaluate(el=>el.getBoundingClientRect().toJSON());
  await page.evaluate(player=>(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),player,innerWidth),original);
  expect(await panel.getAttribute('data-side')).toBe('left');
  await page.setViewportSize({width:600,height:600});
  const resized=await panel.evaluate(el=>el.getBoundingClientRect().toJSON());
  await page.evaluate(player=>(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),player,innerWidth),resized);
  const final=await panel.evaluate(el=>el.getBoundingClientRect().toJSON());
  expect(await panel.getAttribute('data-side')).toBe('right');expect(intersects(final,resized)).toBe(false);
  expect(final.left).toBeGreaterThanOrEqual(0);expect(final.right).toBeLessThanOrEqual(600);expect(final.bottom).toBeLessThanOrEqual(600);
 }finally{await page.close();}
});

it('clears all lower controls at the recorded armory frame746 and mirrored/narrow desktop poses',async()=>{
 const controls=main.slice(main.indexOf('<div id="weapon-picker"'),main.indexOf('<div id="room-loading"')).replace(/\$\{\(\['pistol'[\s\S]*?join\(''\)\}/, ['pistol','rifle','shotgun','plasma','rocket'].map((id,i)=>`<button data-weapon="${id}" aria-label="Equip ${id}"><small>${i+1}</small><span>${id}</span></button>`).join(''));
 for(const [width,height] of [[1280,900],[960,540],[600,600]]){
  const page=await mount(width,height);
  try{
   await page.locator('#hud').evaluate((el,html)=>el.insertAdjacentHTML('beforeend',html),controls);
   for(const player of [{left:width-73.7337876049503,top:height-145.886189163229,right:width-32.8246966958593,bottom:height-63.3756156464713},{left:33,top:height-146,right:74,bottom:height-63},{left:width/2-21,top:height-80,right:width/2+21,bottom:height-5}]){
    await page.evaluate(player=>{(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),player,innerWidth);},player);
    for(const selector of ['.weapon-hud','#weapon-picker','.desktop-hint']){
     const box=await page.locator(selector).evaluate(el=>el.getBoundingClientRect().toJSON());
     expect(intersects(box,player),`${width} ${selector}`).toBe(false);
     expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);
     expect(box.top).toBeGreaterThanOrEqual(0);expect(box.bottom).toBeLessThanOrEqual(height);
    }
   }
   expect(await page.locator('[data-weapon]').count()).toBe(5);
   await page.evaluate(()=>{document.body.dataset.state='playing';document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(button=>{(window as any).__captureWeaponPointer(button);button.addEventListener('click',()=>{document.body.dataset.equipped=button.dataset.weapon;});});});
   const rifle=page.getByRole('button',{name:'Equip rifle',exact:true});
   const target=await rifle.boundingBox();expect(target).not.toBeNull();
   await page.mouse.move(target!.x+target!.width/2,target!.y+target!.height/2);
   await page.mouse.down();
   await page.evaluate(()=>{const picker=document.getElementById('weapon-picker')!;const box=picker.getBoundingClientRect();(window as any).__placeWeaponHud(document.querySelector('.weapon-hud'),box,innerWidth);});
   const moved=await rifle.boundingBox();expect(moved!.x).not.toBe(target!.x);
   await page.mouse.up();
   expect(await page.locator('body').getAttribute('data-equipped')).toBe('rifle');
   await page.getByRole('button',{name:'Equip shotgun',exact:true}).focus();
   await page.keyboard.press('Enter');
   expect(await page.locator('body').getAttribute('data-equipped')).toBe('shotgun');
   await page.evaluate(()=>{document.body.dataset.state='paused';});
   expect(await page.getByRole('button',{name:'Equip rifle',exact:true}).evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
  }finally{await page.close();}
 }
});
