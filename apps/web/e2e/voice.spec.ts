import { expect, test } from '@playwright/test';
import { signedIn } from './mock-api';

// Un faux micro de Chromium : le navigateur enregistre pour de vrai, sans matériel.
test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

test('le micro demande l’accord avant d’enregistrer', async ({ page }, info) => {
  await signedIn(page);
  const saved: unknown[] = [];
  await page.route('**/api/onboarding/voice-consent', (r) => {
    if (r.request().method() === 'GET') return r.fulfill({ json: { accepted: false } });
    saved.push(r.request().postDataJSON());
    return r.fulfill({ status: 204 });
  });
  await page.goto('/chats/jade');
  const mic = page.getByRole('button', { name: 'Enregistrer un message vocal' });
  const dialog = page.getByRole('dialog', { name: 'Envoyer des messages vocaux ?' });
  const timer = page.getByRole('timer', { name: 'Enregistrement en cours' });

  await mic.click();
  await expect(dialog).toContainText('pour que Jade puisse te répondre');
  await page.screenshot({ path: info.outputPath('accord-vocal.png') });
  await dialog.getByRole('button', { name: 'Écrire plutôt' }).click();
  await expect(dialog).toBeHidden();
  await expect(timer).toBeHidden();
  // Le focus revient au micro au lieu de se perdre (clavier et lecteurs d'écran).
  await expect(mic).toBeFocused();
  expect(saved).toEqual([]);

  await mic.click();
  await dialog.getByRole('button', { name: "J'accepte, activer le micro" }).click();
  await expect(timer).toBeVisible();
  expect(saved).toEqual([{ accepted: true }]);
});

test('un vocal enregistré part avec sa durée', async ({ page }, info) => {
  await signedIn(page);
  await page.route('**/api/onboarding/voice-consent', (r) =>
    r.fulfill({ json: { accepted: true } }),
  );
  let upload: { url: string; type: string | undefined; size: number } | undefined;
  await page.route('**/api/conversations/c1/media*', (r) => {
    const sent = r.request();
    upload = {
      url: sent.url(),
      type: sent.headers()['content-type'],
      size: sent.postDataBuffer()?.length ?? 0,
    };
    return r.fulfill({
      status: 201,
      json: {
        id: 'm9',
        author: 'USER',
        text: 'I went to the beach yesterday',
        translationFr: null,
        deleted: false,
        createdAt: new Date().toISOString(),
        correction: null,
        media: { kind: 'AUDIO', url: null, seconds: 1 },
      },
    });
  });
  await page.goto('/chats/jade');

  await page.getByRole('button', { name: 'Enregistrer un message vocal' }).click();
  await expect(page.getByRole('timer', { name: 'Enregistrement en cours' })).toContainText('0:01');
  await page.getByRole('button', { name: "Terminer l'enregistrement" }).click();
  await expect(page.getByLabel(/^Message vocal, 0:0\d$/)).toBeVisible();
  await page.screenshot({ path: info.outputPath('vocal-pret.png') });
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
  await page.getByRole('button', { name: 'Voir le texte' }).click();
  await expect(page.getByText('I went to the beach yesterday')).toBeVisible();

  const query = new URL(upload?.url ?? '').searchParams;
  expect(query.get('clientId')).toMatch(/^[0-9a-f-]{36}$/);
  expect(query.get('seconds')).toMatch(/^\d$/);
  // L'onde est calculée par le vrai décodeur du navigateur, à partir du vrai enregistrement.
  const peaks = query.get('peaks')?.split(',').map(Number) ?? [];
  expect(peaks).toHaveLength(40);
  expect(peaks.every((p) => Number.isInteger(p) && p >= 0 && p <= 100)).toBe(true);
  expect(upload?.type).toMatch(/^audio\//);
  expect(upload?.size).toBeGreaterThan(0);
});

test('un micro indisponible dit pourquoi, et les photos restent', async ({ page }, info) => {
  await signedIn(page);
  await page.route('**/api/conversations/voice-availability', (r) =>
    r.fulfill({ json: { available: false, reason: 'quota' } }),
  );
  await page.goto('/chats/jade');
  const mic = page.getByRole('button', { name: 'Enregistrer un message vocal' });

  await expect(mic).toHaveAttribute('aria-disabled', 'true');
  // `force` : Playwright refuse sinon de toucher un bouton annoncé indisponible.
  await mic.click({ force: true });
  await expect(page.getByRole('status')).toContainText('Tu as envoyé tes vocaux du jour.');
  await expect(page.getByRole('timer')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Envoyer une photo' })).toBeVisible();
  await page.screenshot({ path: info.outputPath('micro-indisponible.png') });
});

/** Un WAV muet de deux secondes : assez pour que le navigateur le lise vraiment. */
function silence(seconds = 2, rate = 8000) {
  const size = seconds * rate;
  const wav = Buffer.alloc(44 + size, 128);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + size, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // mono
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(size, 40);
  return wav;
}

test('un vocal se lit dans la bulle, avec ses paroles à la demande', async ({ page }, info) => {
  await signedIn(page);
  const voice = (id: string, text: string, media: object) => ({
    id,
    author: 'USER',
    text,
    translationFr: null,
    deleted: false,
    createdAt: '2026-11-21T09:00:00Z',
    correction: null,
    media: { kind: 'AUDIO', seconds: 2, ...media },
  });
  const peaks = Array.from({ length: 40 }, (_, i) => 20 + ((i * 37) % 81));
  await page.route('**/api/conversations/c1/messages*', (r) =>
    r.fulfill({
      json: {
        items: [
          voice('m2', 'I am on my way', {
            url: 'https://stockage.test/vocal.wav',
            peaks,
          }),
          voice('m1', 'See you soon', { url: null, expired: true }),
        ],
        nextCursor: null,
      },
    }),
  );
  let downloads = 0;
  await page.route('https://stockage.test/vocal.wav', (r) => {
    downloads += 1;
    return r.fulfill({ contentType: 'audio/wav', body: silence() });
  });
  await page.goto('/chats/jade');
  const play = page.getByRole('button', { name: 'Écouter le vocal' });

  await expect(page.getByText('Vocal expiré')).toBeVisible();
  // L'onde est dessinée à partir des barres gardées, sans toucher au fichier.
  await expect(page.locator('canvas').first()).toBeVisible();
  expect(downloads).toBe(0);
  const box = await play.boundingBox();
  expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  // L'onde reste sur la ligne du bouton : la bulle conserve les blancs du texte, pas le lecteur.
  // `poll` : wavesurfer remplace ses canvas quand il redessine.
  await expect
    .poll(async () => {
      const wave = await page.locator('canvas').first().boundingBox();
      if (!wave || !box) return false;
      const middle = wave.y + wave.height / 2;
      return middle > box.y && middle < box.y + box.height;
    })
    .toBe(true);

  await expect(page.getByText('I am on my way')).toBeHidden();
  await page.screenshot({ path: info.outputPath('vocal-bulle.png') });
  await page.getByRole('button', { name: 'Voir le texte' }).last().click();
  await expect(page.getByText('I am on my way')).toBeVisible();
  await page.screenshot({ path: info.outputPath('vocal-texte.png') });

  await play.click();
  await expect(page.getByRole('button', { name: 'Mettre en pause' })).toBeVisible();
  expect(downloads).toBeGreaterThan(0);
  // La lecture va au bout, puis le bouton revient.
  await expect(play).toBeVisible({ timeout: 10_000 });
});
