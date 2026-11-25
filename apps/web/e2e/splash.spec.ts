import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test("l'écran de démarrage se joue une fois, se saute et laisse la place à Bienvenue", async ({
  page,
}) => {
  const start = Date.now();
  await page.goto('/');
  const splash = page.getByTestId('splash');
  await expect(splash).toBeVisible();
  await expect(splash).toBeHidden({ timeout: 4000 });
  expect(Date.now() - start).toBeLessThan(4000);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Même ouverture de l'appli : il ne revient pas.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(splash).toHaveCount(0);
});

test('un toucher saute la seconde ouverture', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ns.firstLaunchDone', '1'));
  await page.goto('/');
  await page.getByTestId('splash').click();
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 1000 });
});
