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
