import { describe, expect, it } from 'vitest';
import { reminderDue, type ReminderState } from './reminder.js';

const state: ReminderState = {
  reminderTime: '19:00',
  timezone: 'Africa/Dakar', // UTC+0
  lastActiveDay: '2026-11-20',
  lastReminderDay: '2026-11-20',
  pausedUntil: null,
};
const at = (hhmm: string) => new Date(`2026-11-21T${hhmm}:00Z`);

describe('reminderDue', () => {
  it("n'envoie rien avant l'heure choisie, puis envoie à l'heure et après", () => {
    expect(reminderDue(state, at('18:59'))).toBe(false);
    expect(reminderDue(state, at('19:00'))).toBe(true);
    expect(reminderDue(state, at('22:30'))).toBe(true);
  });

  it("n'envoie rien sans heure choisie", () => {
    expect(reminderDue({ ...state, reminderTime: null }, at('20:00'))).toBe(false);
  });

  it("n'envoie rien si la personne a déjà pratiqué aujourd'hui", () => {
    expect(reminderDue({ ...state, lastActiveDay: '2026-11-21' }, at('20:00'))).toBe(false);
  });

  it('envoie un seul rappel par jour', () => {
    expect(reminderDue({ ...state, lastReminderDay: '2026-11-21' }, at('20:00'))).toBe(false);
  });

  it('respecte le mode pause, et reprend quand il est fini', () => {
    expect(
      reminderDue({ ...state, pausedUntil: new Date('2026-11-25T00:00:00Z') }, at('20:00')),
    ).toBe(false);
    expect(
      reminderDue({ ...state, pausedUntil: new Date('2026-11-21T10:00:00Z') }, at('20:00')),
    ).toBe(true);
  });

  it('lit l’heure et le jour dans le fuseau de la personne', () => {
    // 23:30 UTC = 00:30 le lendemain à Paris (UTC+1 en novembre) : jour 22, avant 19:00.
    const paris = { ...state, timezone: 'Europe/Paris' };
    expect(reminderDue(paris, new Date('2026-11-21T23:30:00Z'))).toBe(false);
    // 18:30 UTC = 19:30 à Paris, même jour : dû.
    expect(reminderDue(paris, new Date('2026-11-21T18:30:00Z'))).toBe(true);
  });

  it('rappelle une personne qui a pratiqué hier et pas encore aujourd’hui', () => {
    expect(reminderDue({ ...state, lastReminderDay: null, lastActiveDay: null }, at('19:00'))).toBe(
      true,
    );
  });
});
