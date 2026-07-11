import { expect, test, type Page } from '@playwright/test';

type DeathDiagnostics = Readonly<{
  activeEnemies: number;
  effectCounts: Readonly<{ decals: number; remains: number }>;
  effectLimits: Readonly<{ decals: number; remains: number }>;
  bloodDisplayCount: number;
  corpseDisplayCount: number;
  activeCorpseFamilies: readonly string[];
  activeCorpseIds: readonly number[];
  bloodAllocatedCount: number;
  corpseAllocatedCount: number;
  spawnStressEnemies(count: number): number;
  defeatStressEnemies(count: number): number;
}>;

const diagnostics = (page: Page) => page.evaluate(() => {
  const value = window.__ALIEN_GAME__ as unknown as DeathDiagnostics;
  return {
    activeEnemies: value.activeEnemies,
    effectCounts: value.effectCounts,
    effectLimits: value.effectLimits,
    bloodDisplayCount: value.bloodDisplayCount,
    corpseDisplayCount: value.corpseDisplayCount,
    activeCorpseFamilies: value.activeCorpseFamilies,
    activeCorpseIds: value.activeCorpseIds,
    bloodAllocatedCount: value.bloodAllocatedCount,
    corpseAllocatedCount: value.corpseAllocatedCount,
    facadeFrozen: Object.isFrozen(value),
    countsFrozen: Object.isFrozen(value.effectCounts),
    limitsFrozen: Object.isFrozen(value.effectLimits),
    familiesFrozen: Object.isFrozen(value.activeCorpseFamilies),
    corpseIdsFrozen: Object.isFrozen(value.activeCorpseIds),
  };
});

const pageErrors = new WeakMap<Page, string[]>();

const watchErrors = (page: Page): string[] => {
  const existing = pageErrors.get(page);
  if (existing) return existing;
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request =>
    errors.push(`request: ${request.url()} ${request.failure()?.errorText}`));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`response: ${response.status()} ${response.url()}`);
  });
  return errors;
};

const invoke = (page: Page, action: 'spawn' | 'defeat', count: number) =>
  page.evaluate(({ action, count }) => {
    const value = window.__ALIEN_GAME__ as unknown as DeathDiagnostics;
    return action === 'spawn'
      ? value.spawnStressEnemies(count)
      : value.defeatStressEnemies(count);
  }, { action, count });

test.beforeEach(async ({ page }) => {
  watchErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  const deploy = page.getByRole('button', { name: 'Deploy' });
  await deploy.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.phase)).toBe('arrival');
});

test('real enemy deaths saturate retained blood and corpse pools through authoritative runtime paths', async ({ page }) => {
  expect(await invoke(page, 'spawn', 150)).toBe(150);
  let before = await diagnostics(page);
  expect(before.activeEnemies).toBe(150);
  expect(await invoke(page, 'defeat', 150)).toBe(150);
  let after = await diagnostics(page);
  expect(after.activeEnemies).toBeLessThan(before.activeEnemies);
  const firstCorpseIds = after.activeCorpseIds;
  expect(firstCorpseIds).toHaveLength(32);

  expect(await invoke(page, 'spawn', 150)).toBe(150);
  before = await diagnostics(page);
  expect(await invoke(page, 'defeat', 150)).toBe(150);
  after = await diagnostics(page);
  expect(after.activeEnemies).toBeLessThan(before.activeEnemies);
  expect(after.effectCounts).toEqual({ decals: 128, remains: 32 });
  expect(after.effectLimits).toEqual(expect.objectContaining({ decals: 128, remains: 32 }));
  expect(after.bloodDisplayCount).toBe(128);
  expect(after.corpseDisplayCount).toBe(32);
  expect(after.activeCorpseIds).toHaveLength(32);
  expect(after.activeCorpseIds).not.toEqual(firstCorpseIds);
  expect(after.activeCorpseIds.every(id => !firstCorpseIds.includes(id))).toBe(true);
  expect(Math.max(...after.activeCorpseIds)).toBeGreaterThan(Math.max(...firstCorpseIds));
  expect(new Set(after.activeCorpseFamilies).size).toBeGreaterThan(1);
  expect(after.bloodAllocatedCount).toBeLessThanOrEqual(128);
  expect(after.corpseAllocatedCount).toBeLessThanOrEqual(32);
  expect(after.facadeFrozen && after.countsFrozen && after.limitsFrozen && after.familiesFrozen && after.corpseIdsFrozen).toBe(true);
  expect(watchErrors(page)).toEqual([]);
});

