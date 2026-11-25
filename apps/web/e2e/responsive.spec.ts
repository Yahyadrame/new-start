import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

const SCREENS = [
  '/chats',
  '/chats/jade',
  '/explore',
  '/progress',
  '/games',
  '/series',
  '/notifications',
  '/profile',
  '/plans',
  '/terms',
  '/privacy',
  '/onboarding/level',
] as const;
const PUBLIC = ['/', '/login', '/signup'] as const;
const WIDTHS = [320, 375, 768, 1280] as const;

for (const width of WIDTHS) {
  for (const path of SCREENS) {
    test(`${path} ne déborde pas à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await signedIn(page);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

for (const width of WIDTHS) {
  for (const path of PUBLIC) {
    test(`${path} (déconnecté) ne déborde pas à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test('un mot très long dans la barre d’écriture ne fait pas déborder la conversation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await signedIn(page);
  await page.goto('/chats/jade');
  const field = page.getByLabel('Ton message');
  await field.fill('a'.repeat(300));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const box = await field.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
});
