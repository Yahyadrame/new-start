import { describe, expect, it, vi } from 'vitest';
import { MeService, type MeStore } from './me.js';

const me = {
  id: 'u',
  firstName: 'Awa',
  goal: 'WORK' as const,
  level: 'B1',
  theme: 'SYSTEM' as const,
  reminderTime: null,
  timezone: 'Africa/Dakar',
  dailyGoalMin: 15,
  preferredAccent: 'en-US' as const,
  dataSaver: false,
  pausedUntil: null,
};

function setup(found: typeof me | null = me) {
  const store: MeStore = {
    find: vi.fn().mockResolvedValue(found),
    update: vi.fn().mockResolvedValue(found && { ...found, theme: 'DARK' }),
  };
  return { store, service: new MeService(store) };
}

describe('MeService', () => {
  it('renvoie le profil du compte', async () => {
    const { service } = setup();
    await expect(service.get('u')).resolves.toEqual(me);
  });

  it('applique les modifications et renvoie le profil à jour', async () => {
    const { store, service } = setup();
    await expect(service.update('u', { theme: 'DARK' })).resolves.toMatchObject({ theme: 'DARK' });
    expect(store.update).toHaveBeenCalledWith('u', { theme: 'DARK' });
  });

  it("répond 404 ACCOUNT_NOT_FOUND quand le compte n'existe plus", async () => {
    const { service } = setup(null);
    await expect(service.get('u')).rejects.toMatchObject({ status: 404 });
    await expect(service.update('u', { theme: 'DARK' })).rejects.toMatchObject({ status: 404 });
  });
});
