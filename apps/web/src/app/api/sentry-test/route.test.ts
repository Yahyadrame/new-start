import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const TOKEN = 'jeton-de-test-0123456789';
const call = (token?: string) =>
  GET(
    new Request(
      'http://localhost/api/sentry-test',
      token ? { headers: { 'x-sentry-test-token': token } } : {},
    ),
  );

afterEach(() => vi.unstubAllEnvs());

describe('GET /api/sentry-test', () => {
  it('répond 404 sans jeton configuré', () => {
    vi.stubEnv('SENTRY_TEST_TOKEN', '');
    expect(call(TOKEN).status).toBe(404);
  });
  it('répond 404 sans en-tête ou avec un mauvais jeton', () => {
    vi.stubEnv('SENTRY_TEST_TOKEN', TOKEN);
    expect(call().status).toBe(404);
    expect(call('mauvais').status).toBe(404);
    expect(call('x'.repeat(TOKEN.length)).status).toBe(404);
  });
  it('lève une erreur avec le bon jeton', () => {
    vi.stubEnv('SENTRY_TEST_TOKEN', TOKEN);
    expect(() => call(TOKEN)).toThrow('Test Sentry volontaire');
  });
});
