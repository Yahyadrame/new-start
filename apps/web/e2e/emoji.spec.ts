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

  // La recherche porte sur toute la bibliothèque, en français (avec ou sans accents) et en anglais.
  const search = page.locator('em-emoji-picker input[type="search"]');
  for (const [word, emoji] of [
    ['giraffe', '🦒'],
    ['éléphant', '🐘'],
    ['elephant', '🐘'],
    ['coeur rouge', '❤️'],
    ['girafe', '🦒'],
  ] as const) {
    await search.fill(word);
    await expect(page.locator(`em-emoji-picker button[aria-label="${emoji}"]`)).toBeVisible();
  }
  await page.locator('em-emoji-picker button[aria-label="🦒"]').click();
  await expect(page.getByRole('textbox')).toHaveValue('🦒');
  await page.screenshot({ path: test.info().outputPath('emojis.png') });
  expect(outside).toEqual([]);
});
