import assert from 'node:assert/strict';
import {createServer} from 'vite';

/** Exercise actual production DOM feedback, not source-string assertions. */
export async function checkCheckpointFeedback(page) {
  const ssr = await createServer({configFile:false,server:{middlewareMode:true},logLevel:'error'});
  let key, value;
  try {
    const {DepthGame} = await ssr.ssrLoadModule('/src/DepthGame.ts');
    const {expeditionRewardOffers} = await ssr.ssrLoadModule('/src/game/roguelike/expedition.ts');
    const values = new Map();
    const storage = {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
    const game = new DepthGame(()=>{},storage);
    game.newRun(137);
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    game.combat.setCredits(1000);
    game.clearRoom();
    [key,value] = [...values.entries()][0];
    assert.ok(value, 'valid completed-room reward fixture');
  } finally { await ssr.close(); }
  await page.evaluate(({key,value})=>localStorage.setItem(key,value), {key,value});
  await page.reload();
  await page.locator('#continue').click();
  await page.evaluate(key=>{
    const original = Storage.prototype.setItem;
    window.__failCheckpointWrite = true;
    Storage.prototype.setItem = function(k,v) {
      if(k===key&&window.__failCheckpointWrite)throw new Error('simulated quota failure');
      return original.call(this,k,v);
    };
  },key);
  await page.locator('#reroll').click();
  assert.match(await page.locator('.save-note').innerText(), /Progress could not be saved/);
  // The same reward screen must refresh when persistence recovers.
  await page.evaluate(()=>{window.__failCheckpointWrite=false;});
  await page.locator('#reroll').click();
  assert.equal(await page.locator('.save-note').count(), 0);
  await page.locator('[data-mutation]').first().click();
  await page.reload();
  await page.evaluate(key=>{
    const original = Storage.prototype.removeItem;
    window.__failCheckpointClear = true;
    Storage.prototype.removeItem = function(k) {
      if(k===key&&window.__failCheckpointClear)throw new Error('simulated storage denial');
      return original.call(this,k);
    };
  },key);
  await page.locator('#start').click();
  assert.match(await page.locator('.save-note').innerText(), /Could not remove the previous checkpoint/);
  await page.locator('[data-mutation]').first().click();
  await page.locator('#pause').click();
  assert.match(await page.locator('.save-note').innerText(), /Reloading may restore an old run/);
  await page.locator('#menu').click();
  assert.match(await page.locator('.save-note').innerText(), /Could not remove/);
  assert.equal(await page.locator('#continue').count(), 0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.evaluate(()=>{window.__failCheckpointClear=false;});
  await page.locator('#start').click();
  assert.equal(await page.locator('.save-note').count(), 0);
  console.log('Checkpoint feedback passed: failed write, same-screen recovery, failed removal, pause/title warning, stale Continue suppression, recovery.');
}
