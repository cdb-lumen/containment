import assert from 'node:assert/strict';
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve(process.argv[2]);await mkdir(out,{recursive:true});
const probe=`\nObject.defineProperty(window,'__safeLoading',{get:()=>({state:game.status,loading:renderer.roomLoading,recovering:roomRecovering,bank:renderer.sealedBank?.state,berth:renderer.releasedBerth?.state,player:{...game.player},combat:game.combat.snapshot,enemies:game.enemies.snapshot,shots:game.bullets.length,elapsed:game.elapsed,remaining:game.encounterRemaining,boons:[...game.expedition.build.mutations],story:game.storyPresentation,drawCalls:renderer.renderer.info.render.calls})});`;
const outDir=resolve(out,'build');await build({build:{outDir,emptyOutDir:true},plugins:[{name:'safe-loading-read-only',enforce:'pre',transform(code,id){if(id.endsWith('/src/main.ts'))return code+probe;}}]});
const server=await preview({build:{outDir},preview:{host:'127.0.0.1',port:0}});let browser;const results=[];
try{
 browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});
 for(const mode of ['ready','fallback']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();page.setDefaultTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  let hold=false;const held=[];await page.route('**/*.glb',r=>{if(hold&&r.request().url().includes('/awakening/'))held.push(r);else return r.continue();});
  await page.goto(server.resolvedUrls.local[0]);await page.waitForFunction(()=>window.__safeLoading&&document.body.dataset.state==='menu');hold=true;
  await page.locator('#start').tap();await page.waitForFunction(()=>document.body.dataset.state==='reward');
  assert.equal((await page.evaluate(()=>window.__safeLoading)).boons.length,0);
  await page.locator('[data-mutation]').first().tap();await page.waitForFunction(()=>window.__safeLoading.loading&&window.__safeLoading.state==='playing');
  const before=await page.evaluate(()=>window.__safeLoading);assert.equal(before.boons.length,1);assert.ok(before.story);assert.equal(before.elapsed,0);
  await page.keyboard.down('d');await page.keyboard.down(' ');await page.keyboard.press('g');await page.keyboard.press('r');await page.keyboard.press('1');
  await page.locator('#fire').tap();
  await page.screenshot({path:resolve(out,`${mode}-loading.png`)});
  const pending=await page.evaluate(()=>window.__safeLoading);for(const key of ['player','combat','enemies','shots','elapsed','remaining'])assert.deepEqual(pending[key],before[key],key);
  assert.equal(await page.locator('#room-loading').isVisible(),true);
  // Pause remains usable, and completion cannot silently unpause.
  await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>window.__safeLoading)).state,'paused');
  if(mode==='ready'){hold=false;await Promise.all(held.splice(0).map(r=>r.continue()));}
  await page.waitForFunction(()=>!window.__safeLoading.loading&&!window.__safeLoading.recovering);
  const settled=await page.evaluate(()=>window.__safeLoading);assert.equal(settled.state,'paused');assert.equal(settled.elapsed,0);assert.equal(settled.bank,'ready');assert.equal(settled.berth,mode);
  await page.keyboard.up('d');await page.keyboard.up(' ');await page.locator('#resume').tap();
  await page.waitForFunction(()=>window.__safeLoading.elapsed>0);const resumed=await page.evaluate(()=>window.__safeLoading);assert.equal(resumed.player.x,230);assert.equal(resumed.shots,0);assert.ok(resumed.elapsed<1);assert.ok(resumed.drawCalls>0);
  await page.keyboard.press('Escape');await page.screenshot({path:resolve(out,`${mode}-recovered.png`)});
  assert.deepEqual(errors,[]);results.push({mode,before,pending,settled,resumed,errors});await writeFile(resolve(out,'manifest.json'),JSON.stringify({results},null,2));console.log('PASS',mode);await context.close();
 }
}finally{await browser?.close();await new Promise(r=>server.httpServer.close(r));}
