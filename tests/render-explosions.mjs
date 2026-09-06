// Real in-game WebGL still QA. Run from the repository root.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {createServer as createNetServer} from 'node:net';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const socket=createNetServer();await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
const server=await createServer({base:'/',server:{port,strictPort:true,host:'127.0.0.1'}});await server.listen();
const browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
 await page.addInitScript(()=>{let seed=42;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>{if(!window.gate)cb(t);});});
 await page.route('**/src/main.ts*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text())+'\nwindow.demo={game,renderer};'});});
 await page.goto(`http://127.0.0.1:${port}`);
 await page.waitForFunction(()=>window.demo&&document.querySelector('#start'));
 // The menu is repainted each frame: dispatch once after readiness rather than retrying a detached locator.
 await page.evaluate(()=>{window.gate=true;document.querySelector('#start').click();});
 await page.waitForFunction(()=>window.demo.game.status==='playing');
 await page.waitForFunction(()=>window.demo.renderer.effects.textures.every(t=>t.image?.complete));
 await mkdir('docs/pr-screenshots',{recursive:true});
 const samples=[];
 for(const [name,age] of [['baseline',0],['flash',.025],['ignition',.12],['fireball',.3],['smoke',.75],['debris',1.5]]){
  const result=await page.evaluate(({age})=>{const {game:g,renderer:r}=window.demo;r.render(g,.001,false);const fx=r.effects;fx.clear();if(age){r.effect({type:'explosion',x:g.player.x+100,y:g.player.y+45,radius:100});for(let t=0;t<age;t+=1/120)fx.update(Math.min(1/120,age-t),r.camera,[]);}r.render(g,.000001,false);return {age,counts:fx.counts};},{age});
  samples.push(result);await page.screenshot({path:`docs/pr-screenshots/explosion-${name}.png`});
 }
 assert.equal(samples[1].counts.fire,1);assert.equal(samples[1].counts.debris,9);assert.equal(samples[4].counts.fire,0);assert.equal(samples[4].counts.smoke,5);assert.equal(samples[5].counts.smoke,0);
 await page.evaluate(()=>{const {game:g,renderer:r}=window.demo;r.effects.clear();r.effect({type:'hit',x:g.player.x+100,y:g.player.y+45,angle:0,weapon:'pistol'});r.render(g,.08,false);});
 await page.screenshot({path:'docs/pr-screenshots/explosion-impact.png'});
 assert.deepEqual(errors,[]);await writeFile('docs/pr-screenshots/explosion-qa.json',JSON.stringify({port,samples,errors},null,2));console.log(JSON.stringify({port,samples,errors}));
}finally{await browser.close();await server.close();}
