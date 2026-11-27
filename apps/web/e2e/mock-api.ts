import type { Page } from '@playwright/test';

const jade = {
  slug: 'jade',
  name: 'Jade',
  initials: 'J',
  roleFr: 'Amie',
  category: 'DAILY',
  accent: 'en-US',
  bioFr: 'Ta colocataire.',
  interests: ['Séries'],
  level: 'B1',
};
const day = (n: number) => `2026-11-${String(15 + n).padStart(2, '0')}`;

/** Une session simulée et des réponses d'API fixes : on vérifie l'interface, pas le serveur. */
export async function signedIn(page: Page) {
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
            deleted: false,
            createdAt: '2026-11-21T09:01:00Z',
            correction: null,
          },
          {
            id: 'm1',
            author: 'USER',
            text: 'I go to Dakar yesterday.',
            translationFr: null,
            deleted: false,
            createdAt: '2026-11-21T09:00:00Z',
            correction: { better: 'I went to Dakar yesterday.', whyFr: 'Passé : went.' },
          },
        ],
        nextCursor: null,
      }),
    ),
  );
  await page.route('**/api/conversations/search*', (r) =>
    r.fulfill(
      json({
        items: [
          {
            messageId: 'm1',
            conversationId: 'c1',
            author: 'USER',
            excerpt: 'I go to Dakar yesterday.',
            createdAt: '2026-11-21T09:00:00Z',
            agent: { slug: 'jade', name: 'Jade', initials: 'J' },
          },
        ],
      }),
    ),
  );
  await page.route('**/api/conversations/c1/read', (r) => r.fulfill({ status: 204 }));
  await page.route('**/api/conversations/voice-availability', (r) =>
    r.fulfill(json({ available: true })),
  );
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
        interests: ['MUSIC'],
        birthYear: 2000,
        level: 'A2',
        theme: 'SYSTEM',
        reminderTime: null,
        timezone: 'Africa/Dakar',
        dailyGoalMin: 15,
        preferredAccent: 'en-US',
        dataSaver: false,
        chatBackground: 'NONE',
        avatar: null,
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
