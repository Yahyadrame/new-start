import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('un sticker envoyé revient dans les récents, même après rechargement', async ({
  page,
}, info) => {
  await signedIn(page);
  await page.goto('/chats/jade');
  const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
  const open = async () => {
    await page.getByRole('button', { name: desktop ? 'Émojis et stickers' : 'Stickers' }).click();
    if (desktop) await page.getByRole('tab', { name: 'Stickers' }).click();
  };
  const recents = page.getByRole('region', { name: 'Récents' });

  await open();
  await expect(recents).toHaveCount(0);
  await page.getByRole('button', { name: 'Envoyer le sticker Bye!' }).click();
  await page.reload();
  await open();
  await expect(recents.getByRole('button', { name: 'Envoyer le sticker Bye!' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('stickers-recents.png') });
});
