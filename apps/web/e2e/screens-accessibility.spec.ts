import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { signedIn } from './mock-api';

/** Aucune violation grave ou critique, comme l'exige docs/12-qualite-tests.md. */
async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const grave = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    grave.map(
      (v) =>
        `${v.id} : ${v.help} → ${v.nodes.map((n) => n.target.join(' ') + ' ' + (n.any[0]?.message ?? '') + ' ' + n.html.slice(0, 120)).join(' ; ')}`,
    ),
  ).toEqual([]);
}

for (const [path, heading] of [
  ['/chats', 'Discussions'],
  ['/explore', 'Explorer'],
  ['/progress', 'Progrès'],
  ['/games', 'Jeux'],
  ['/chats/jade', 'Conversation'],
  ['/series', 'Série'],
  ['/plans', 'Abonnement'],
  ['/terms', "Conditions d'utilisation"],
  ['/privacy', 'Politique de confidentialité'],
  ['/notifications', 'Notifications'],
  ['/profile', 'Profil'],
] as const) {
  test(`l'écran ${heading} est accessible`, async ({ page }) => {
    await signedIn(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectAccessible(page);
  });
}

test("l'écran Code de l'inscription est accessible", async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      'ns_pending_signup',
      JSON.stringify({
        firstName: 'Awa',
        phone: '+221771234567',
        goal: 'TRAVEL',
        birthYear: 2000,
        acceptTerms: true,
        smsOptIn: false,
        voiceConsent: false,
        email: 'awa@example.test',
      }),
    ),
  );
  await page.goto('/signup/code');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectAccessible(page);
});

test('le test de niveau est accessible', async ({ page }) => {
  await signedIn(page);
  await page.goto('/onboarding/level');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectAccessible(page);
});

test('le résultat du test de niveau est accessible', async ({ page }) => {
  await signedIn(page);
  await page.route('**/api/onboarding/level-test/answer', (r) =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        done: true,
        level: 'B1',
        justification: 'Tu te fais comprendre sans effort sur des sujets familiers.',
        strengths: ['Vocabulaire du quotidien', 'Phrases simples justes', 'Bonne prise de parole'],
        weaknesses: ['Temps du passé', 'Prépositions', 'Phrases plus longues'],
      }),
    }),
  );
  await page.goto('/onboarding/level');
  await page.getByRole('textbox').fill('I live in Dakar and I like football.');
  await page.getByRole('button', { name: 'Envoyer' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'B1' })).toBeVisible();
  await expectAccessible(page);
});
