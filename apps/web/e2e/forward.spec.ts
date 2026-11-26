import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

test('on transfère un message à plusieurs contacts cochés', async ({ page }, info) => {
  await signedIn(page);
  const conversation = (id: string, slug: string, name: string) => ({
    id,
    agent: { slug, name, initials: name[0], roleFr: 'Ami', category: 'DAILY' },
    lastMessage: null,
    lastMessageAt: '2026-11-21T09:00:00Z',
    unreadCount: 0,
  });
  await page.route('**/api/conversations', (r) =>
    r.fulfill({
      json: [
        conversation('c1', 'jade', 'Jade'),
        conversation('c2', 'lea', 'Léa'),
        conversation('c3', 'marcus', 'Marcus'),
      ],
    }),
  );
  const received: string[] = [];
  await page.route(/\/api\/conversations\/c[23]\/messages$/, (r) => {
    received.push(new URL(r.request().url()).pathname.split('/')[3] ?? '');
    return r.fulfill({ status: 201, json: {} });
  });

  await page.goto('/chats/jade');
  await page.getByRole('button', { name: 'Actions du message' }).first().click();
  await page.getByRole('button', { name: 'Transférer' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: 'Léa' }).check();
  await dialog.getByRole('checkbox', { name: 'Marcus' }).check();
  await page.screenshot({ path: info.outputPath('transfert.png') });
  await dialog.getByRole('button', { name: 'Transférer (2)' }).click();
  await expect(dialog).toBeHidden();
  expect(received).toEqual(['c2', 'c3']);
});
