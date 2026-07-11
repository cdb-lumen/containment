import { expect, test } from '@playwright/test';

test('serves the production artifact from the GitHub Pages subpath', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  const response = await page.goto(
    'http://127.0.0.1:4175/alien-shooter-containment/',
  );
  expect(response?.ok()).toBe(true);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deploy' })).toBeAttached();
  expect(await page.evaluate(() => window.__ALIEN_GAME__)).toBeUndefined();

  const assetChecks = await page.evaluate(async () => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href;
    const social = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;
    const localSocial = new URL('social-card.png', location.href).href;
    const [iconResponse, socialResponse] = await Promise.all([
      fetch(icon ?? ''),
      fetch(localSocial),
    ]);
    return {
      iconPath: new URL(icon ?? location.href).pathname,
      socialPath: new URL(social ?? location.href).pathname,
      socialOrigin: new URL(social ?? location.href).origin,
      iconOk: iconResponse.ok,
      socialOk: socialResponse.ok,
      iconType: iconResponse.headers.get('content-type'),
      socialType: socialResponse.headers.get('content-type'),
    };
  });
  expect(assetChecks.iconPath).toBe('/alien-shooter-containment/favicon.svg');
  expect(assetChecks.socialPath).toBe('/alien-shooter-containment/social-card.png');
  expect(assetChecks.socialOrigin).toBe('https://cdb-lumen.github.io');
  expect(assetChecks.iconOk).toBe(true);
  expect(assetChecks.socialOk).toBe(true);
  expect(assetChecks.iconType).toBe('image/svg+xml');
  expect(assetChecks.socialType).toBe('image/png');
  const missingResponse = await request.get(
    'http://127.0.0.1:4175/alien-shooter-containment/missing-asset.png',
  );
  expect(missingResponse.status()).toBe(404);

  await page.getByRole('button', { name: 'Deploy' }).focus();
  await expect(page.getByRole('button', { name: 'Deploy' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Deploy' })).toBeHidden();
  expect(errors).toEqual([]);
});
