import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'vite';
import {chromium} from 'playwright';

// Real app entry, controls, simulation and shipping camera. The local-only
// transform adds a read-only snapshot, never sets player/camera/game state.
const out=resolve(process.argv[2]??'artifacts/awakening-opening');
await mkdir(out,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const probe=`\nObject.defineProperty(window,'__openingSnapshot',{get:()=>({
 state:game.status,room:game.node.templateId,player:{x:game.player.x,y:game.player.y},
 boons:[...game.expedition.build.mutations],camera:{zoom:renderer.camera.zoom,
 left:renderer.camera.left,right:renderer.camera.right,top:renderer.camera.top,bottom:renderer.camera.bottom,
 position:renderer.camera.position.toArray(),focus:renderer.focus.toArray()},
 performance:window.__containmentPerformance,webglError:renderer.renderer.getContext().getError()
})});`;
const server=await createServer({server:{host:'127.0.0.1',port:0},plugins:[{name:'opening-read-only-evidence',enforce:'post',transform(code,id){if(id.endsWith('/src/main.ts'))return code+probe;}}]});
let browser;
const results=[];
try{
 await server.listen();
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const [name,viewport,mobile] of [['desktop',{width:1280,height:900},false],['portrait',{width:390,height:844},true]]){
  console.log(`Starting ${name}`);
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
  const page=await context.newPage();page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(()=>document.body.dataset.state==='menu'&&window.__openingSnapshot);
  await page.locator('#start').click();
  await page.waitForFunction(()=>document.body.dataset.state==='reward');
  const before=await page.evaluate(()=>window.__openingSnapshot);
  assert.deepEqual(before.player,{x:230,y:440});assert.equal(before.boons.length,0);
  const card=page.locator('[data-mutation]').first();
  if(mobile)await card.tap();else {await card.focus();await page.keyboard.press('Enter');}
  await page.waitForFunction(()=>document.body.dataset.state==='playing'&&window.__openingSnapshot.performance.drawCalls>0&&document.querySelector('#room-name').textContent==='Awakening Bay');
  const image=resolve(out,`${name}.png`);
  await page.screenshot({path:image});
  const snapshot=await page.evaluate(()=>window.__openingSnapshot);
  assert.equal(snapshot.state,'playing');assert.equal(snapshot.room,'awakening-bay');assert.equal(snapshot.boons.length,1);
  assert.deepEqual(snapshot.player,{x:230,y:440});assert.equal(snapshot.camera.zoom,1);
  assert.equal(snapshot.webglError,0);assert.equal(snapshot.performance.graphicsLost,false);assert.deepEqual(errors,[]);
  results.push({name,viewport,image,before,snapshot,errors});
  await writeFile(resolve(out,'manifest.json'),JSON.stringify({sha,evidenceClass:'Actual app menu -> starting boon -> opening at spawn; shipping camera/auto quality; read-only local diagnostic transform; no movement, staged combat or camera overrides',results},null,2));
  console.log(JSON.stringify(results.at(-1)));await context.close();
 }
 assert.equal(results.length,2);
}finally{await browser?.close();await server.close();}
