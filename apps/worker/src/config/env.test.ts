import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('applique les valeurs par défaut', () => {
    expect(parseEnv({})).toEqual({ NODE_ENV: 'development', LOG_LEVEL: 'info' });
  });
  it('refuse un niveau de log inconnu en nommant le champ, sans sa valeur', () => {
    expect(() => parseEnv({ LOG_LEVEL: 'secret-value' })).toThrow('LOG_LEVEL');
    expect(() => parseEnv({ LOG_LEVEL: 'secret-value' })).not.toThrow(/secret-value/);
  });
});
