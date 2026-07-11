import { expect, test, type Page } from '@playwright/test';

const openGame = async (page: Page): Promise<void> => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/?renderer=canvas');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(200);
};

const deploy = async (page: Page): Promise<void> => {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__ !== undefined);
};

const browserErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
};

test('deploys, pauses, applies quality live, and resets run isolation', async ({ page }) => {
  const errors = browserErrors(page);
  await openGame(page);
  await deploy(page);

  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerHealth)).toBe(100);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeQuality)).toBe('high');

  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog', { name: 'Mission paused' });
  await expect(dialog).toBeVisible();
  await page.getByLabel('Quality').selectOption('low');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeQuality)).toBe('low');

  await page.getByLabel('Quality').selectOption('auto');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeQuality)).toBe('low');
  await page.getByLabel('Reduce camera shake').check();
  await page.getByLabel('Reduce bright flashes').check();
  await page.getByLabel('Master volume').fill('0.4');
  await page.getByRole('button', { name: 'Resume mission' }).click();
  await expect(dialog).toBeHidden();

  await page.evaluate(() => window.__ALIEN_GAME__?.damagePlayer(60));
  await expect
    .poll(() => page.evaluate(() => window.__ALIEN_GAME__?.playerHealth ?? 100))
    .toBeLessThan(100);
  await page.evaluate(() => window.__ALIEN_GAME__?.restart());
  await page.waitForFunction(() => window.__ALIEN_GAME__?.playerHealth === 100);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeQuality)).toBe('high');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeEnemies)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeProjectiles)).toBe(0);
  expect(errors).toEqual([]);
});

test('exposes accessible results actions and restarts a fresh run', async ({ page }) => {
  const errors = browserErrors(page);
  await openGame(page);
  await deploy(page);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyW');

  await page.evaluate(() => window.__ALIEN_GAME__?.damagePlayer(1_000));
  const restart = page.getByRole('button', { name: 'Restart run' });
  await expect(restart).toBeAttached({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Return to menu' })).toBeAttached();
  await restart.focus();
  await expect(restart).toBeVisible();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__ALIEN_GAME__?.playerHealth === 100);
  expect(errors).toEqual([]);
});

test('reaches the horde cap and survives a sustained firing-input burst', async ({ page }) => {
  const errors = browserErrors(page);
  await openGame(page);
  await deploy(page);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyW');

  const canvas = page.locator('canvas');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds) {
    await page.mouse.move(
      bounds.x + bounds.width * 0.7,
      bounds.y + bounds.height * 0.5,
    );
    await page.mouse.down();
    await expect
      .poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeProjectiles))
      .toBeGreaterThan(0);
    await page.mouse.up();
    for (let index = 0; index < 200; index += 1) {
      await page.mouse.click(
        bounds.x + bounds.width * 0.7,
        bounds.y + bounds.height * 0.5,
      );
    }
  }
  await page.evaluate(() => {
    for (let index = 0; index < 20; index += 1) {
      window.__ALIEN_GAME__?.spawnStressWave();
    }
  });
  await expect
    .poll(() => page.evaluate(() => window.__ALIEN_GAME__?.activeEnemies))
    .toBe(150);

  const counts = await page.evaluate(() => ({
    enemies: window.__ALIEN_GAME__?.activeEnemies,
    projectiles: window.__ALIEN_GAME__?.activeProjectiles,
  }));
  expect(counts.enemies).toBeDefined();
  expect(counts.projectiles).toBeDefined();
  expect(counts.enemies).toBeLessThanOrEqual(150);
  expect(counts.projectiles).toBeLessThanOrEqual(300);
  expect(errors).toEqual([]);
});
