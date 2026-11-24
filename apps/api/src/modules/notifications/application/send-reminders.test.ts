import { describe, expect, it, vi } from 'vitest';
import type { PushSender } from '../../../shared/push/push.js';
import type { PushSubscriptionsStore } from './push-subscriptions.js';
import {
  REMINDER_URL,
  REMINDER_BODY,
  REMINDER_TITLE,
  SendReminders,
  type ReminderCandidate,
  type RemindersStore,
} from './send-reminders.js';

// 19 h 30 à Dakar (UTC+0 l'hiver), le 21 novembre 2026.
const now = new Date('2026-11-21T19:30:00Z');
const candidate = (over: Partial<ReminderCandidate> = {}): ReminderCandidate => ({
  userId: 'u1',
  reminderTime: '19:00',
  timezone: 'Africa/Dakar',
  lastActiveDay: '2026-11-20',
  lastReminderDay: null,
  pausedUntil: null,
  ...over,
});
const make = (list: ReminderCandidate[], recorded = true) => {
  const record = vi.fn().mockResolvedValue(recorded);
  const store: RemindersStore = { candidates: async () => list, record };
  return { record, service: new SendReminders(store) };
};

describe('SendReminders', () => {
  it('écrit le rappel du jour de la personne dont l’heure est passée', async () => {
    const { service, record } = make([candidate()]);
    expect(await service.execute(now)).toBe(1);
    expect(record).toHaveBeenCalledWith('u1', '2026-11-21', REMINDER_TITLE, REMINDER_BODY);
  });

  it('ignore ceux qui ont pratiqué, déjà reçu leur rappel, sont en pause ou sans heure', async () => {
    const { service, record } = make([
      candidate({ userId: 'a', lastActiveDay: '2026-11-21' }),
      candidate({ userId: 'b', lastReminderDay: '2026-11-21' }),
      candidate({ userId: 'c', pausedUntil: new Date('2026-11-25T00:00:00Z') }),
      candidate({ userId: 'd', reminderTime: null }),
      candidate({ userId: 'e', reminderTime: '21:00' }),
    ]);
    expect(await service.execute(now)).toBe(0);
    expect(record).not.toHaveBeenCalled();
  });

  it('ne compte pas un rappel déjà écrit (deux passages le même jour)', async () => {
    const { service } = make([candidate()], false);
    expect(await service.execute(now)).toBe(0);
  });

  it('calcule le jour dans le fuseau de la personne', async () => {
    const { service, record } = make([
      candidate({ timezone: 'Pacific/Auckland', reminderTime: '00:00', lastActiveDay: null }),
    ]);
    await service.execute(now);
    expect(record.mock.calls[0]?.[1]).toBe('2026-11-22');
  });
});

describe('SendReminders avec push', () => {
  const sub = (n: string) => ({
    endpoint: `https://push.test/${n}`,
    keys: { p256dh: 'k', auth: 'a' },
  });
  const makePush = (results: ('sent' | 'gone' | 'failed')[]) => {
    const send = vi.fn<PushSender['send']>();
    for (const r of results) send.mockResolvedValueOnce(r);
    const subscriptions = {
      save: vi.fn(),
      forUser: vi.fn().mockResolvedValue(results.map((_, i) => sub(String(i)))),
      remove: vi.fn().mockResolvedValue(undefined),
      removeOwn: vi.fn(),
    } satisfies PushSubscriptionsStore;
    const store: RemindersStore = {
      candidates: async () => [candidate()],
      record: vi.fn().mockResolvedValue(true),
    };
    return {
      send,
      subscriptions,
      service: new SendReminders(store, { sender: { send }, subscriptions }),
    };
  };

  it('envoie le rappel à chaque appareil de la personne', async () => {
    const { service, send } = makePush(['sent', 'sent']);
    await service.execute(now);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledWith(sub('0'), {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      url: REMINDER_URL,
    });
  });

  it('supprime l’abonnement expiré (gone) et garde les autres, même après un échec', async () => {
    const { service, subscriptions } = makePush(['failed', 'gone', 'sent']);
    await service.execute(now);
    expect(subscriptions.remove).toHaveBeenCalledTimes(1);
    expect(subscriptions.remove).toHaveBeenCalledWith(sub('1').endpoint);
  });

  it('n’envoie rien si le rappel du jour existe déjà', async () => {
    const { send, subscriptions } = makePush(['sent']);
    const store: RemindersStore = {
      candidates: async () => [candidate()],
      record: vi.fn().mockResolvedValue(false),
    };
    await new SendReminders(store, { sender: { send }, subscriptions }).execute(now);
    expect(send).not.toHaveBeenCalled();
  });
});
