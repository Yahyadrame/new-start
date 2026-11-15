export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** Port d'envoi d'e-mails. Brevo (API HTTP) en ligne, FakeMailer sans clé. */
export interface Mailer {
  send(message: MailMessage): Promise<{ id: string }>;
}

/** Adaptateur factice : garde les messages en mémoire, n'écrit rien dans les logs. */
export class FakeMailer implements Mailer {
  readonly outbox: MailMessage[] = [];

  async send(message: MailMessage): Promise<{ id: string }> {
    this.outbox.push(message);
    return { id: `fake-mail-${this.outbox.length}` };
  }

  /** Dernier message envoyé à cette adresse, pour lire un code de connexion dans un test. */
  lastTo(address: string): MailMessage | undefined {
    return this.outbox.findLast((m) => m.to === address);
  }
}
