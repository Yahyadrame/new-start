import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('sur ordinateur, la liste complète d’émojis complète le message', async ({
  page,
  isMobile,
}) => {
  const outside: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('jsdelivr')) outside.push(r.url());
  });
  await signedIn(page);
  await page.goto('/chats/jade');
  await page.getByRole('button', { name: isMobile ? 'Stickers' : 'Émojis et stickers' }).click();

  // Sur téléphone, le clavier propose déjà les émojis : le panneau n'a que les stickers.
  if (isMobile) {
    await expect(page.getByRole('searchbox', { name: 'Chercher un sticker' })).toBeVisible();
    await expect(page.locator('em-emoji-picker')).toHaveCount(0);
    return;
  }

  // La recherche porte sur toute la bibliothèque ; ses mots-clés sont en anglais.
  await page.locator('em-emoji-picker input[type="search"]').fill('giraffe');
  await page.locator('em-emoji-picker button[aria-label="🦒"]').click();
  await expect(page.getByRole('textbox')).toHaveValue('🦒');
  await page.screenshot({ path: test.info().outputPath('emojis.png') });
  expect(outside).toEqual([]);
});
