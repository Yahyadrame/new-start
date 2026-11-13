import { HealthController } from './health.controller.js';

import { describe, expect, it } from 'vitest';

describe('HealthController', () => {
  it('live répond ok sans dépendance', () => {
    expect(new HealthController().live()).toEqual({ status: 'ok' });
  });
});
