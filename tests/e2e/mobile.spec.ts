import { expect, test, type Page } from '@playwright/test';

const browserErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
};

const openGame = async (page: Page): Promise<void> => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?renderer=canvas');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(200);
};

test('blocks portrait deployment and exposes usable landscape touch controls', async ({ page }) => {
  const errors = browserErrors(page);
  await openGame(page);
  const portraitBlocker = page.getByRole('status');
  await expect(portraitBlocker).toBeVisible();
  await expect(portraitBlocker).toContainText('Rotate your device');
  await expect(page.locator('#game-root')).toHaveJSProperty('inert', true);
  await expect(page.locator('#game-root')).toHaveAttribute('aria-hidden', 'true');

  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__ALIEN_GAME__)).toBeUndefined();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(portraitBlocker).toBeHidden();
  await expect(page.locator('#game-root')).toHaveJSProperty('inert', false);
  const canvasBounds = await page.locator('canvas').boundingBox();
  expect(canvasBounds).not.toBeNull();
  expect(canvasBounds?.x).toBeCloseTo(0, 0);
  expect(canvasBounds?.y).toBeCloseTo(0, 0);
  expect(canvasBounds?.width).toBeCloseTo(844, 0);
  expect(canvasBounds?.height).toBeCloseTo(390, 0);
  await page.getByRole('button', { name: 'Deploy' }).focus();
  await expect(page.getByRole('button', { name: 'Deploy' })).toBeVisible();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.touchControlsVisible)).toBe(true);

  const canvas = page.locator('canvas');
  const movementCanvasBounds = await canvas.boundingBox();
  expect(movementCanvasBounds).not.toBeNull();
  const projectilesBeforeMovement = await page.evaluate(
    () => window.__ALIEN_GAME__?.activeProjectiles ?? 0,
  );
  const client = await page.context().newCDPSession(page);
  const movementStart = {
    x:
      (movementCanvasBounds?.x ?? 0) +
      (movementCanvasBounds?.width ?? 0) * 0.2,
    y:
      (movementCanvasBounds?.y ?? 0) +
      (movementCanvasBounds?.height ?? 0) * 0.72,
  };
  const movementEnd = {
    x:
      (movementCanvasBounds?.x ?? 0) +
      (movementCanvasBounds?.width ?? 0) * 0.14,
    y: movementStart.y,
  };
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...movementStart, id: 31 }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ ...movementEnd, id: 31 }],
  });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__ALIEN_GAME__?.activeProjectiles ?? 0)).toBe(
    projectilesBeforeMovement,
  );
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });

  const touchActions: Array<{ name: string | RegExp; label: string }> = [
    { name: 'Pause game', label: 'Pause game' },
    { name: 'Throw grenade', label: 'Throw grenade' },
    { name: 'Use medkit', label: 'Use medkit' },
    { name: 'Switch weapon', label: 'Switch weapon' },
  ];
  for (const action of touchActions) {
    const bounds = await page.getByRole('button', { name: action.name }).boundingBox();
    expect(bounds, `${action.label} missing`).not.toBeNull();
    expect(bounds?.width ?? 0, `${action.label} is too narrow`).toBeGreaterThanOrEqual(48);
    expect(bounds?.height ?? 0, `${action.label} is too short`).toBeGreaterThanOrEqual(48);
  }

  const weaponButton = page.getByRole('button', { name: 'Switch weapon' });
  await expect(weaponButton).toHaveText('W1');
  await weaponButton.click();
  await expect(weaponButton).toHaveText('W2');

  await page.evaluate(() => window.__ALIEN_GAME__?.damagePlayer(60));
  await expect
    .poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerHealth))
    .toBeLessThan(100);
  const damagedHealth = await page.evaluate(
    () => window.__ALIEN_GAME__?.playerHealth,
  );
  expect(damagedHealth).toBeDefined();
  await page.getByRole('button', { name: 'Use medkit' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerHealth))
    .toBeGreaterThan(damagedHealth ?? 100);

  await page.getByRole('button', { name: 'Throw grenade' }).click();
  await expect
    .poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeProjectiles))
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Pause game' }).click();
  const pauseDialog = page.getByRole('dialog', { name: 'Mission paused' });
  await expect(pauseDialog).toBeVisible();
  await expect(page.getByText('Touch Left stick moves')).toBeVisible();
  await page.getByRole('button', { name: 'Resume mission' }).click();
  await expect(pauseDialog).toBeHidden();
  expect(errors).toEqual([]);
});

test('blocks results shortcuts in portrait and restores them in landscape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('status')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('status')).toBeHidden();
  await page.getByRole('button', { name: 'Deploy' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyW');
  await page.evaluate(() => window.__ALIEN_GAME__?.damagePlayer(1_000));

  const restart = page.getByRole('button', { name: 'Restart run' });
  await expect(restart).toBeAttached({ timeout: 10_000 });
  const restartDom = page.locator('button').filter({ hasText: 'Restart run' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('#game-root')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await expect(restartDom).toBeAttached();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('status')).toBeHidden();
  const visibleRestart = page.getByRole('button', { name: 'Restart run' });
  await visibleRestart.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__?.playerHealth === 100);
});

test('freezes observable progression while rotated to portrait', async ({ page }) => {
  const errors = browserErrors(page);
  await openGame(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
  await page.evaluate(() => {
    window.__ALIEN_GAME__?.spawnStressEnemies(16);
    window.__ALIEN_GAME__?.defeatStressEnemies(8);
  });
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeEnemies ?? 0)).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('#game-root')).toHaveJSProperty('inert', true);
  const before = await page.evaluate(() => ({
    enemies: window.__ALIEN_GAME__?.activeEnemies,
    phase: window.__ALIEN_GAME__?.phase,
    wave: window.__ALIEN_GAME__?.wave,
    health: window.__ALIEN_GAME__?.playerHealth,
    presentationTime: window.__ALIEN_GAME__?.presentationTimeMs,
    frame: window.__ALIEN_GAME__?.playerFrame,
    effectCounts: window.__ALIEN_GAME__?.effectCounts,
    bloodDisplayCount: window.__ALIEN_GAME__?.bloodDisplayCount,
    corpseDisplayCount: window.__ALIEN_GAME__?.corpseDisplayCount,
    corpseFamilies: window.__ALIEN_GAME__?.activeCorpseFamilies,
  }));
  await page.waitForTimeout(750);
  const after = await page.evaluate(() => ({
    enemies: window.__ALIEN_GAME__?.activeEnemies,
    phase: window.__ALIEN_GAME__?.phase,
    wave: window.__ALIEN_GAME__?.wave,
    health: window.__ALIEN_GAME__?.playerHealth,
    presentationTime: window.__ALIEN_GAME__?.presentationTimeMs,
    frame: window.__ALIEN_GAME__?.playerFrame,
    effectCounts: window.__ALIEN_GAME__?.effectCounts,
    bloodDisplayCount: window.__ALIEN_GAME__?.bloodDisplayCount,
    corpseDisplayCount: window.__ALIEN_GAME__?.corpseDisplayCount,
    corpseFamilies: window.__ALIEN_GAME__?.activeCorpseFamilies,
  }));

  expect(after).toEqual(before);
  expect(before.effectCounts).toEqual({ decals: 8, remains: 8 });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('status')).toBeHidden();
  const resumedAt = await page.evaluate(() => window.__ALIEN_GAME__?.presentationTimeMs ?? 0);
  expect(resumedAt - (before.presentationTime ?? 0)).toBeLessThan(100);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.presentationTimeMs ?? 0))
    .toBeGreaterThan(resumedAt);
  expect(errors).toEqual([]);
});
