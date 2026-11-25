import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('la liste des discussions reste en place quand la conversation défile (ordinateur)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await signedIn(page);
  await page.goto('/chats/jade');
  const title = page.getByRole('heading', { name: 'Discussions' });
  await expect(title).toBeVisible();
  // Une longue conversation : on allonge le volet de droite.
  await page.evaluate(() => {
    const panes = document.querySelectorAll('main');
    panes[panes.length - 1]?.setAttribute('style', 'min-height: 4000px');
  });
  const before = await title.boundingBox();
  await page.mouse.wheel(0, 1500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1000);
  expect((await title.boundingBox())?.y).toBe(before?.y);
});
