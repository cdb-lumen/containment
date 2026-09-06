import assert from 'node:assert/strict';
import {createServer as httpServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createServer as viteServer} from 'vite';
import {chromium} from 'playwright';
const option=(name,fallback)=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const ids=option('rooms','passenger-vault,breached-loading-bay,overload-floor').split(',');
const selectedViewport=option('viewport','desktop');
assert(['phone','desktop'].includes(selectedViewport),'--viewport must be phone or desktop');
const mobile=selectedViewport==='phone',viewport=mobile?{width:390,height:844}:{width:1280,height:900};
const out=resolve(option('out','docs/pr-screenshots/authored/hud-'+(mobile?'phone':'desktop')));
const prefix='/containment/',root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
let ssr,server,browser;const results=[];
try{
 ssr=await viteServer({configFile:false,server:{middlewareMode:true},logLevel:'error'});
 const {generateRun}=await ssr.ssrLoadModule('/src/game/roguelike/run.ts');
 const {serializeCheckpoint,CHECKPOINT_STORAGE_KEY}=await ssr.ssrLoadModule('/src/game/roguelike/checkpoints.ts');
 const {CombatSystem}=await ssr.ssrLoadModule('/src/game/combat/CombatSystem.ts');
 const {ROOM_TEMPLATES}=await ssr.ssrLoadModule('/src/game/roguelike/roomTemplates.ts');
 const nodes=generateRun(1729,3).nodes;
 server=httpServer(async(req,res)=>{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,path.slice(prefix.length)||'index.html');if(!path.startsWith(prefix)||!file.startsWith(root+'/')){res.writeHead(404).end();return;}try{res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});await mkdir(out,{recursive:true});
 for(const id of ids){
  const index=nodes.findIndex(n=>n.templateId===id);assert.ok(index>=0);const previous=nodes[index-1],resources=new CombatSystem().getRunResources();
  const checkpoint=index===0?null:serializeCheckpoint({version:1,savedAt:0,run:{version:3,seed:1729,currentNodeId:previous.id,completedNodeIds:nodes.slice(0,index).map(n=>n.id),phase:'route'},build:{mutations:[]},resources});if(index>0)assert.ok(checkpoint);
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});const page=await context.newPage();page.setDefaultTimeout(120000);const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('requestfailed',r=>{if(r.url().startsWith(origin))errors.push(`${r.url()} ${r.failure()?.errorText}`);});
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css',body:''}));
  if(checkpoint)await context.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:CHECKPOINT_STORAGE_KEY,value:checkpoint});
  try{
   await page.goto(origin+prefix);await page.waitForFunction(()=>document.body.dataset.state==='menu');
   if(index===0){
    await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.state==='reward');
    assert.equal(await page.locator('[data-mutation]').count(),3);
    assert.equal(await page.locator('#reroll').isDisabled(),true);
    const card=page.locator('[data-mutation]').first();if(mobile)await card.tap();else await card.click();
   }else{
    await page.locator('#continue').click();await page.waitForFunction(()=>document.body.dataset.state==='route');
    if(id==='overload-floor'){assert.match(await page.locator('.panel-intro').innerText(),/kill them and you/);await page.locator('#destroy-ship').click();}else await page.locator(`[data-route="${nodes[index].id}"]`).click();
   }
   await page.waitForFunction(name=>document.body.dataset.state==='playing'&&document.querySelector('#room-name')?.textContent===name,ROOM_TEMPLATES[id].name);
   await page.locator('#pause').click();await page.waitForFunction(()=>document.body.dataset.state==='paused');await page.locator('#quality').selectOption('low');await page.locator('#resume').click();
   if(await page.locator('#skip-story').isVisible())await page.locator('#skip-story').click();
   const ammo=await page.locator('#magazine').textContent();
   if(mobile){const box=await page.locator('#fire').boundingBox();assert.ok(box);const touch=await context.newCDPSession(page);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await page.waitForFunction(before=>document.querySelector('#magazine').textContent!==before,ammo);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}
   else{await page.keyboard.down('d');await page.keyboard.down('Space');await page.waitForFunction(before=>document.querySelector('#magazine').textContent!==before,ammo);await page.keyboard.up('Space');await page.keyboard.up('d');}
   await page.waitForFunction(()=>window.__containmentPerformance.drawCalls>0&&!window.__containmentPerformance.graphicsLost);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
   const file=`${id}-${mobile?'phone':'desktop'}-hud.png`,bytes=await page.screenshot({path:resolve(out,file)});
   results.push({id,file,viewport,quality:'low',state:await page.evaluate(()=>document.body.dataset.state),room:await page.locator('#room-name').textContent(),input:mobile?'real touch fire':'real keyboard move/fire',explicitFatalAuthorization:id==='overload-floor',errors,sha256:createHash('sha256').update(bytes).digest('hex')});
   await writeFile(resolve(out,'manifest.json'),JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),evidence:'Built production app, seeded validated prior-room checkpoint, real Continue/route/authorization/fire/pause/resume. Short interaction smoke, not full playthrough or balance proof.',results},null,2)+'\n');console.log(JSON.stringify(results.at(-1)));
  }finally{await context.close();}
 }
 assert.equal(results.length,ids.length);
}finally{await browser?.close();await ssr?.close();if(server)await new Promise(r=>server.close(r));}
