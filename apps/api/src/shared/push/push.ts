import * as webpush from 'web-push';

/** Abonnement Web Push tel que le navigateur le donne (PushSubscription.toJSON()). */
export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushPayload = { title: string; body: string; url?: string };

/** sent : reçu par le service de push ; gone : abonnement expiré, à supprimer ; failed : erreur passagère, à réessayer plus tard. */
export type PushResult = 'sent' | 'gone' | 'failed';

/** Port d'envoi de notifications push. WebPushSender avec les clés VAPID, FakePushSender sinon. */
export interface PushSender {
  send(subscription: PushSubscriptionData, payload: PushPayload): Promise<PushResult>;
}

export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

type WebPushClient = Pick<typeof webpush, 'sendNotification'>;

/** Durée pendant laquelle le service de push garde le message si l'appareil est éteint : un jour. */
const TTL_SECONDS = 24 * 60 * 60;

/** Adaptateur Web Push (protocole VAPID). Ne journalise ni le message ni l'abonnement. */
export class WebPushSender implements PushSender {
  constructor(
    private readonly vapid: VapidConfig,
    private readonly client: WebPushClient = webpush,
  ) {}

  async send(subscription: PushSubscriptionData, payload: PushPayload): Promise<PushResult> {
    try {
      await this.client.sendNotification(subscription, JSON.stringify(payload), {
        TTL: TTL_SECONDS,
        vapidDetails: {
          subject: this.vapid.subject,
          publicKey: this.vapid.publicKey,
          privateKey: this.vapid.privateKey,
        },
      });
      return 'sent';
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      return status === 404 || status === 410 ? 'gone' : 'failed';
    }
  }
}

/** Adaptateur factice : garde les envois en mémoire. Un endpoint marqué « gone » simule un abonnement expiré. */
export class FakePushSender implements PushSender {
  readonly outbox: { subscription: PushSubscriptionData; payload: PushPayload }[] = [];

  async send(subscription: PushSubscriptionData, payload: PushPayload): Promise<PushResult> {
    if (subscription.endpoint.includes('gone')) return 'gone';
    this.outbox.push({ subscription, payload });
    return 'sent';
  }
}

type PushEnv = {
  VAPID_PUBLIC_KEY?: string | undefined;
  VAPID_PRIVATE_KEY?: string | undefined;
  VAPID_SUBJECT?: string | undefined;
};

/** WebPushSender si les trois variables VAPID sont posées, FakePushSender sinon. */
export function createPushSender(env: PushEnv): PushSender {
  const {
    VAPID_PUBLIC_KEY: publicKey,
    VAPID_PRIVATE_KEY: privateKey,
    VAPID_SUBJECT: subject,
  } = env;
  if (publicKey && privateKey && subject) {
    return new WebPushSender({ publicKey, privateKey, subject });
  }
  return new FakePushSender();
}
