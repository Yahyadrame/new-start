import { PushSubscriptionInput, PushUnsubscribeInput } from '@newstart/shared';

/**
 * unsupported : le navigateur n'a pas le push ; unconfigured : la clé publique VAPID manque ;
 * blocked : la permission est refusée (seul le réglage du navigateur peut la rendre) ;
 * on : cet appareil est abonné ; off : il ne l'est pas.
 */
export type PushStatus = 'unsupported' | 'unconfigured' | 'blocked' | 'on' | 'off';

/** Résultat d'un abonnement : l'état final, ou `failed` quand le navigateur ou l'API a refusé. */
export type EnableResult = PushStatus | 'failed';

export const vapidPublicKey = (): string | undefined =>
  process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY'] || undefined;

export const isPushSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** La clé VAPID arrive en base64 « URL-safe » ; `subscribe` la veut en octets. */
export function urlBase64ToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

const call = (method: 'POST' | 'DELETE', token: string, body: unknown) =>
  fetch('/api/push/subscriptions', {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

/** L'état de cet appareil, sans rien demander à la personne. */
export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported';
  if (!vapidPublicKey()) return 'unconfigured';
  if (Notification.permission === 'denied') return 'blocked';
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ? 'on' : 'off';
}

/**
 * Abonne cet appareil : permission, service worker, abonnement du navigateur, puis enregistrement par l'API.
 * À appeler depuis un geste de la personne (clic), jamais au chargement de la page.
 */
export async function enablePush(token: string): Promise<EnableResult> {
  const key = vapidPublicKey();
  if (!isPushSupported()) return 'unsupported';
  if (!key) return 'unconfigured';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') return 'blocked';
    if (permission !== 'granted') return 'off';
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(key),
      }));
    const res = await call('POST', token, PushSubscriptionInput.parse(subscription.toJSON()));
    return res.ok ? 'on' : 'failed';
  } catch {
    return 'failed';
  }
}

/** Désabonne cet appareil : l'API d'abord, puis le navigateur. En cas d'échec, l'abonnement reste et on peut réessayer. */
export async function disablePush(token: string): Promise<'off' | 'failed'> {
  if (!isPushSupported()) return 'off';
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return 'off';
    const res = await call('DELETE', token, PushUnsubscribeInput.parse(subscription.toJSON()));
    if (!res.ok) return 'failed';
    await subscription.unsubscribe();
    return 'off';
  } catch {
    return 'failed';
  }
}
