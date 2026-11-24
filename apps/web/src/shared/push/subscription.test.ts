import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  disablePush,
  enablePush,
  getPushStatus,
  isPushSupported,
  urlBase64ToBytes,
  vapidPublicKey,
} from './subscription';

const subscriptionJson = {
  endpoint: 'https://push.test/abc',
  keys: { p256dh: 'p256', auth: 'auth' },
};

const fakeSubscription = () => ({
  toJSON: () => subscriptionJson,
  unsubscribe: vi.fn().mockResolvedValue(true),
});

type Sub = ReturnType<typeof fakeSubscription>;

/** Un navigateur qui sait faire du push ; chaque test règle ce dont il a besoin. */
function setup({
  permission = 'default',
  requested = 'granted',
  existing = null,
  subscribed = fakeSubscription(),
}: {
  permission?: string;
  requested?: string;
  existing?: Sub | null;
  subscribed?: Sub;
} = {}) {
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(existing),
    subscribe: vi.fn().mockResolvedValue(subscribed),
  };
  const registration = { pushManager };
  const serviceWorker = {
    register: vi.fn().mockResolvedValue(registration),
    getRegistration: vi.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  };
  const requestPermission = vi.fn().mockResolvedValue(requested);
  vi.stubGlobal('Notification', { permission, requestPermission });
  vi.stubGlobal('PushManager', vi.fn());
  Object.defineProperty(navigator, 'serviceWorker', { value: serviceWorker, configurable: true });
  return { pushManager, serviceWorker, requestPermission, subscribed };
}

const stubFetch = (ok: boolean) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'AQAB'));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('urlBase64ToBytes', () => {
  it('décode le base64 URL-safe, avec ou sans remplissage', () => {
    expect([...urlBase64ToBytes('AQAB')]).toEqual([1, 0, 1]);
    expect([...urlBase64ToBytes('AQ')]).toEqual([1]);
    expect([...urlBase64ToBytes('-_8')]).toEqual([0xfb, 0xff]);
  });
});

describe('vapidPublicKey', () => {
  it('lit la variable, et rend undefined quand elle est vide ou absente', () => {
    expect(vapidPublicKey()).toBe('AQAB');
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    expect(vapidPublicKey()).toBeUndefined();
  });
});

describe('isPushSupported', () => {
  it('est faux sans service worker, sans PushManager ou sans Notification', () => {
    expect(isPushSupported()).toBe(false);
    setup();
    expect(isPushSupported()).toBe(true);
    vi.stubGlobal('PushManager', undefined);
    Reflect.deleteProperty(window, 'PushManager');
    expect(isPushSupported()).toBe(false);
  });
});

describe('getPushStatus', () => {
  it('dit unsupported quand le navigateur n’a pas le push', async () => {
    expect(await getPushStatus()).toBe('unsupported');
  });

  it('dit unconfigured sans clé VAPID', async () => {
    setup();
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    expect(await getPushStatus()).toBe('unconfigured');
  });

  it('dit blocked quand la permission est refusée', async () => {
    setup({ permission: 'denied' });
    expect(await getPushStatus()).toBe('blocked');
  });

  it('dit on quand l’appareil est abonné', async () => {
    setup({ existing: fakeSubscription() });
    expect(await getPushStatus()).toBe('on');
  });

  it('dit off sans abonnement, ou sans service worker enregistré', async () => {
    const { serviceWorker } = setup();
    expect(await getPushStatus()).toBe('off');
    serviceWorker.getRegistration.mockResolvedValue(undefined);
    expect(await getPushStatus()).toBe('off');
  });
});

describe('enablePush', () => {
  it('abonne l’appareil et l’enregistre auprès de l’API', async () => {
    const { pushManager, serviceWorker } = setup();
    const fetchMock = stubFetch(true);
    expect(await enablePush('tok')).toBe('on');
    expect(serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([1, 0, 1]),
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscriptions', {
      method: 'POST',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: JSON.stringify(subscriptionJson),
    });
  });

  it('réutilise l’abonnement du navigateur s’il existe déjà', async () => {
    const { pushManager } = setup({ existing: fakeSubscription() });
    stubFetch(true);
    expect(await enablePush('tok')).toBe('on');
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('ne demande rien quand le push n’est pas disponible', async () => {
    expect(await enablePush('tok')).toBe('unsupported');
    const { requestPermission } = setup();
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    expect(await enablePush('tok')).toBe('unconfigured');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('dit blocked quand la personne refuse', async () => {
    const { serviceWorker } = setup({ requested: 'denied' });
    expect(await enablePush('tok')).toBe('blocked');
    expect(serviceWorker.register).not.toHaveBeenCalled();
  });

  it('dit off quand la personne ferme la demande sans répondre', async () => {
    setup({ requested: 'default' });
    expect(await enablePush('tok')).toBe('off');
  });

  it('dit failed quand l’API refuse, et garde l’abonnement du navigateur pour réessayer', async () => {
    const { subscribed } = setup();
    stubFetch(false);
    expect(await enablePush('tok')).toBe('failed');
    expect(subscribed.unsubscribe).not.toHaveBeenCalled();
  });

  it('dit failed quand le navigateur échoue ou rend un abonnement incomplet', async () => {
    const { pushManager } = setup();
    stubFetch(true);
    pushManager.subscribe.mockRejectedValue(new Error('AbortError'));
    expect(await enablePush('tok')).toBe('failed');
    pushManager.subscribe.mockResolvedValue({
      toJSON: () => ({ endpoint: 'https://push.test/x' }),
    });
    expect(await enablePush('tok')).toBe('failed');
  });
});

describe('disablePush', () => {
  it('supprime l’abonnement côté API puis côté navigateur', async () => {
    const existing = fakeSubscription();
    setup({ existing });
    const fetchMock = stubFetch(true);
    expect(await disablePush('tok')).toBe('off');
    expect(fetchMock).toHaveBeenCalledWith('/api/push/subscriptions', {
      method: 'DELETE',
      headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: subscriptionJson.endpoint }),
    });
    expect(existing.unsubscribe).toHaveBeenCalled();
  });

  it('ne fait rien sans abonnement, sans service worker ou sans support', async () => {
    expect(await disablePush('tok')).toBe('off');
    const { serviceWorker } = setup();
    const fetchMock = stubFetch(true);
    expect(await disablePush('tok')).toBe('off');
    serviceWorker.getRegistration.mockResolvedValue(undefined);
    expect(await disablePush('tok')).toBe('off');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('garde l’abonnement du navigateur quand l’API refuse, pour réessayer', async () => {
    const existing = fakeSubscription();
    setup({ existing });
    stubFetch(false);
    expect(await disablePush('tok')).toBe('failed');
    expect(existing.unsubscribe).not.toHaveBeenCalled();
  });

  it('dit failed quand le navigateur échoue', async () => {
    const existing = fakeSubscription();
    existing.unsubscribe.mockRejectedValue(new Error('boom'));
    setup({ existing });
    stubFetch(true);
    expect(await disablePush('tok')).toBe('failed');
  });
});
