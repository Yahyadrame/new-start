import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('sur ordinateur, ouvrir une fenêtre ne pousse pas la page sous le rail', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 1024, 'le rail n’existe qu’à partir de 1024 px');
  await signedIn(page);
  await page.goto('/chats/jade');
  await page.getByRole('button', { name: 'Actions du message' }).first().click();
  const left = async () => (await page.locator('main').first().boundingBox())?.x;
  expect(await left()).toBe(72);
  await page.getByRole('button', { name: 'Transférer' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await left()).toBe(72);
});
