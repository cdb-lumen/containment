import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'vite';
import {chromium} from 'playwright';

// Response-only inspection seam. No diagnostics or capture controls enter the shipped app.
const output=resolve(process.env.SPREAD_ARTIFACTS || '/home/chernodubv/artifacts/containment-weapon-spread');
await mkdir(output,{recursive:true});
const server=await createServer({root:process.cwd(),configFile:resolve('vite.config.ts'),server:{host:'127.0.0.1',port:0,hmr:false}});
let browser,encoder;
const errors=[],frames=[],shots=[];
try {
  await server.listen();
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,args:['--no-sandbox','--enable-unsafe-swiftshader'],timeout:60000});
  const page=await browser.newPage({viewport:{width:960,height:600},deviceScaleFactor:1});page.setDefaultTimeout(120000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('**/src/main.ts',async route=>{
    const response=await route.fetch();let body=await response.text();
    body=body.replace('requestAnimationFrame(frame);','if (!window.__spreadManual) requestAnimationFrame(frame);');
    body+=`\nwindow.__spreadDemo={game,renderer,input,hud,syncScreen,step(dt,fire){game.update(dt*1000,{x:0,y:0,fire,angle:0,autoAim:false});if(lastRoom!==game.roomRevision){renderer.loadRoom(game.node);lastRoom=game.roomRevision;}renderer.render(game,dt,false);hud();syncScreen();}};`;
    await route.fulfill({response,body});
  });
  await page.goto(server.resolvedUrls.local[0]);await page.waitForFunction(()=>window.__spreadDemo && document.body.dataset.state==='menu');
  await page.locator('#start').click();await page.locator('[data-mutation]').first().click();
  await page.waitForFunction(()=>document.body.dataset.state==='playing');
  const setup=await page.evaluate(()=>{
    window.__spreadManual=true;
    const d=window.__spreadDemo;d.game.newRun(1729);
    // An empty starting room is a controlled live-fire demonstration, not a fake render.
    d.game.status='playing';d.game.switchWeapon('rifle');d.game.skipStory();
    d.renderer.setQuality('low');d.step(0,false);
    const label=document.createElement('div');label.id='demo-caption';Object.assign(label.style,{position:'fixed',left:'50%',top:'105px',transform:'translateX(-50%)',padding:'8px 16px',background:'#071414e8',color:'#f1f5ec',font:'600 18px sans-serif',zIndex:'100',whiteSpace:'nowrap',border:'1px solid #86bfa4'});document.body.append(label);
    const original=d.game.combat.fire.bind(d.game.combat);window.__spreadShots=[];
    d.game.combat.fire=(aim)=>{const result=original(aim);if(result.length)window.__spreadShots.push({frame:window.__spreadFrame,aim,bloom:d.game.combat.snapshot.bloomRadians,angles:result.map(p=>p.angle),weapon:result[0].weaponId});return result;};
    return {node:d.game.node.id,player:d.game.player,quality:d.renderer.qualityTier};
  });
  await page.screenshot({path:resolve(output,'setup.png')});console.log('SETUP',JSON.stringify(setup));
  const fps=20,total=160;
  encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',resolve(output,'weapon-spread.mp4')],{stdio:['pipe','inherit','inherit']});
  encoder.stdin.on('error',()=>{});
  for(let frame=0;frame<total;frame++){
    const state=await page.evaluate(({frame,fps})=>{
      const d=window.__spreadDemo;window.__spreadFrame=frame;
      let caption,fire=false;
      if(frame<12){caption='RIFLE  /  tight opening';fire=true;}
      else if(frame<56){caption='RIFLE  /  small, capped sustained spread';fire=true;}
      else if(frame<76){caption='RELEASE  /  accurate again in 350 ms';}
      else if(frame<100){caption='RIFLE  /  recovered burst';fire=true;}
      else {if(frame===100)d.game.switchWeapon('shotgun');caption='SHOTGUN  /  even fan, slight variation';fire=true;}
      document.querySelector('#demo-caption').textContent=caption;
      d.step(1/fps,fire);
      return {frame,weapon:d.game.combat.snapshot.weaponId,bloom:d.game.combat.snapshot.bloomRadians,bullets:d.game.bullets.length,state:d.game.status};
    },{frame,fps});frames.push(state);
    const png=await page.screenshot();if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
    if([4,40,74,77,103,123].includes(frame))await writeFile(resolve(output,`frame-${frame}.png`),png);
    if(frame%20===0)console.log('FRAME',frame,JSON.stringify(state));
  }
  shots.push(...await page.evaluate(()=>window.__spreadShots));
  encoder.stdin.end();const [code]=await once(encoder,'exit');assert.equal(code,0);
  assert.deepEqual(errors,[]);assert.equal(frames.length,total);assert.ok(frames.every(f=>f.state==='playing'));
  assert.equal(frames[55].bloom,.058);assert.equal(frames[74].bloom,0);
  const first=shots.find(s=>s.weapon==='rifle'),recovered=shots.find(s=>s.frame>=76&&s.weapon==='rifle');
  assert.ok(Math.abs(first.angles[0])<=.006);assert.ok(Math.abs(recovered.angles[0])<=.006);
  assert.ok(shots.some(s=>s.weapon==='shotgun'&&s.angles.length===8));
  const manifest={setup,fps,total,errors,shots,frames};await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log('PASS',JSON.stringify({output,total,shots:shots.length,errors}));
} finally {if(encoder&&encoder.exitCode===null)encoder.kill('SIGTERM');await browser?.close();await server.close();}
