import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

const base = {};

describe('parseEnv', () => {
  it('applique les valeurs par défaut', () => {
    expect(parseEnv(base)).toMatchObject({
      PORT: 3000,
      LOG_LEVEL: 'info',
      RUN_JOBS: 'inline',
      NODE_ENV: 'development',
    });
  });
  it('convertit PORT en nombre', () => {
    expect(parseEnv({ ...base, PORT: '4000' }).PORT).toBe(4000);
  });
  it('refuse une configuration invalide en nommant les champs, sans afficher leur valeur', () => {
    const message = (() => {
      try {
        parseEnv({ PORT: 'secret-value' });
      } catch (error) {
        return (error as Error).message;
      }
      return '';
    })();
    expect(message).toContain('PORT');
    expect(message).not.toContain('secret-value');
  });
});
