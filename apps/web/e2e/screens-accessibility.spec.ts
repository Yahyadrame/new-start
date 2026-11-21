import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

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

const jade = { slug: 'jade', name: 'Jade', initials: 'J', roleFr: 'Amie', category: 'DAILY' };
const day = (n: number) => `2026-11-${String(15 + n).padStart(2, '0')}`;

/** Une session simulée et des réponses d'API fixes : on vérifie l'interface, pas le serveur. */
async function signedIn(page: Page) {
  const json = (body: unknown) => ({ contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/auth/refresh', (r) =>
    r.fulfill(
      json({
        accessToken: 'jeton-de-test',
        expiresInSeconds: 900,
        user: { id: 'u1', firstName: 'Awa', goal: 'TRAVEL', level: 'A2' },
      }),
    ),
  );
  await page.route('**/api/conversations', (r) =>
    r.fulfill(
      json([
        {
          id: 'c1',
          agent: jade,
          lastMessage: { author: 'AGENT', text: 'See you tomorrow!' },
          lastMessageAt: '2026-11-21T09:00:00Z',
          unreadCount: 2,
        },
      ]),
    ),
  );
  await page.route('**/api/conversations/c1/messages*', (r) =>
    r.fulfill(
      json({
        items: [
          {
            id: 'm2',
            author: 'AGENT',
            text: 'Nice! Where are you going?',
            translationFr: null,
            createdAt: '2026-11-21T09:01:00Z',
            correction: null,
          },
          {
            id: 'm1',
            author: 'USER',
            text: 'I go to Dakar yesterday.',
            translationFr: null,
            createdAt: '2026-11-21T09:00:00Z',
            correction: { better: 'I went to Dakar yesterday.', whyFr: 'Passé : went.' },
          },
        ],
        nextCursor: null,
      }),
    ),
  );
  await page.route('**/api/conversations/c1/read', (r) => r.fulfill({ status: 204 }));
  await page.route('**/api/topics', (r) =>
    r.fulfill(json([{ slug: 'travel', nameFr: 'Voyage', agentCount: 1 }])),
  );
  await page.route('**/api/agents*', (r) => r.fulfill(json([{ ...jade, topic: null }])));
  await page.route('**/api/notifications/unread-count', (r) => r.fulfill(json({ count: 2 })));
  await page.route('**/api/notifications', (r) =>
    r.fulfill(
      json([
        {
          id: 'n1',
          kind: 'reminder',
          title: 'Ton rappel du jour',
          body: 'Quelques minutes d’anglais aujourd’hui ? Ta série compte sur toi.',
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: 'n2',
          kind: 'reminder',
          title: 'Ton rappel du jour',
          body: 'Quelques minutes d’anglais aujourd’hui ? Ta série compte sur toi.',
          createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
          read: true,
        },
      ]),
    ),
  );
  await page.route('**/api/me', (r) =>
    r.fulfill(
      json({
        id: 'u1',
        firstName: 'Awa',
        goal: 'TRAVEL',
        level: 'A2',
        theme: 'SYSTEM',
        reminderTime: null,
        timezone: 'Africa/Dakar',
        dailyGoalMin: 15,
        preferredAccent: 'en-US',
        dataSaver: false,
        pausedUntil: null,
      }),
    ),
  );
  await page.route('**/api/notebook', (r) =>
    r.fulfill(
      json([
        {
          id: 'e1',
          original: 'I go to Dakar yesterday.',
          better: 'I went to Dakar yesterday.',
          whyFr: 'Passé : went.',
          createdAt: '2026-11-20T09:00:00Z',
        },
      ]),
    ),
  );
  await page.route('**/api/reviews/due', (r) =>
    r.fulfill(
      json([{ id: 'c1', expressionId: 1, text: 'You know', meaningFr: 'tu sais', due: day(0) }]),
    ),
  );
  await page.route('**/api/games/daily', (r) =>
    r.fulfill(
      json({
        day: '2026-11-21',
        done: false,
        questions: [
          {
            kind: 'TRUE_FALSE',
            expressionId: 1,
            text: 'You know',
            meaningFr: 'tu sais',
            answer: true,
          },
        ],
      }),
    ),
  );
  await page.route('**/api/progress', (r) =>
    r.fulfill(
      json({
        xp: 250,
        level: 3,
        levelXp: 50,
        nextLevelXp: 100,
        streakDays: 4,
        week: Array.from({ length: 7 }, (_, i) => ({ day: day(i), minutes: i * 3 })),
        figures: { messages: 21, games: 5, weekXp: 130, activeDays: 4 },
      }),
    ),
  );
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
