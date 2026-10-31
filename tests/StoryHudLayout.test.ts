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
beforeAll(async()=>{browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});});
afterAll(async()=>{await browser?.close();});
async function mount(width:number,height=900){
  const page=await browser.newPage({viewport:{width,height}});
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
test('desktop story geometry is unchanged',async()=>{
  const page=await mount(1280,900);
  try{
    const box=await rect(page,'#story-hud');
    expect(box.x).toBe(24);expect(box.y).toBe(142);expect(box.width).toBe(360);
    expect(box.height).toBeCloseTo(108.796875,3);
    expect(await page.locator('#story-presentation').evaluate(el=>getComputedStyle(el).display)).toBe('flex');
  }finally{await page.close();}
});
