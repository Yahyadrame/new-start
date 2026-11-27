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
