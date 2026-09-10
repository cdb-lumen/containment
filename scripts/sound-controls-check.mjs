import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

// Test-only instrumentation observes real Web Audio nodes, not production diagnostics.
export async function observeAudio(page) {
  await page.addInitScript(() => {
    const Audio = window.AudioContext;
    window.__soundQA = {contexts: [], sources: 0};
    window.AudioContext = class extends Audio {
      constructor(...args) {
        super(...args);
        const entry = {context: this, gains: []};
        window.__soundQA.contexts.push(entry);
        const createGain = this.createGain.bind(this);
        this.createGain = () => {const node = createGain(); entry.gains.push(node); return node;};
        const createSource = this.createBufferSource.bind(this);
        this.createBufferSource = () => {entry.firstSourceGain ??= entry.gains[0].gain.value; window.__soundQA.sources++; return createSource();};
      }
    };
  });
}
// Keep real rendering enabled, but avoid software-shadow cost during repeated
// settings interactions. Restore High before the existing gameplay smoke.
async function openSettings(page) {
  await page.locator('#settings').click();
  await page.locator('#quality').selectOption('low');
}
const slider = page => page.getByRole('slider', {name:'Master volume'});
const mute = page => page.getByRole('button', {name:'Mute sound', exact:true});
async function gainIs(page, volume) {
  await page.waitForFunction(expected => {
    const entry = window.__soundQA.contexts.at(-1);
    return entry?.context.state === 'running' && Math.abs(entry.gains[0].gain.value - expected * .85) < .0001;
  }, volume);
}
async function savedIs(page, master, muted) {
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('containment.audio.v1'))), {master, muted});
}
async function capture(page, name) {
  if(process.env.SOUND_SCREENSHOTS !== '1') return;
  await mkdir('docs/pr-screenshots/sound-controls', {recursive:true});
  await page.screenshot({path:`docs/pr-screenshots/sound-controls/${name}.png`});
}
export async function checkMenuSound(page, mobile) {
  const viewport = mobile ? 'touch' : 'desktop';
  await openSettings(page);
  assert.equal(await slider(page).inputValue(), '30');
  assert.equal(await mute(page).getAttribute('aria-pressed'), 'false');
  await slider(page).scrollIntoViewIfNeeded();
  await capture(page, `${viewport}-menu`);
  for (const control of [slider(page), mute(page)]) {
    const box = await control.boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44);
  }
  // Keyboard changes keep focus on the same native slider.
  await slider(page).focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await slider(page).inputValue(), '31');
  assert.equal(await page.locator('#volume-value').textContent(), '31%');
  assert.equal(await slider(page).evaluate(node => node === document.activeElement), true);
  await savedIs(page, .31, false);
  if(mobile) await mute(page).tap(); else {await mute(page).focus();await page.keyboard.press('Space');}
  await savedIs(page, .31, true);
  assert.equal(await mute(page).textContent(), 'Unmute');
  await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
  await openSettings(page);
  assert.equal(await slider(page).inputValue(), '31');
  assert.equal(await mute(page).getAttribute('aria-pressed'), 'true');
  // Starting a run while muted must initialize the real gain at silence.
  await page.locator('#start').click();
  await page.waitForFunction(() => document.body.dataset.state === 'reward');
  await gainIs(page, 0);
  await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
  await openSettings(page);
  await mute(page).click(); await gainIs(page, .31);
  await page.waitForFunction(() => window.__soundQA.sources > 0);
  await slider(page).focus(); await page.keyboard.press('Home');
  await gainIs(page, 0); await savedIs(page, 0, false);
  await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
  await openSettings(page);
  assert.equal(await slider(page).inputValue(), '0');
  assert.equal(await mute(page).getAttribute('aria-pressed'), 'false');
  await mute(page).click(); await mute(page).click(); await gainIs(page, 0);
  await slider(page).focus(); await page.keyboard.press('End');
  await gainIs(page, 1);
  // A pointer/touch interaction exercises the native range as well.
  const box = await slider(page).boundingBox();
  if(mobile) {
    const touch = await page.context().newCDPSession(page);
    const y = box.y + box.height / 2;
    await touch.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:box.x + box.width - 10, y}]});
    await touch.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:box.x + box.width * .75, y}]});
    await touch.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:box.x + box.width / 2, y}]});
    await touch.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    await touch.detach();
  }
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const selected = Number(await slider(page).inputValue()) / 100;
  assert.ok(selected > .4 && selected < .6);
  await gainIs(page, selected); await savedIs(page, selected, false);
  await page.locator('#settings').click(); await openSettings(page);
  assert.equal(Number(await slider(page).inputValue()) / 100, selected);
  console.log(`Sound menu passed: ${viewport}, default 30%, native keyboard/touch, real gain, muted reload, zero reload, channel playback.`);
  await page.locator('#quality').selectOption('high');
  return selected;
}
export async function checkPausedSound(page, mobile, selected) {
  const quality = await page.locator('#quality').inputValue();
  await page.locator('#quality').selectOption('low');
  assert.equal(Number(await slider(page).inputValue()) / 100, selected);
  await mute(page).click(); await gainIs(page, 0);
  await slider(page).focus(); await page.keyboard.press('End');
  await gainIs(page, 0); await savedIs(page, 1, true);
  await capture(page, `${mobile?'touch':'desktop'}-paused-muted`);
  if(mobile) {
    await page.setViewportSize({width:844,height:390});
    await slider(page).scrollIntoViewIfNeeded();
    const box = await slider(page).boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 844 && box.y >= 0 && box.y + box.height <= 390);
    await capture(page, 'touch-landscape-paused');
    await page.setViewportSize({width:390,height:844});
  }
  await mute(page).click(); await gainIs(page, 1);
  await slider(page).focus(); await page.keyboard.press('Home');
  await gainIs(page, 0);
  assert.equal(await page.evaluate(() => document.body.dataset.state), 'paused');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.body.dataset.state === 'playing');
  await page.locator('#pause').click();
  assert.equal(await slider(page).inputValue(), '0');
  await page.locator('#quality').selectOption(quality);
  console.log(`Sound pause passed: ${mobile?'touch':'desktop'}, retains choice, muted adjustment stays silent, unmute restores choice, live zero gain.`);
}
