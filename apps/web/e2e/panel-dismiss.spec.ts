import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('le panneau se ferme avec Échap ou au toucher en dehors', async ({ page }, info) => {
  await signedIn(page);
  await page.goto('/chats/jade');
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
  const open = page.getByRole('button', { name: desktop ? 'Émojis et stickers' : 'Stickers' });
  const keyboard = page.getByRole('button', { name: 'Clavier' });

  await open.click();
  if (desktop) {
    await expect(page.getByRole('tab', { name: 'Émojis' })).toBeFocused();
    await page.screenshot({ path: info.outputPath('panneau-focus.png') });
  }
  await page.keyboard.press('Escape');
  await expect(keyboard).toBeHidden();
  await expect(open).toBeFocused();

  await open.click();
  await expect(keyboard).toBeVisible();
  await page.getByText('Nice! Where are you going?').click();
  await expect(keyboard).toBeHidden();
});