// Counts are intentionally bounded before they reach the runtime.
test('stress actions normalize invalid and oversized counts', async ({ page }) => {
  expect(await invoke(page, 'spawn', Number.NaN)).toBe(0);
  expect(await invoke(page, 'spawn', -4)).toBe(0);
  expect(await invoke(page, 'spawn', 999)).toBe(150);
  expect(await invoke(page, 'defeat', 999)).toBe(150);
  expect(watchErrors(page)).toEqual([]);
});

test('live quality trim, pause, comfort settings, and restart reconcile death visuals', async ({ page }) => {
  await invoke(page, 'spawn', 150);
  await invoke(page, 'defeat', 150);
  const saturated = await diagnostics(page);
  expect(saturated.effectCounts).toEqual({ decals: 128, remains: 32 });

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Mission paused' })).toBeVisible();
  await page.getByLabel('Quality').selectOption('medium');
  await expect.poll(() => diagnostics(page).then(value => value.effectCounts)).toEqual({ decals: 64, remains: 16 });
  let trimmed = await diagnostics(page);
  expect(trimmed.bloodDisplayCount).toBe(64);
  expect(trimmed.corpseDisplayCount).toBe(16);

  await page.getByLabel('Quality').selectOption('low');
  await expect.poll(() => diagnostics(page).then(value => value.effectCounts)).toEqual({ decals: 32, remains: 8 });
  trimmed = await diagnostics(page);
  expect(trimmed.bloodDisplayCount).toBe(32);
  expect(trimmed.corpseDisplayCount).toBe(8);

  const pausedMetadata = JSON.stringify(trimmed);
  await page.waitForTimeout(750);
  expect(JSON.stringify(await diagnostics(page))).toBe(pausedMetadata);

  await page.getByLabel('Reduce bright flashes').check();
  const reducedFlash = await diagnostics(page);
  expect(reducedFlash.effectCounts).toEqual(trimmed.effectCounts);
  expect(reducedFlash.activeCorpseFamilies).toEqual(trimmed.activeCorpseFamilies);
  expect(reducedFlash.bloodDisplayCount).toBe(trimmed.bloodDisplayCount);

  await page.evaluate(() => {
    const old = window.__ALIEN_GAME__;
    window.__ALIEN_OLD_FACADE__ = old;
    old?.restart();
  });
  await expect.poll(() => diagnostics(page).then(value => value.effectCounts)).toEqual({ decals: 0, remains: 0 });
  expect(await page.evaluate(() => window.__ALIEN_GAME__ !== window.__ALIEN_OLD_FACADE__)).toBe(true);
  const restarted = await diagnostics(page);
  expect(restarted.bloodDisplayCount).toBe(0);
  expect(restarted.corpseDisplayCount).toBe(0);
  await invoke(page, 'spawn', 1);
  await invoke(page, 'defeat', 1);
  expect((await diagnostics(page)).effectCounts).toEqual({ decals: 1, remains: 1 });
  expect(watchErrors(page)).toEqual([]);
});

test('reduced motion preserves static corpse and blood aftermath', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  const deployButton = page.getByRole('button', { name: 'Deploy' });
  await deployButton.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.phase)).toBe('arrival');
  await expect.poll(() => page.evaluate(() => window.__ALIEN_GAME__?.reducedMotion)).toBe(true);
  await invoke(page, 'spawn', 12);
  await invoke(page, 'defeat', 12);
  const aftermath = await diagnostics(page);
  expect(aftermath.effectCounts).toEqual({ decals: 12, remains: 12 });
  expect(aftermath.bloodDisplayCount).toBe(12);
  expect(aftermath.corpseDisplayCount).toBe(12);
  expect(aftermath.activeCorpseFamilies.length).toBeGreaterThan(1);
  expect(errors).toEqual([]);
  await context.close();
});

declare global {
  interface Window { __ALIEN_OLD_FACADE__?: unknown }
}
