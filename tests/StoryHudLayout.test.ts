import {readFileSync} from 'node:fs';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {chromium, type Browser, type Page} from 'playwright';

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
beforeAll(async()=>{browser=await chromium.launch({args:['--no-sandbox','--disable-gpu','--disable-webgl']});});
afterAll(async()=>{await browser?.close();});
async function mount(width:number,height=844){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<701});
  await page.setContent(`<style>${css}</style><div id="app">${markup}</div>`);
  await page.evaluate(copy=>{
    document.body.dataset.state='playing';
    for(const id of ['hud','story-hud']) document.getElementById(id)!.hidden=false;
    const values={...copy,health:'100',armor:'50','depth-label':'SECURITY · 05 / 20','room-name':'Crew checkpoint',credits:'0 CR','encounter-count':'15 remaining','build-strip':'Kinetic 1', 'weapon-name':'SHOTGUN',magazine:'08',reserve:'/ 21'};
    for(const [id,text] of Object.entries(values)) document.getElementById(id)!.textContent=text;
  },copy);
  return page;
}
async function rect(page:Page,selector:string){return page.locator(selector).evaluate(el=>el.getBoundingClientRect().toJSON());}
for(const width of [390,375]) test(`phone ${width}: expanded story clears the north actor and HUD readouts`,async()=>{
  const page=await mount(width);
  try{
    const panel=await rect(page,'#story-hud');
    // Recorded 390x844 shipping camera at player 650,150 projects a 2-unit
    // actor head to y=190.66. Reserve a 4px gap, also at the narrower width.
    expect(panel.bottom,'story backplate must clear the north actor head').toBeLessThanOrEqual(185);
    for(const selector of ['.vitals','.room-label','#build-strip','#run-stock']){
      const neighbor=await rect(page,selector);
      expect(neighbor.bottom+(selector==='#build-strip'?0:6)).toBeLessThanOrEqual(panel.top);
    }
    const skip=await rect(page,'#skip-story');
    expect(skip.width).toBeGreaterThanOrEqual(44);
    expect(skip.height).toBeGreaterThanOrEqual(44);
    for(const [id,text] of Object.entries(copy)){
      expect(await page.locator(`#${id}`).innerText()).toBe(text);
      const textBox=await page.locator(`#${id}`).evaluate(el=>{
        const range=document.createRange();range.selectNodeContents(el);
        return {rect:range.getBoundingClientRect().toJSON(),style:getComputedStyle(el).fontSize,overflow:el.scrollWidth>el.clientWidth};
      });
      expect(textBox.rect.left).toBeGreaterThanOrEqual(panel.left);
      expect(textBox.rect.right).toBeLessThanOrEqual(skip.left-4);
      expect(textBox.rect.bottom).toBeLessThanOrEqual(panel.bottom);
      expect(textBox.overflow).toBe(false);
      expect(parseFloat(textBox.style)).toBeGreaterThanOrEqual(id==='story-status'?10:11);
    }
    await page.locator('#skip-story').click({timeout:1500});
    // main.ts owns dismissal; its hidden presentation must still remove both children.
    await page.locator('#story-presentation').evaluate(el=>{(el as HTMLElement).hidden=true;});
    expect(await page.locator('#skip-story').isVisible()).toBe(false);
    expect(await page.locator('#story-line').isVisible()).toBe(false);
    expect(await page.locator('#room-objective').isVisible()).toBe(true);
  }finally{await page.close();}
});
test('long phone dialogue wraps without clipping or covering Skip',async()=>{
  const page=await mount(375);
  try{
    const long='LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward.';
    await page.locator('#story-line').evaluate((el,text)=>{el.textContent=text;},long);
    const panel=await rect(page,'#story-hud');
    const line=await rect(page,'#story-line');
    const skip=await rect(page,'#skip-story');
    expect(await page.locator('#story-line').innerText()).toBe(long);
    expect(line.height).toBeGreaterThan(30);
    expect(line.right).toBeLessThanOrEqual(skip.left-8);
    expect(line.bottom).toBeLessThan(panel.bottom);
    expect(skip.bottom).toBeLessThan(panel.bottom);
    expect(await page.locator('#story-line').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(375);
  }finally{await page.close();}
});
test('desktop story geometry is unchanged',async()=>{
  const page=await mount(1280,900);
  try{
    const box=await rect(page,'#story-hud');
    expect(box.x).toBe(24);expect(box.y).toBe(142);expect(box.width).toBe(360);
    expect(box.height).toBeCloseTo(108.796875,3);
    expect(await page.locator('#story-presentation').evaluate(el=>getComputedStyle(el).display)).toBe('flex');
  }finally{await page.close();}
});
