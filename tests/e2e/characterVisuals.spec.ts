import { expect, test, type Page } from '@playwright/test';

const CHARACTER_IDS = [
  'marine', 'crawler', 'brute', 'spitter', 'stalker', 'carrier', 'queen',
] as const;
const PAGES_ORIGIN = 'http://127.0.0.1:4175';
const PAGES_BASE = '/alien-shooter-containment/';

const collectBrowserErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
};

const deploy = async (page: Page): Promise<void> => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?renderer=canvas');
  await expect(page.locator('canvas')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
};

test('production Pages artifact serves every character sheet without development diagnostics', async ({ page, request }) => {
  const errors = collectBrowserErrors(page);
  const response = await page.goto(`${PAGES_ORIGIN}${PAGES_BASE}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('canvas')).toBeVisible();
  expect(await page.evaluate(() => ({
    game: window.__ALIEN_GAME__,
    boot: window.__ALIEN_BOOT__,
  }))).toEqual({ game: undefined, boot: undefined });

  for (const id of CHARACTER_IDS) {
    const asset = await request.get(
      `${PAGES_ORIGIN}${PAGES_BASE}assets/characters/${id}-sheet.png`,
    );
    expect(asset.status(), id).toBe(200);
    expect(asset.headers()['content-type'], id).toMatch(/^image\/png\b/);
    const body = await asset.body();
    expect(body.byteLength, id).toBeGreaterThan(8);
    expect([...body.subarray(0, 8)], id).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }
  const blood = await request.get(
    `${PAGES_ORIGIN}${PAGES_BASE}assets/effects/blood-decals-sheet.png`,
  );
  expect(blood.status()).toBe(200);
  expect(blood.headers()['content-type']).toMatch(/^image\/png\b/);
  expect([...(await blood.body()).subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(errors).toEqual([]);
});

test('observable character animation, mixed skins, and restart state remain bounded', async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await deploy(page);
  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;

  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.35);
  const idle = await page.evaluate(() => ({
    frame: window.__ALIEN_GAME__?.playerFrame,
    time: window.__ALIEN_GAME__?.presentationTimeMs ?? 0,
    rotation: window.__ALIEN_GAME__?.playerBodyRotation ?? 0,
  }));
  await page.keyboard.down('KeyD');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerAnimating)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerFrame)).not.toBe(idle.frame);
  await page.waitForTimeout(260);
  const moving = await page.evaluate(() => ({
    frame: window.__ALIEN_GAME__?.playerFrame,
    time: window.__ALIEN_GAME__?.presentationTimeMs ?? 0,
    rotation: window.__ALIEN_GAME__?.playerBodyRotation ?? 0,
  }));
  expect(moving.frame).toMatch(/^move[AB]$/);
  expect(moving.time).toBeGreaterThan(idle.time);
  expect(Math.abs(moving.rotation - idle.rotation)).toBeGreaterThan(0.001);
  await page.keyboard.up('KeyD');

  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerRecoil), {
    timeout: 500,
    intervals: [10, 10, 20, 20, 40],
  }).toBe(true);
  await page.mouse.up();

  await page.evaluate(() => {
    for (let index = 0; index < 20; index += 1) window.__ALIEN_GAME__?.spawnStressWave();
  });
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeEnemySkinKeys.length ?? 0))
    .toBeGreaterThanOrEqual(3);
  const horde = await page.evaluate(() => ({
    keys: window.__ALIEN_GAME__?.activeEnemySkinKeys ?? [],
    keysFrozen: Object.isFrozen(window.__ALIEN_GAME__?.activeEnemySkinKeys),
    framed: window.__ALIEN_GAME__?.framedEnemyCount ?? 0,
    active: window.__ALIEN_GAME__?.activeEnemies ?? 0,
    visuals: window.__ALIEN_GAME__?.enemyVisualCount ?? 0,
  }));
  expect(new Set(horde.keys).size).toBe(horde.keys.length);
  expect(horde.keysFrozen).toBe(true);
  expect(horde.framed).toBe(horde.active);
  expect(horde.active).toBeGreaterThan(0);
  expect(horde.visuals).toBeLessThanOrEqual(150);

  await page.evaluate(() => {
    window.__ALIEN_GAME__?.completeWave();
    window.__ALIEN_GAME__?.focusQueenArena();
  });
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.phase)).toBe('boss');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.bossHealth ?? 0)).toBeGreaterThan(0);

  await page.evaluate(() => {
    const testWindow = window as Window & {
      __ALIEN_GAME_BEFORE_RESTART__?: typeof window.__ALIEN_GAME__;
    };
    testWindow.__ALIEN_GAME_BEFORE_RESTART__ = window.__ALIEN_GAME__;
    window.__ALIEN_GAME__?.restart();
  });
  await page.waitForFunction(() => {
    const testWindow = window as Window & {
      __ALIEN_GAME_BEFORE_RESTART__?: typeof window.__ALIEN_GAME__;
    };
    return window.__ALIEN_GAME__ !== undefined
      && window.__ALIEN_GAME__ !== testWindow.__ALIEN_GAME_BEFORE_RESTART__;
  });
  await page.evaluate(() => {
    const testWindow = window as Window & {
      __ALIEN_GAME_BEFORE_RESTART__?: typeof window.__ALIEN_GAME__;
    };
    delete testWindow.__ALIEN_GAME_BEFORE_RESTART__;
  });
  await page.waitForFunction(() => window.__ALIEN_GAME__?.playerHealth === 100);
  const reset = await page.evaluate(() => ({
    frame: window.__ALIEN_GAME__?.playerFrame,
    animating: window.__ALIEN_GAME__?.playerAnimating,
    recoil: window.__ALIEN_GAME__?.playerRecoil,
    hit: window.__ALIEN_GAME__?.playerHit,
    time: window.__ALIEN_GAME__?.presentationTimeMs ?? Number.POSITIVE_INFINITY,
    skin: window.__ALIEN_GAME__?.playerSkinKey,
    framed: window.__ALIEN_GAME__?.playerFallbackFramed,
    active: window.__ALIEN_GAME__?.activeEnemies,
    keys: window.__ALIEN_GAME__?.activeEnemySkinKeys,
  }));
  expect(reset).toMatchObject({
    frame: 'idleA', animating: false, recoil: false, hit: false,
    skin: 'skin-marine', framed: true, active: 0, keys: [],
  });
  expect(Number.isFinite(reset.time)).toBe(true);
  expect(reset.time).toBeGreaterThanOrEqual(0);
  expect(reset.time).toBeLessThan(moving.time);
  expect(errors).toEqual([]);
});
