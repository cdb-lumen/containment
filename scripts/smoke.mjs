import assert from 'node:assert/strict';
import {observeAudio,checkMenuSound,checkPausedSound} from './sound-controls-check.mjs';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {chromium} from 'playwright';

const prefix = '/containment/';
const root = resolve('dist');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (!pathname.startsWith(prefix) || !file.startsWith(root + '/')) {res.writeHead(404).end(); return;}
  try { const data = await readFile(file); res.writeHead(200, {'Content-Type':types[extname(file)] ?? 'application/octet-stream'}).end(data); }
  catch {res.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  assert.equal((await fetch(origin + prefix + 'missing.js')).status, 404);
  for (const mobile of [false, true]) {
    const context = await browser.newContext({viewport:mobile ? {width:390,height:844} : {width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
    const page = await context.newPage();
    await observeAudio(page);
    page.setDefaultTimeout(60000);
    const errors = [], assets = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {if(message.type()==='error') errors.push(message.text());});
    page.on('response', response => {
      if (!response.url().startsWith(origin)) return;
      if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      if(response.url().includes('/assets/')) assets.add(new URL(response.url()).pathname);
    });
    page.on('requestfailed', request => {if(request.url().startsWith(origin)) errors.push(request.url()+': '+request.failure()?.errorText);});
    // Fonts are optional external decoration; keep the smoke independent of Google availability.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({status:200,contentType:'text/css',body:''}));
    await page.goto(origin + prefix);
    await page.waitForFunction(() => document.body.dataset.state === 'menu');
    // New sessions use fixed High on desktop and touch. Auto remains opt-in.
    await page.locator('#settings').click();
    assert.equal(await page.locator('#quality').inputValue(), 'high');
    assert.equal(await page.evaluate(() => window.__containmentPerformance.quality), 'high');
    for(const [selection,tier] of [['low','low'],['auto',mobile?'low':'balanced'],['high','high']]) {
      await page.locator('#quality').selectOption(selection);
      assert.equal(await page.evaluate(() => window.__containmentPerformance.quality), tier);
      await page.locator('#settings').click(); await page.locator('#settings').click();
      assert.equal(await page.locator('#quality').inputValue(), selection);
    }
    // Graphics is session-only; reloading returns to High, not implicit Auto.
    await page.locator('#quality').selectOption('low');
    await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
    await page.locator('#settings').click();
    assert.equal(await page.locator('#quality').inputValue(), 'high');
    assert.equal(await page.evaluate(() => window.__containmentPerformance.quality), 'high');
    await page.locator('#settings').click();
    console.log(`Graphics defaults and opt-in selection passed: ${mobile?'touch':'desktop'}`);
    const selectedVolume = await checkMenuSound(page, mobile);
    const chooseStartingBoon = async (capture = false) => {
      await page.locator('#start').click();
      await page.waitForFunction(() => document.body.dataset.state === 'reward' && Number(document.querySelector('#magazine').textContent)>0);
      assert.equal(await page.locator('[data-mutation]').count(),3);
      assert.equal(await page.locator('.choice-panel h2').textContent(),'Choose a boon');
      assert.match(await page.locator('.choice-panel > .eyebrow').textContent(),/BEFORE COMBAT/);
      assert.equal(await page.locator('#reroll').isDisabled(),true);
      const resources = () => page.locator('#health, #armor, #magazine, #reserve, #credits, #grenades, #medkits').allTextContents();
      const before = await resources();
      await page.keyboard.down('d');await page.keyboard.down('Space');
      await page.keyboard.press('g');await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      await page.keyboard.up('d');await page.keyboard.up('Space');
      assert.equal(await page.evaluate(() => document.body.dataset.state),'reward');
      assert.deepEqual(await resources(),before);
      assert.equal(await page.locator('#build-strip').textContent(),'');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
      if(capture && process.env.SMOKE_SCREENSHOTS === '1') {
        await mkdir('docs/pr-screenshots',{recursive:true});
        await page.screenshot({path:`docs/pr-screenshots/starting-boon-${mobile?'touch':'desktop'}.png`});
      }
      const card=page.locator('[data-mutation]').first(),name=await card.locator('h3').textContent();
      if(mobile)await card.tap();else {await card.focus();await page.keyboard.press('Enter');}
      await page.waitForFunction(() => document.body.dataset.state === 'playing');
      await page.locator('#pause').click();
      assert.equal(await page.locator('.build-details summary').textContent(),'Boons · 1');
      assert.equal(await page.locator('.build-details b').textContent(),name);
      await page.locator('#resume').click();
      return name;
    };
    const startingBoon = await chooseStartingBoon(true);
    await page.waitForFunction(() => document.body.dataset.state === 'playing' && Number(document.querySelector('#magazine').textContent)>0);
    const ammo = await page.locator('#magazine').textContent();
    if(mobile) {
      const box=await page.locator('#fire').boundingBox();
      const touch = await context.newCDPSession(page);
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
      await page.waitForFunction(before => document.querySelector('#magazine').textContent !== before, ammo);
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await touch.detach();
    } else {
      await page.keyboard.down('Space');
      await page.waitForFunction(before => document.querySelector('#magazine').textContent !== before, ammo);
      await page.keyboard.up('Space');
      await page.keyboard.press('2');
      await page.waitForFunction(() => document.querySelector('#weapon-name').textContent === 'rifle');
      await page.keyboard.down('d');
      await page.waitForTimeout(300);
      await page.keyboard.up('d');
    }
    await page.locator('#pause').click();
    await page.waitForFunction(() => document.body.dataset.state === 'paused');
    await checkPausedSound(page, mobile, selectedVolume);
    const credits = await page.locator('a', {hasText:'Credits'}).getAttribute('href');
    assert.equal(new URL(credits, page.url()).pathname, prefix+'audio-credits.html');
    assert.equal((await fetch(new URL(credits,page.url()))).status,200);
    await page.locator('#resume').click();
    await page.waitForFunction(() => document.body.dataset.state === 'playing');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
    await page.waitForFunction(() => window.__containmentPerformance.drawCalls > 0);
    if(process.env.SMOKE_SCREENSHOTS === '1') {
      await mkdir('docs/pr-screenshots',{recursive:true});
      await page.screenshot({path:`docs/pr-screenshots/v2-${mobile?'touch':'desktop'}-gameplay.png`});
    }
    assert.equal([...assets].filter(p=>p.includes('/assets/models/')&&p.endsWith('.glb')).length,11);
    const roomModels=['assets/benchmark/sealed-cryo.glb','assets/awakening/released-berth/released-berth.glb','assets/awakening/recovery-kit/room-kit.glb'];
    for(const path of roomModels)assert.ok(assets.has(prefix+path),`Missing room model: ${path}`);
    assert.equal([...assets].filter(p=>p.endsWith('.glb')).length,11+roomModels.length);
    assert.equal([...assets].filter(p=>p.includes('/environment/')).length,9);
    assert.ok([...assets].some(p=>p.includes('/audio/')));
    assert.ok([...assets].every(p=>p.startsWith(prefix)));
    await page.locator('#pause').click();
    await page.locator('#menu').click();
    await chooseStartingBoon();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({viewport:mobile?'touch 390x844':'desktop 1280x720',startingBoon,restart:'fresh boon selected',state:'playing',assets:assets.size,errors,performance:await page.evaluate(()=>window.__containmentPerformance)}));
    await context.close();
  }
  console.log('Browser smoke passed: desktop and touch, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
