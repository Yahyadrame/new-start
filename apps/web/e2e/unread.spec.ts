import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('une réponse arrivée après coup apparaît non lue dans la liste, sans recharger', async ({
  page,
}, info) => {
  await signedIn(page);
  let replied = false;
  let reads = 0;
  await page.route('**/api/conversations', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'c1',
          agent: { slug: 'jade', name: 'Jade', initials: 'J', roleFr: 'Amie', category: 'DAILY' },
          lastMessage: { author: 'AGENT', text: replied ? 'Are you there?' : 'See you tomorrow!' },
          lastMessageAt: '2026-11-21T09:00:00Z',
          unreadCount: replied ? 1 : 0,
        },
      ]),
    }),
  );
  await page.route('**/api/conversations/c1/read', (r) => {
    reads += 1;
    return r.fulfill({ status: 204 });
  });
  await page.goto('/chats');
  await expect(page.getByText('See you tomorrow!')).toBeVisible();

  replied = true;
  await expect(page.getByLabel('1 non lus')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Are you there?')).toBeVisible();
  expect(reads).toBe(0);
  await page.screenshot({ path: info.outputPath('non-lus.png') });
});
