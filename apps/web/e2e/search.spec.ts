import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('chercher un mot dans les messages ouvre la conversation sur ce message', async ({ page }) => {
  await signedIn(page);
  await page.goto('/chats');
  await page.getByRole('searchbox', { name: /Chercher dans tes discussions/ }).fill('Dakar');
  const results = page.getByRole('region', { name: 'Dans les messages' });
  await expect(results.locator('mark')).toHaveText('Dakar');
  await results.getByRole('link').click();
  await expect(page).toHaveURL(/\/chats\/jade\?message=m1$/);
  const bubble = page.locator('#message-m1 > div').first();
  await expect(bubble).toBeInViewport();
  await expect(bubble).toHaveClass(/ring-2/);
});
