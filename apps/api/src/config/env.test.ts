import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const base = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };

describe('parseEnv', () => {
  it('applique les valeurs par défaut', () => {
    expect(parseEnv(base)).toMatchObject({
      PORT: 4000,
      LOG_LEVEL: 'info',
      RUN_JOBS: 'inline',
      NODE_ENV: 'development',
    });
  });
  it('fixe la limite de messages par jour à 60, réglable, jamais sous 1', () => {
    expect(parseEnv(base).MESSAGES_PER_DAY).toBe(60);
    expect(parseEnv({ ...base, MESSAGES_PER_DAY: '' }).MESSAGES_PER_DAY).toBe(60);
    expect(parseEnv({ ...base, MESSAGES_PER_DAY: '25' }).MESSAGES_PER_DAY).toBe(25);
    expect(() => parseEnv({ ...base, MESSAGES_PER_DAY: '0' })).toThrow();
  });
  it('éteint la limite de débit par défaut et ne prend aucun proxy', () => {
    expect(parseEnv(base).RATE_LIMIT_PER_MINUTE).toBe(0);
    expect(parseEnv(base).TRUST_PROXY_HOPS).toBe(0);
    expect(
      parseEnv({ ...base, RATE_LIMIT_PER_MINUTE: '300', TRUST_PROXY_HOPS: '1' }),
    ).toMatchObject({
      RATE_LIMIT_PER_MINUTE: 300,
      TRUST_PROXY_HOPS: 1,
    });
    expect(() => parseEnv({ ...base, RATE_LIMIT_PER_MINUTE: '-1' })).toThrow();
  });
  it('éteint le planificateur de rappels par défaut, réglable en secondes', () => {
    expect(parseEnv(base).REMINDERS_INTERVAL_SECONDS).toBe(0);
    expect(parseEnv({ ...base, REMINDERS_INTERVAL_SECONDS: '60' }).REMINDERS_INTERVAL_SECONDS).toBe(
      60,
    );
    expect(() => parseEnv({ ...base, REMINDERS_INTERVAL_SECONDS: '-5' })).toThrow();
  });
  it('convertit PORT en nombre', () => {
    expect(parseEnv({ ...base, PORT: '4000' }).PORT).toBe(4000);
  });
  it('traite REDIS_URL vide comme absent', () => {
    expect(parseEnv({ ...base, REDIS_URL: '' }).REDIS_URL).toBeUndefined();
    expect(parseEnv({ ...base, REDIS_URL: 'redis://localhost:6379' }).REDIS_URL).toBe(
      'redis://localhost:6379',
    );
  });
  it('traite SENTRY_DSN vide comme absent et refuse une valeur non URL', () => {
    expect(parseEnv({ ...base, SENTRY_DSN: '' }).SENTRY_DSN).toBeUndefined();
    expect(parseEnv({ ...base, SENTRY_DSN: 'https://k@o1.ingest.sentry.io/2' }).SENTRY_DSN).toBe(
      'https://k@o1.ingest.sentry.io/2',
    );
    expect(() => parseEnv({ ...base, SENTRY_DSN: 'pas-une-url' })).toThrow('SENTRY_DSN');
  });
  it('variables IA : vides = absentes, valeurs gardées', () => {
    const base = { DATABASE_URL: 'x' };
    const off = parseEnv({ ...base, LLM_PROVIDER: '', GROQ_API_KEY: '' });
    expect(off.LLM_PROVIDER).toBeUndefined();
    expect(off.GROQ_API_KEY).toBeUndefined();
    const on = parseEnv({
      ...base,
      LLM_PROVIDER: 'groq',
      GROQ_API_KEY: 'k',
      AI_MAX_CALLS_PER_MONTH: '10',
    });
    expect(on).toMatchObject({
      LLM_PROVIDER: 'groq',
      GROQ_API_KEY: 'k',
      AI_MAX_CALLS_PER_MONTH: '10',
    });
  });
  it('OTEL_EXPORTER_OTLP_ENDPOINT : vide = éteint, barre finale retirée, non URL refusée', () => {
    expect(
      parseEnv({ ...base, OTEL_EXPORTER_OTLP_ENDPOINT: '' }).OTEL_EXPORTER_OTLP_ENDPOINT,
    ).toBeUndefined();
    expect(
      parseEnv({ ...base, OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.example.net/otlp/' })
        .OTEL_EXPORTER_OTLP_ENDPOINT,
    ).toBe('https://otlp.example.net/otlp');
    expect(() => parseEnv({ ...base, OTEL_EXPORTER_OTLP_ENDPOINT: 'nope' })).toThrow(
      'OTEL_EXPORTER_OTLP_ENDPOINT',
    );
  });
  it('SENTRY_TEST_TOKEN : absent ou vide = désactivé, trop court = refusé', () => {
    expect(parseEnv(base).SENTRY_TEST_TOKEN).toBeUndefined();
    expect(parseEnv({ ...base, SENTRY_TEST_TOKEN: '' }).SENTRY_TEST_TOKEN).toBeUndefined();
    expect(parseEnv({ ...base, SENTRY_TEST_TOKEN: 'a'.repeat(16) }).SENTRY_TEST_TOKEN).toHaveLength(
      16,
    );
    expect(() => parseEnv({ ...base, SENTRY_TEST_TOKEN: 'court' })).toThrow('SENTRY_TEST_TOKEN');
  });
  it('lit CORS_ORIGINS en liste, sans espaces ni barre finale, vide par défaut', () => {
    expect(parseEnv(base).CORS_ORIGINS).toEqual([]);
    expect(parseEnv({ ...base, CORS_ORIGINS: '' }).CORS_ORIGINS).toEqual([]);
    expect(
      parseEnv({ ...base, CORS_ORIGINS: ' https://a.vercel.app/ , http://localhost:3000,' })
        .CORS_ORIGINS,
    ).toEqual(['https://a.vercel.app', 'http://localhost:3000']);
  });
  it('refuse une configuration invalide en nommant les champs, sans afficher leur valeur', () => {
    const message = (() => {
      try {
        parseEnv({ DATABASE_URL: '', PORT: 'secret-value' });
      } catch (error) {
        return (error as Error).message;
      }
      return '';
    })();
    expect(message).toContain('DATABASE_URL');
    expect(message).toContain('PORT');
    expect(message).not.toContain('secret-value');
  });
});
