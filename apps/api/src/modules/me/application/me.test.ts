import { describe, expect, it, vi } from 'vitest';
import { FakeMediaStore } from '../../../shared/media/media-store.js';
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
  chatBackground: 'NONE' as const,
  avatar: null,
  pausedUntil: null,
};

function setup(found: typeof me | null = me) {
  const store: MeStore = {
    find: vi.fn().mockResolvedValue(found),
    update: vi.fn().mockResolvedValue(found && { ...found, theme: 'DARK' }),
    exportData: vi.fn().mockResolvedValue(found && { firstName: 'Awa' }),
    remove: vi.fn().mockResolvedValue(found && []),
  };
  const r2 = new FakeMediaStore();
  return { store, r2, service: new MeService(store, { active: 'r2', stores: { r2 } }) };
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

  it("exporte les données avec la date de l'export", async () => {
    const { service } = setup();
    const out = await service.export('u');
    expect(out).toMatchObject({ firstName: 'Awa' });
    expect(Number.isNaN(Date.parse(String(out.exportedAt)))).toBe(false);
  });

  it('efface les photos et les vocaux du compte supprimé', async () => {
    const { store, r2, service } = setup();
    await r2.put({ key: 'image/u/a.jpg', data: new Uint8Array([1]) });
    vi.mocked(store.remove).mockResolvedValue([{ key: 'image/u/a.jpg', provider: 'r2' }]);
    await service.remove('u');
    await vi.waitFor(() => expect(r2.files.size).toBe(0));
  });

  it('répond sans attendre le stockage', async () => {
    const { store, r2, service } = setup();
    vi.spyOn(r2, 'delete').mockReturnValue(new Promise<void>(() => undefined));
    vi.mocked(store.remove).mockResolvedValue([{ key: 'image/u/a.jpg', provider: 'r2' }]);
    await expect(service.remove('u')).resolves.toBeUndefined();
  });

  it('supprime le compte, et répond 404 quand il a déjà disparu', async () => {
    await expect(setup().service.remove('u')).resolves.toBeUndefined();
    await expect(setup(null).service.export('u')).rejects.toMatchObject({ status: 404 });
    await expect(setup(null).service.remove('u')).rejects.toMatchObject({ status: 404 });
  });
});
