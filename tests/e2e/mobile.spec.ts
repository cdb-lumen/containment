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

  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__ALIEN_GAME__)).toBeUndefined();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(portraitBlocker).toBeHidden();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.touchControlsVisible)).toBe(true);

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

test('freezes observable progression while rotated to portrait', async ({ page }) => {
  const errors = browserErrors(page);
  await openGame(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
  await page.evaluate(() => window.__ALIEN_GAME__?.spawnStressWave());
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeEnemies ?? 0)).toBeGreaterThan(0);

  const before = await page.evaluate(() => ({
    enemies: window.__ALIEN_GAME__?.activeEnemies,
    phase: window.__ALIEN_GAME__?.phase,
    wave: window.__ALIEN_GAME__?.wave,
    health: window.__ALIEN_GAME__?.playerHealth,
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('status')).toBeVisible();
  await page.waitForTimeout(750);
  const after = await page.evaluate(() => ({
    enemies: window.__ALIEN_GAME__?.activeEnemies,
    phase: window.__ALIEN_GAME__?.phase,
    wave: window.__ALIEN_GAME__?.wave,
    health: window.__ALIEN_GAME__?.playerHealth,
  }));

  expect(after).toEqual(before);
  expect(errors).toEqual([]);
});
