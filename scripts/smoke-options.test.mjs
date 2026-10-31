import {describe, it, expect} from 'vitest';
import {existsSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const helper = new URL('./smoke-options.mjs', import.meta.url);
// A missing implementation reports a contract failure without importing the GPU runner.
const options = existsSync(helper) ? await import(helper.href) : {};

describe('smoke viewport selection without a browser', () => {
  it.each([[undefined, ['desktop', 'touch']], ['both', ['desktop', 'touch']], ['desktop', ['desktop']], ['touch', ['touch']]])('selects %s exactly and in order', (value, expected) => {
    expect(options.selectSmokeViewports, 'selector must exist independently of browser startup').toBeTypeOf('function');
    expect(options.selectSmokeViewports(value)).toEqual(expected);
  });
  it.each(['', 'Desktop', 'TOUCH', ' desktop', 'touch ', 'mobile', 'all', 'desktop,touch', 'false', '0', null, false, 0])('rejects invalid selector %j', value => {
    expect(options.selectSmokeViewports).toBeTypeOf('function');
    expect(() => options.selectSmokeViewports(value)).toThrow(/SMOKE_VIEWPORT.*desktop.*touch.*both/);
  });
  it('rejects invalid environment before server or browser startup', () => {
    const source = readFileSync(new URL('./smoke.mjs', import.meta.url), 'utf8');
    expect(source).toContain('selectSmokeViewports(process.env.SMOKE_VIEWPORT)');
    expect(source.indexOf('selectSmokeViewports(process.env.SMOKE_VIEWPORT)')).toBeLessThan(source.indexOf('createServer('));
    const result = spawnSync(process.execPath, ['scripts/smoke.mjs'], {
      env: {...process.env, SMOKE_VIEWPORT: 'invalid', PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: '/must-not-launch'},
      encoding: 'utf8', timeout: 5000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/SMOKE_VIEWPORT.*desktop.*touch.*both/);
    expect(result.stderr).not.toContain('browserType.launch');
  });
});

describe('serial CI smoke budgets', () => {
  it.each(['verify', 'pages'])('%s preserves non-browser gates and separates both viewports', name => {
    const workflow = readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8');
    expect(workflow).toContain('timeout-minutes: 120');
    expect(workflow).toContain('npm test && npm run test:room-evidence && npm run build');
    expect(workflow).toContain('SMOKE_VIEWPORT: desktop');
    expect(workflow).toContain('SMOKE_VIEWPORT: touch');
    expect(workflow.match(/timeout --kill-after=30s 33m npm run test:smoke/g)).toHaveLength(2);
    expect(workflow.indexOf('SMOKE_VIEWPORT: desktop')).toBeLessThan(workflow.indexOf('SMOKE_VIEWPORT: touch'));
    expect(workflow).not.toContain('continue-on-error');
    expect(workflow.match(/timeout --kill-after=30s 8m npm run test:authored-smoke/g)).toHaveLength(2);
    expect(workflow).toContain('--viewport=desktop --out=artifacts/authored-smoke/desktop');
    expect(workflow).toContain('--viewport=phone --out=artifacts/authored-smoke/phone');
    expect(workflow).toContain("!cancelled() && steps.authored-desktop.outcome != 'skipped'");
    expect(workflow).toContain('if: ${{ always() }}');
    expect(workflow).toContain('path: artifacts/authored-smoke/');
    expect(workflow).toContain('retention-days: 7');
    if (name === 'verify') {
      expect(workflow).toContain('id: smoke-desktop');
      expect(workflow).toContain("!cancelled() && steps.smoke-desktop.outcome != 'skipped'");
    }
  });
});

describe('smoke phase timing', () => {
  it('logs starts, completed phase durations, and failure duration with viewport', () => {
    expect(options.createSmokePhaseTimer).toBeTypeOf('function');
    let now = 100;
    const events = [];
    const timer = options.createSmokePhaseTimer('touch', event => events.push(event), () => now);
    timer.start('graphics');
    now = 350;
    timer.start('menu-audio');
    now = 900;
    timer.finish('failed');
    timer.finish('failed');
    expect(events).toEqual([
      {viewport: 'touch', phase: 'graphics', status: 'started'},
      {viewport: 'touch', phase: 'graphics', status: 'passed', elapsedMs: 250},
      {viewport: 'touch', phase: 'menu-audio', status: 'started'},
      {viewport: 'touch', phase: 'menu-audio', status: 'failed', elapsedMs: 550},
    ]);
  });
  it('finishes the final successful phase', () => {
    expect(options.createSmokePhaseTimer).toBeTypeOf('function');
    const events = [];
    const timer = options.createSmokePhaseTimer('desktop', event => events.push(event), () => 10);
    timer.start('close');
    timer.finish('passed');
    expect(events.at(-1)).toEqual({viewport: 'desktop', phase: 'close', status: 'passed', elapsedMs: 0});
  });
});

describe('local authored-room gate', () => {
  it('requires both desktop and phone coverage after the production build', () => {
    const {scripts} = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(scripts.verify).toContain('npm run test:authored-smoke:all');
    expect(scripts.verify.indexOf('npm run build')).toBeLessThan(scripts.verify.indexOf('npm run test:authored-smoke:all'));
    expect(scripts['test:authored-smoke:all']).toContain('--viewport=desktop --out=artifacts/authored-smoke/desktop');
    expect(scripts['test:authored-smoke:all']).toContain(' && npm run test:authored-smoke -- --viewport=phone');
  });
});
