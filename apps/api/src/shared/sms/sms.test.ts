import { describe, expect, it } from 'vitest';
import { FakeSmsSender } from './sms.js';

describe('FakeSmsSender', () => {
  it('garde les SMS et renvoie un identifiant par envoi', async () => {
    const sms = new FakeSmsSender();
    const a = await sms.send({ to: '+221770000001', text: '1' });
    const b = await sms.send({ to: '+221770000002', text: '2' });
    expect(a.id).not.toBe(b.id);
    expect(sms.outbox).toHaveLength(2);
  });
  it('retrouve le dernier SMS envoyé à un numéro', async () => {
    const sms = new FakeSmsSender();
    await sms.send({ to: '+221770000001', text: 'un' });
    await sms.send({ to: '+221770000001', text: 'deux' });
    expect(sms.lastTo('+221770000001')?.text).toBe('deux');
    expect(sms.lastTo('+221779999999')).toBeUndefined();
  });
});
