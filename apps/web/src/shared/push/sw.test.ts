import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

type Listener = (event: unknown) => void;
const listeners = new Map<string, Listener>();
const showNotification = vi.fn().mockResolvedValue(undefined);
const openWindow = vi.fn().mockResolvedValue(undefined);
const matchAll = vi.fn();

beforeAll(async () => {
  vi.stubGlobal('self', {
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    registration: { showNotification },
    clients: { matchAll, openWindow },
  });
  await import('../../../public/sw.js');
});

afterEach(() => {
  vi.clearAllMocks();
});

/** Joue l'événement et rend la promesse donnée à waitUntil (undefined si le worker n'a rien lancé). */
const fire = (type: string, event: Record<string, unknown>) => {
  let pending: Promise<unknown> | undefined;
  listeners.get(type)?.({ ...event, waitUntil: (p: Promise<unknown>) => (pending = p) });
  return pending;
};

const pushOf = (json: () => unknown) => fire('push', { data: { json } });

describe('service worker, événement push', () => {
  it('affiche le titre et le texte, et garde l’URL pour le clic', async () => {
    await pushOf(() => ({
      title: 'Ta pratique du jour',
      body: 'Cinq minutes suffisent.',
      url: '/notifications',
    }));
    expect(showNotification).toHaveBeenCalledWith('Ta pratique du jour', {
      body: 'Cinq minutes suffisent.',
      data: { url: '/notifications' },
    });
  });

  it('remplace une URL externe ou sans chemin par l’accueil', async () => {
    await pushOf(() => ({ title: 'a', body: 'b', url: 'https://evil.test/x' }));
    await pushOf(() => ({ title: 'a', body: 'b', url: '//evil.test/x' }));
    await pushOf(() => ({ title: 'a', body: 'b' }));
    expect(showNotification.mock.calls.map((c) => c[1].data.url)).toEqual(['/', '/', '/']);
  });

  it('omet le texte quand le payload n’en a pas', async () => {
    await pushOf(() => ({ title: 'a' }));
    expect(showNotification).toHaveBeenCalledWith('a', { body: undefined, data: { url: '/' } });
  });

  it('n’affiche rien sans titre, sans JSON valide ou sans données', () => {
    expect(pushOf(() => ({ body: 'sans titre' }))).toBeUndefined();
    expect(
      pushOf(() => {
        throw new SyntaxError('pas du JSON');
      }),
    ).toBeUndefined();
    expect(fire('push', {})).toBeUndefined();
    expect(showNotification).not.toHaveBeenCalled();
  });
});

describe('service worker, clic sur la notification', () => {
  const click = (url?: string) => {
    const close = vi.fn();
    const pending = fire('notificationclick', {
      notification: { close, data: url ? { url } : undefined },
    });
    return { close, pending };
  };

  it('ouvre une fenêtre quand l’appli n’est pas ouverte', async () => {
    matchAll.mockResolvedValue([]);
    const { close, pending } = click('/notifications');
    await pending;
    expect(close).toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalledWith('/notifications');
  });

  it('réutilise la fenêtre ouverte : elle va à l’URL puis prend le focus', async () => {
    const focus = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn().mockResolvedValue({ focus });
    matchAll.mockResolvedValue([{ navigate, focus: vi.fn() }]);
    await click('/notifications').pending;
    expect(navigate).toHaveBeenCalledWith('/notifications');
    expect(focus).toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('donne le focus à la fenêtre d’origine quand navigate ne rend aucun client', async () => {
    const focus = vi.fn().mockResolvedValue(undefined);
    matchAll.mockResolvedValue([{ navigate: vi.fn().mockResolvedValue(null), focus }]);
    await click('/notifications').pending;
    expect(focus).toHaveBeenCalled();
  });

  it('retombe sur l’accueil sans URL dans la notification', async () => {
    matchAll.mockResolvedValue([]);
    await click().pending;
    expect(openWindow).toHaveBeenCalledWith('/');
  });
});
