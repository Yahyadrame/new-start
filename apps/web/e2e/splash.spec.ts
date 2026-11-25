import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test("l'écran de démarrage se joue, puis revient à chaque rechargement", async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  const splash = page.getByTestId('splash');
  await expect(splash).toBeVisible();
  await expect(splash).toBeHidden({ timeout: 4000 });
  expect(Date.now() - start).toBeLessThan(4000);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Chaque rechargement le rejoue, en piste courte (NS-043).
  await page.reload();
  await expect(page.getByTestId('splash')).toBeVisible();
  await expect(page.getByTestId('splash')).toBeHidden({ timeout: 3000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('un toucher saute la seconde ouverture', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ns.firstLaunchDone', '1'));
  await page.goto('/');
  await page.getByTestId('splash').click();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 1000 });
});
