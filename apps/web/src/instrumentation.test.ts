import { afterEach, describe, expect, it, vi } from 'vitest';

const server = vi.hoisted(() => ({ initSentryServer: vi.fn(), captureServerError: vi.fn() }));
vi.mock('./shared/monitoring/sentry.server', () => server);
const { register, onRequestError } = await import('./instrumentation');

afterEach(() => {
  vi.unstubAllEnvs();
  server.initSentryServer.mockClear();
});

describe('register', () => {
  it('ne fait rien hors du runtime Node', () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    register();
    expect(server.initSentryServer).not.toHaveBeenCalled();
  });
  it('utilise SENTRY_DSN, sinon le DSN public', () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('SENTRY_DSN', 'https://a@o1.ingest.sentry.io/1');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://b@o1.ingest.sentry.io/2');
    register();
    expect(server.initSentryServer).toHaveBeenLastCalledWith('https://a@o1.ingest.sentry.io/1');
    vi.stubEnv('SENTRY_DSN', '');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://b@o1.ingest.sentry.io/2');
    register();
    expect(server.initSentryServer).toHaveBeenCalledTimes(2);
  });
});

describe('onRequestError', () => {
  it("transmet l'erreur", () => {
    const err = new Error('x');
    onRequestError(err);
    expect(server.captureServerError).toHaveBeenCalledWith(err);
  });
});
