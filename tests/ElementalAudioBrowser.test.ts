import {afterAll,beforeAll,expect,test} from 'vitest';
import {chromium,type Browser} from 'playwright';
import {createServer,type ViteDevServer} from 'vite';
let server:ViteDevServer,browser:Browser,origin:string;
beforeAll(async()=>{
 server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0},logLevel:'error'});
 await server.listen();origin=`http://127.0.0.1:${(server.httpServer!.address() as {port:number}).port}`;
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});
});
afterAll(async()=>{await browser?.close();await server?.close();});
test('real Web Audio elemental voices obey mute, pause, rate limits, release and destruction',async()=>{
 const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__elemental-audio',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><button id="unlock">Enable audio</button>'}));
 await page.goto(origin+'/__elemental-audio');
 await page.evaluate(async()=>{
  const load=new Function('path','return import(path)');const {AudioSystem}=await load('/src/game/audio/AudioSystem.ts');
  const qa=(window as any).__audioQA={audio:new AudioSystem({master:0,music:0}),ready:false};
  document.getElementById('unlock')!.onclick=()=>{void qa.audio.unlock().then((ok:boolean)=>qa.ready=ok);};
 });
 await page.locator('#unlock').click();await page.waitForFunction(()=>(window as any).__audioQA.ready);
 const muted=await page.evaluate(()=>{
  const a=(window as any).__audioQA.audio;a.pauseMusic();
  for(const k of ['freeze','shatter','reactor']){a.playElemental(k);a.playElemental(k);}
  return {master:a.masterGain.gain.value,voices:a.voices.size,buffers:a.elementalBuffers.size,
   peaks:[...a.elementalBuffers.values()].map((b:any)=>Math.max(...b.getChannelData(0).map(Math.abs)))};
 });
 expect(muted.master).toBe(0);expect(muted.voices).toBe(3);expect(muted.buffers).toBe(3);expect(muted.peaks.every((p:number)=>p>0&&p<.7)).toBe(true);
 await page.evaluate(()=>{const a=(window as any).__audioQA.audio;a.pauseAll();for(const k of ['freeze','shatter','reactor'])a.playElemental(k);});
 expect(await page.evaluate(()=>(window as any).__audioQA.audio.voices.size)).toBe(0);
 await page.waitForTimeout(260);
 await page.evaluate(()=>{const a=(window as any).__audioQA.audio;a.setMasterVolume(.5);a.resumeAll();a.pauseMusic();a.playElemental('reactor');});
 await page.waitForFunction(()=>{const a=(window as any).__audioQA.audio;return a.masterGain.gain.value>.4;});
 expect(await page.evaluate(()=>(window as any).__audioQA.audio.voices.size)).toBe(1);
 await page.waitForFunction(()=>(window as any).__audioQA.audio.voices.size===0);
 const destroyed=await page.evaluate(()=>{
  const a=(window as any).__audioQA.audio;a.playElemental('freeze');const context=a.context;a.destroy();a.playElemental('shatter');
  return {voices:a.voices.size,buffers:a.elementalBuffers.size,contextCleared:a.context===null,closing:context.state};
 });
 expect(destroyed).toMatchObject({voices:0,buffers:0,contextCleared:true});expect(errors).toEqual([]);await page.close();
},30000);
