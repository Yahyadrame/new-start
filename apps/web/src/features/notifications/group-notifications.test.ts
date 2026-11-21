import { describe, expect, it } from 'vitest';
import { groupNotifications } from './group-notifications';

const n = (id: string, createdAt: string) => ({
  id,
  kind: 'reminder',
  title: 'T',
  body: 'B',
  createdAt,
  read: false,
});
const now = new Date(2026, 10, 21, 15, 0);

describe('groupNotifications', () => {
  it('range par jour : aujourd’hui, puis les 7 derniers jours', () => {
    const items = [
      n('a', new Date(2026, 10, 21, 9, 0).toISOString()),
      n('b', new Date(2026, 10, 19, 19, 0).toISOString()),
      n('c', new Date(2026, 10, 10, 19, 0).toISOString()),
    ];
    const { today, week } = groupNotifications(items, now);
    expect(today.map((i) => i.id)).toEqual(['a']);
    expect(week.map((i) => i.id)).toEqual(['b']);
  });

  it('rend deux groupes vides sans notification', () => {
    expect(groupNotifications([], now)).toEqual({ today: [], week: [] });
  });
});
