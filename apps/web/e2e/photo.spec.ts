import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

const picture =
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#7aa7d9"/><circle cx="620" cy="140" r="70" fill="#f2c14e"/><path d="M0 600 280 260 500 520 620 400 800 600Z" fill="#3d6b4f"/></svg>';

test('les photos s’affichent dans la conversation, ou disent qu’elles manquent', async ({
  page,
}, info) => {
  await signedIn(page);
  const message = (id: string, url: string | null, replyTo: unknown = null) => ({
    id,
    author: 'USER',
    text: '',
    translationFr: null,
    deleted: false,
    createdAt: `2026-11-21T09:0${id.slice(1)}:00Z`,
    correction: { better: null, whyFr: null },
    replyTo,
    media: { kind: 'IMAGE', url, seconds: null },
  });
  const quote = { id: 'm1', author: 'USER', text: '', deleted: false, mediaKind: 'IMAGE' };
  await page.route('**/api/conversations/c1/messages*', (r) =>
    r.fulfill({
      json: {
        items: [message('m2', null, quote), message('m1', 'https://files.test/photo.svg')],
        nextCursor: null,
      },
    }),
  );
  await page.route('https://files.test/photo.svg', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', body: picture }),
  );

  await page.goto('/chats/jade');
  const photo = page.getByRole('img', { name: 'Photo envoyée' });
  await expect(photo).toBeVisible();
  expect((await photo.boundingBox())?.width).toBe(240);
  await expect(page.getByText('Photo indisponible')).toBeVisible();
  await expect(page.getByText('Rien à corriger')).toBeHidden();
  await page.screenshot({ path: info.outputPath('photos.png') });
});
