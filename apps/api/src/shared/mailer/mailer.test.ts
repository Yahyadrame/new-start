import { describe, expect, it } from 'vitest';
import { FakeMailer } from './mailer.js';

describe('FakeMailer', () => {
  it('garde les messages et renvoie un identifiant par envoi', async () => {
    const mailer = new FakeMailer();
    const a = await mailer.send({ to: 'a@test.dev', subject: 'Code', text: '123456' });
    const b = await mailer.send({ to: 'b@test.dev', subject: 'Code', text: '654321' });
    expect(a.id).not.toBe(b.id);
    expect(mailer.outbox).toHaveLength(2);
  });
  it('retrouve le dernier message envoyé à une adresse', async () => {
    const mailer = new FakeMailer();
    await mailer.send({ to: 'a@test.dev', subject: 'Un', text: '1' });
    await mailer.send({ to: 'a@test.dev', subject: 'Deux', text: '2' });
    expect(mailer.lastTo('a@test.dev')?.subject).toBe('Deux');
    expect(mailer.lastTo('inconnu@test.dev')).toBeUndefined();
  });
});
