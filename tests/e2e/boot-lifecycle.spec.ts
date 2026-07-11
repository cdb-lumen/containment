import { expect, test, type Page } from '@playwright/test';

const browserErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().includes('Failed to load resource: net::ERR_FAILED')
    ) {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
};

test('keeps optional skin failure nonfatal and re-enters boot without duplicate successful loads', async ({ page }) => {
  const errors = browserErrors(page);
  const requests = new Map<string, number>();

  await page.route('**/assets/characters/*-sheet.png', async (route) => {
    const fileName = new URL(route.request().url()).pathname.split('/').at(-1) ?? '';
    requests.set(fileName, (requests.get(fileName) ?? 0) + 1);
    if (fileName === 'crawler-sheet.png') {
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  await page.goto('/?renderer=canvas');
  await expect(page.getByRole('button', { name: 'Deploy' })).toBeAttached();

  const first = await page.evaluate(() => window.__ALIEN_BOOT__?.report);
  expect(first).toEqual({
    preloadRuns: 1,
    createRuns: 1,
    loadedSheets: [
      'skin-marine',
      'skin-brute',
      'skin-spitter',
      'skin-stalker',
      'skin-carrier',
      'skin-queen',
    ],
    fallbackSheets: ['skin-crawler'],
    nearestFilteredSheets: [
      'skin-marine',
      'skin-brute',
      'skin-spitter',
      'skin-stalker',
      'skin-carrier',
      'skin-queen',
    ],
  });

  await page.evaluate(() => window.__ALIEN_BOOT__?.restart());
  await expect.poll(() => page.evaluate(() => window.__ALIEN_BOOT__?.report.createRuns)).toBe(2);
  await expect(page.getByRole('button', { name: 'Deploy' })).toBeAttached();

  const second = await page.evaluate(() => window.__ALIEN_BOOT__?.report);
  expect(second).toEqual({ ...first, preloadRuns: 2, createRuns: 2 });
  expect(requests.get('crawler-sheet.png')).toBeGreaterThan(0);
  expect(Object.fromEntries([...requests].filter(([fileName]) => fileName !== 'crawler-sheet.png'))).toEqual({
    'marine-sheet.png': 1,
    'brute-sheet.png': 1,
    'spitter-sheet.png': 1,
    'stalker-sheet.png': 1,
    'carrier-sheet.png': 1,
    'queen-sheet.png': 1,
  });
  expect(errors).toEqual([]);
});
