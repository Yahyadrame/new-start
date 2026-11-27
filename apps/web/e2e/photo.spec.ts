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

test('une photo choisie est réduite en JPEG puis envoyée', async ({ page }, info) => {
  await signedIn(page);
  let upload: { type: string | undefined; body: Buffer | null } | undefined;
  await page.route('**/api/conversations/c1/media*', (r) => {
    upload = { type: r.request().headers()['content-type'], body: r.request().postDataBuffer() };
    return r.fulfill({
      status: 201,
      json: {
        id: 'm9',
        author: 'USER',
        text: '',
        translationFr: null,
        deleted: false,
        createdAt: new Date().toISOString(),
        correction: null,
        media: { kind: 'IMAGE', url: 'https://files.test/photo.svg', seconds: null },
      },
    });
  });
  await page.route('https://files.test/photo.svg', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', body: picture }),
  );
  await page.goto('/chats/jade');
  await expect(page.getByRole('button', { name: 'Envoyer une photo' })).toBeVisible();

  // Une grande image, comme celle d'un téléphone.
  const large = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 3200;
    canvas.height = 2400;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.fillStyle = '#3d6b4f';
    context.fillRect(0, 0, 3200, 2400);
    return canvas.toDataURL('image/png').split(',')[1] as string;
  });
  const choosing = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Envoyer une photo' }).click();
  await (
    await choosing
  ).setFiles({ name: 'plage.png', mimeType: 'image/png', buffer: Buffer.from(large, 'base64') });
  await expect(page.getByText('Photo prête à envoyer')).toBeVisible();
  await page.screenshot({ path: info.outputPath('photo-prete.png') });
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Photo envoyée' })).toBeVisible();

  expect(upload?.type).toBe('image/jpeg');
  const size = await page.evaluate(
    async (base64) => {
      const blob = await (await fetch(`data:image/jpeg;base64,${base64}`)).blob();
      const image = await createImageBitmap(blob);
      return [image.width, image.height];
    },
    upload?.body?.toString('base64') ?? '',
  );
  expect(size).toEqual([1600, 1200]);
});
