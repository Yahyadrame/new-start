export type SmsMessage = {
  /** Numéro au format E.164, par exemple +221771234567. */
  to: string;
  text: string;
};

/** Port d'envoi de SMS. Brevo en ligne une fois le budget accordé, FakeSmsSender sinon. */
export interface SmsSender {
  send(message: SmsMessage): Promise<{ id: string }>;
}

/** Adaptateur factice : garde les SMS en mémoire, n'écrit rien dans les logs. */
export class FakeSmsSender implements SmsSender {
  readonly outbox: SmsMessage[] = [];

  async send(message: SmsMessage): Promise<{ id: string }> {
    this.outbox.push(message);
    return { id: `fake-sms-${this.outbox.length}` };
  }

  lastTo(number: string): SmsMessage | undefined {
    return this.outbox.findLast((m) => m.to === number);
  }
}
