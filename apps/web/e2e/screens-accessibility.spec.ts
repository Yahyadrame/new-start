import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Aucune violation grave ou critique, comme l'exige docs/12-qualite-tests.md. */
async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const grave = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(grave.map((v) => `${v.id} : ${v.help}`)).toEqual([]);
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
  await page.route('**/api/topics', (r) =>
    r.fulfill(json([{ slug: 'travel', nameFr: 'Voyage', agentCount: 1 }])),
  );
  await page.route('**/api/agents*', (r) => r.fulfill(json([{ ...jade, topic: null }])));
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
] as const) {
  test(`l'écran ${heading} est accessible`, async ({ page }) => {
    await signedIn(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectAccessible(page);
  });
}
