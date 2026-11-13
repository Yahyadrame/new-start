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
  it('convertit PORT en nombre', () => {
    expect(parseEnv({ ...base, PORT: '4000' }).PORT).toBe(4000);
  });
  it('traite REDIS_URL vide comme absent', () => {
    expect(parseEnv({ ...base, REDIS_URL: '' }).REDIS_URL).toBeUndefined();
    expect(parseEnv({ ...base, REDIS_URL: 'redis://localhost:6379' }).REDIS_URL).toBe(
      'redis://localhost:6379',
    );
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
