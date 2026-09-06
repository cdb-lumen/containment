import assert from 'node:assert/strict';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn, execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';

// Response-only inspection. No production file, collision, input or effect replacement.
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [key, ...value] = a.replace(/^--/, '').split('=');
  return [key, value.length ? value.join('=') : true];
}));
for (const key of Object.keys(args)) assert(['out', 'source-sha', 'provisional', 'seconds'].includes(key), `Unknown --${key}`);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const provisional = args.provisional === true;
const seconds = Number(args.seconds ?? (provisional ? 2 : 6));
assert(provisional ? seconds >= 2 && seconds <= 6 : seconds === 6, 'Final capture must be six seconds');
const fps = 20, total = seconds * fps;
assert(Number.isInteger(total) && total >= 40);
const out = resolve(args.out || join(root, 'artifacts/enemy-hit-demo'));
const git = (...a) => execFileSync('git', ['-C', root, ...a], {encoding: 'utf8', timeout: 15000}).trim();
const sha = git('rev-parse', 'HEAD');
if (!provisional) {
  assert.match(args['source-sha'] || '', /^[a-f0-9]{40}$/, 'Final mode requires --source-sha=<full HEAD>');
  assert.equal(args['source-sha'], sha);
}
const sourcePaths = ['src', 'public', 'index.html', 'vite.config.ts', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
async function sourceState() {
  const files = git('ls-files', '--cached', '--others', '--exclude-standard', '--', ...sourcePaths).split('\n').filter(Boolean).sort();
  const hash = createHash('sha256');
  for (const file of [...new Set(files)]) { hash.update(file); hash.update(await readFile(join(root, file))); }
  return {sha: git('rev-parse', 'HEAD'), status: git('status', '--porcelain', '--untracked-files=all', '--', ...sourcePaths), fullWorktreeStatus: git('status', '--porcelain'), sha256: hash.digest('hex')};
}
const sourceBefore = await sourceState();
if (!provisional) assert.equal(sourceBefore.status, '', 'Final source/assets/config must be clean');
await mkdir(out, {recursive: true});
let server, browser, browserServer, encoder, closing;
const errors = [], samples = [], screenshots = [], lifecycle = {};
const bounded = (promise, ms, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(`${label} timed out`)), ms); })]).finally(() => clearTimeout(timer));
};
async function cleanup() {
  if (closing) return closing;
  closing = (async () => {
    if (encoder && encoder.exitCode === null && encoder.signalCode === null) {
      const stopped = once(encoder, 'exit'); encoder.kill('SIGTERM');
      try { await bounded(stopped, 5000, 'ffmpeg stop'); } catch { encoder.kill('SIGKILL'); }
    }
    if (browser) { try { await bounded(browser.close(), 15000, 'browser close'); } catch {} }
    if (browserServer) { try { await bounded(browserServer.close(), 5000, 'browser process close'); } catch { browserServer.process()?.kill('SIGKILL'); } }
    if (server) { try { await bounded(server.close(), 10000, 'Vite close'); } catch {} }
  })();
  return closing;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143)); });
