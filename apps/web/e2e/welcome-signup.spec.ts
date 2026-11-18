import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import fr from '../src/shared/i18n/fr.json';

/** Aucune violation grave ou critique, comme l'exige docs/12-qualite-tests.md. */
async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const grave = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(grave.map((v) => `${v.id} : ${v.help}`)).toEqual([]);
}

test('de Bienvenue à Inscription', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectAccessible(page);

  await page.getByRole('link', { name: fr.welcome.start }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole('heading', { level: 1, name: fr.signup.title })).toBeVisible();
  await expectAccessible(page);
});
