import { describe, expect, it } from 'vitest';
import { getSession, setSession, type Session } from './session';

const session: Session = {
  accessToken: 'a',
  expiresInSeconds: 900,
  user: { id: 'u1', firstName: 'Awa', goal: 'WORK', level: 'A1' },
};

describe('session en mémoire', () => {
  it('garde la session puis la perd quand on la vide', () => {
    expect(getSession()).toBeNull();
    setSession(session);
    expect(getSession()).toBe(session);
    setSession(null);
    expect(getSession()).toBeNull();
  });
});