const watchdog = setTimeout(() => { console.error('Capture exceeded 25-minute bound'); void cleanup().finally(() => process.exit(124)); }, 25 * 60 * 1000);
try {
  server = await createServer({root, configFile: join(root, 'vite.config.ts'), base: '/', server: {host: '127.0.0.1', port: 0, hmr: false}});
  await server.listen();
  const port = server.httpServer.address().port;
  browserServer = await chromium.launchServer({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--enable-unsafe-swiftshader'], timeout: 120000});
  browser = await chromium.connect(browserServer.wsEndpoint());
  const page = await browser.newPage({viewport: {width: 960, height: 600}, deviceScaleFactor: 1});
  page.setDefaultTimeout(120000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => raf(t => { if (!window.__enemyGate) cb(t); });
  });
  await page.route('**/src/main.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body: (await response.text()) + '\nwindow.__enemyDemo={game,renderer,input,audio,confirmation,hud,syncScreen};\n'});
  });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => window.__enemyDemo && document.body.dataset.state === 'menu');
  await page.evaluate(() => { window.__enemyGate = true; });
  await page.locator('#start').click(); // Real gesture also unlocks the shipping AudioSystem.
  const setup = await page.evaluate(async () => {
    const d = window.__enemyDemo, g = d.game, r = d.renderer;
    const {expeditionRewardOffers} = await import('/src/game/roguelike/expedition.ts');
    const geometry = await import('/src/game/world/expeditionGeometry.ts');
    d.geometry = geometry;
    g.newRun(1729); g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id); g.skipStory();
    g.pending = []; g.director.update = () => []; g.clearRequested = false;
    g.enemies.reset(); g.switchWeapon('pistol');
    r.setQuality('low'); r.loadRoom(g.node); r.render(g, 1, false); d.hud(); d.syncScreen(true);
    if (!geometry.canOccupyExpedition(g.geometry, g.player, g.player.radius)) throw Error('Illegal player position');
    d.events = []; d.actorHits = []; d.audioCalls = []; d.frame = -1;
    const effect = r.effect.bind(r);
    r.effect = e => { d.events.push({...e, frame: d.frame, family: d.family}); effect(e); };
    const audioHit = d.audio.playConfirmedHit.bind(d.audio);
    d.audio.playConfirmedHit = blocked => { d.audioCalls.push({frame: d.frame, blocked}); return audioHit(blocked); };
    const caption = document.createElement('div'); caption.id = 'enemy-demo-caption';
    caption.style.cssText = 'position:fixed;left:12px;bottom:78px;z-index:999;padding:7px 10px;background:#061116df;color:#eff5ef;font:13px sans-serif;pointer-events:none';
    document.body.append(caption);
    return {room: g.node.templateId, player: {...g.player}, nativeZoom: r.camera.zoom, quality: r.qualityTier,
      controlled: 'Sequential legal spawns; encounter scheduling disabled; native enemy AI, projectile collision, actor rendering and browser mouse input retained.', audio: 'Silent video: image-only capture with -an. Shipping audio methods remain active and are counted, not recorded.'};
  });
  const mp4 = join(out, 'enemy-hit-demo.mp4');
  encoder = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], {stdio: ['pipe', 'inherit', 'inherit']});
  encoder.stdin.on('error', () => {});
  const finished = once(encoder, 'exit');
  let stage = -1, stageStart = 0;
  const families = ['crawler', 'stalker', 'brute'];
  for (let frame = 0; frame < total; frame++) {
    const nextStage = Math.min(2, Math.floor(frame * 3 / total));
    if (stage !== nextStage) {
      stage = nextStage; stageStart = frame;
      await page.mouse.up();
      await page.evaluate(({family, frame}) => {
        const d = window.__enemyDemo, g = d.game, r = d.renderer;
        d.input.reset(); d.confirmation.clear(); g.enemies.reset(); g.bullets = []; d.family = family; d.frame = frame;
        // Search legal, visible, unobstructed locations instead of teleporting through authored walls.
        const candidates = [];
        for (const distance of [210, 180, 240, 150]) for (let i = 0; i < 24; i++) {
          const angle = i * Math.PI / 12, p = {x: g.player.x + Math.cos(angle) * distance, y: g.player.y + Math.sin(angle) * distance};
          if (d.geometry.canOccupyExpedition(g.geometry, p, 32) && d.geometry.hasClearExpeditionShot(g.geometry, g.player, p) && r.visible(p.x, p.y)) candidates.push(p);
        }
        if (!candidates.length) throw Error('No legal visible encounter location');
        const spawned = g.enemies.spawn(family, candidates[0].x, candidates[0].y);
        if (!spawned.spawned) throw Error('Spawn rejected');
        d.targetId = spawned.enemy.id; d.initial = {...spawned.enemy};
        r.render(g, 0, false);
        const model = r.actors.get(d.targetId);
        if (!model?.hit || !model.height) throw Error('Missing real actor feedback model');
        const original = model.hit.bind(model);
        model.hit = (...args) => { d.actorHits.push({frame: d.frame, family: d.family, targetId: d.targetId}); return original(...args); };
        document.querySelector('#enemy-demo-caption').textContent = `${family.toUpperCase()} / REAL MOUSE AIM / CONTROLLED GAMEPLAY / SILENT VIDEO`;
      }, {family: families[stage], frame});
    }
    const aim = await page.evaluate(() => {
      const d = window.__enemyDemo, e = d.game.enemies.getSnapshot(d.targetId), r = d.renderer;
      if (!e) return null;
      const height = r.actors.get(e.id).height * .5;
      const p = r.camera.position.clone().set(e.x / 32, height, e.y / 32).project(r.camera);
      const rect = r.canvas.getBoundingClientRect();
      return {x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2, height, target: {x: e.x, y: e.y}};
    });
    if (aim) await page.mouse.move(aim.x, aim.y);
    const fire = !!aim && frame - stageStart >= 3 && frame - stageStart < Math.min(23, Math.floor(total / 3) - 2);
    if (fire) await page.mouse.down(); else await page.mouse.up();
    const state = await page.evaluate(({frame, fps, aim, fire}) => {
      const d = window.__enemyDemo, g = d.game, r = d.renderer; d.frame = frame;
      const input = d.input.read(), before = g.enemies.getSnapshot(d.targetId);
      if (input.fire !== fire || input.autoAim) throw Error('Browser pointer did not reach real InputController');
      if (aim && before) {
        const expected = Math.atan2(before.y - g.player.y, before.x - g.player.x);
        if (input.angle === null || Math.abs(Math.atan2(Math.sin(input.angle - expected), Math.cos(input.angle - expected))) > .01) throw Error('Projected torso pointer failed exact target aim');
      }
      g.update(1000 / fps, input); d.confirmation.update(1 / fps, g.status === 'playing');
      r.render(g, 1 / fps, false); d.hud();
      if (g.status !== 'playing') throw Error(`Left gameplay: ${g.status}`);
      const after = g.enemies.getSnapshot(d.targetId), marker = document.querySelector('#hit-confirmation');
      let emissiveMax = 0;
      r.actors.get(d.targetId)?.root.traverse(o => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) emissiveMax = Math.max(emissiveMax, m.emissiveIntensity || 0); });
      return {frame, family: d.family, targetId: d.targetId, initial: d.initial, before, after, input, aim,
        damage: before ? before.health + before.armor - (after ? after.health + after.armor : 0) : 0,
        marker: {visible: !marker.hidden, contact: marker.dataset.contact, left: marker.style.left, top: marker.style.top}, emissiveMax,
        zoom: r.camera.zoom, elapsed: g.elapsed, effects: r.effects.counts};
    }, {frame, fps, aim, fire});
    samples.push(state);
    const png = await page.screenshot({timeout: 120000});
    if (!encoder.stdin.write(png)) await bounded(once(encoder.stdin, 'drain'), 30000, 'encoder drain');
    if (state.marker.visible || frame === stageStart || frame === total - 1) {
      const file = `frame-${String(frame).padStart(3, '0')}-${state.family}.png`;
      await writeFile(join(out, file), png); screenshots.push({frame, file, sha256: createHash('sha256').update(png).digest('hex')});
    }
    if (state.marker.visible && !lifecycle.pause) {
      await page.keyboard.press('Escape');
      const paused = await page.evaluate(() => ({status: window.__enemyDemo.game.status, hidden: document.querySelector('#hit-confirmation').hidden, fire: window.__enemyDemo.input.read().fire}));
      assert.deepEqual(paused, {status: 'paused', hidden: true, fire: false});
      await page.mouse.up(); // Release the held fire pointer before clicking a modal button.
      await page.locator('#resume').click();
      lifecycle.pause = {frame, paused, resumed: await page.evaluate(() => ({status: window.__enemyDemo.game.status, hidden: document.querySelector('#hit-confirmation').hidden}))};
      assert.deepEqual(lifecycle.pause.resumed, {status: 'playing', hidden: true});
    }
    if (frame % fps === 0) { console.log('FRAME', frame, '/', total, state.family); await writeFile(join(out, 'progress.json'), JSON.stringify({sha, provisional, frame, total, pid: process.pid})); }
  }
  await page.mouse.up(); encoder.stdin.end();
  assert.equal((await bounded(finished, 60000, 'encoder finish'))[0], 0);
  const events = await page.evaluate(() => ({events: window.__enemyDemo.events, actorHits: window.__enemyDemo.actorHits, audioCalls: window.__enemyDemo.audioCalls}));
  lifecycle.reset = await page.evaluate(() => {
    const d = window.__enemyDemo; d.game.newRun(1729); d.input.reset(); d.syncScreen(true);
    return {hidden: document.querySelector('#hit-confirmation').hidden, fire: d.input.read().fire, status: d.game.status};
  });
  assert.deepEqual(lifecycle.reset, {hidden: true, fire: false, status: 'reward'});
  assert(lifecycle.pause, 'No genuine marker available for pause lifecycle test');
  for (const family of families) {
    assert(samples.some(s => s.family === family && s.damage > 0), `${family}: no armor+health damage`);
    assert(samples.some(s => s.family === family && s.marker.visible && s.marker.contact === (family === 'brute' ? 'armor' : 'damage')), `${family}: missing visible marker`);
    assert(events.actorHits.some(e => e.family === family), `${family}: actor hit() not invoked`);
    assert(events.events.some(e => e.family === family && e.contact === (family === 'brute' ? 'armor' : 'damage') && Number.isInteger(e.targetId) && Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.angle) && e.weapon === 'pistol'), `${family}: missing authoritative contact fields`);
  }
  assert(samples.some(s => s.family === 'brute' && s.before?.armor > (s.after?.armor ?? 0)), 'Brute armor was not damaged');
  assert(samples.some(s => s.family === 'stalker' && s.after && Math.hypot(s.after.x - s.initial.x, s.after.y - s.initial.y) > 1), 'Stalker AI did not move');
  assert(samples.every(s => s.zoom === setup.nativeZoom), 'Camera zoom changed');
  assert(events.audioCalls.some(a => a.blocked && events.events.some(e => e.frame === a.frame && e.contact === 'armor')), 'Armor audio cue not invoked');
  assert.equal(events.audioCalls.length, events.events.filter(e => e.contact).length, 'Confirmed-hit audio routing count');
  assert.deepEqual(errors, []);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', mp4], {encoding: 'utf8', timeout: 60000}));
  const video = probe.streams.filter(s => s.codec_type === 'video');
  assert.equal(video.length, 1); assert.equal(probe.streams.filter(s => s.codec_type === 'audio').length, 0);
  assert.equal(video[0].codec_name, 'h264'); assert.equal(video[0].pix_fmt, 'yuv420p');
  assert.equal(Number(video[0].nb_read_frames), total); assert.equal(Number(video[0].nb_frames), total);
  assert(Math.abs(Number(probe.format.duration) - seconds) < .051);
  execFileSync('ffmpeg', ['-v', 'error', '-i', mp4, '-f', 'null', '-'], {timeout: 60000});
  const sourceAfter = await sourceState();
  assert.equal(sourceAfter.sha, sourceBefore.sha, 'HEAD changed during capture');
  assert.equal(sourceAfter.sha256, sourceBefore.sha256, 'Source changed during capture');
  if (!provisional) assert.equal(sourceAfter.status, '', 'Source became dirty during capture');
  await writeFile(join(out, 'manifest.json'), JSON.stringify({root, sha, provisional, finalEvidence: !provisional, sourceBefore, sourceAfter, setup, fps, total, seconds, mp4, silent: true, audioTrackCount: 0, screenshots, samples, ...events, lifecycle, errors, probe}, null, 2));
  console.log('PASS', JSON.stringify({mp4, manifest: join(out, 'manifest.json'), total, provisional, silent: true}));
} catch (error) {
  await writeFile(join(out, 'failure.json'), JSON.stringify({sha, provisional, error: String(error.stack || error), errors, completedFrames: samples.length, samples, lifecycle}, null, 2));
  throw error;
} finally { clearTimeout(watchdog); await cleanup(); }
