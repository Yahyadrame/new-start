import { describe, expect, it } from 'vitest';
import { AGENT_STATUSES } from './agent-statuses.js';

describe('AGENT_STATUSES', () => {
  it('donne une phrase courte à chacun des 23 contacts', () => {
    const entries = Object.entries(AGENT_STATUSES);
    expect(entries).toHaveLength(23);
    for (const [slug, phrase] of entries) {
      expect(slug).toMatch(/^[a-z-]+$/);
      expect(phrase.trim().length).toBeGreaterThan(0);
      expect(phrase.length).toBeLessThanOrEqual(40);
    }
  });
});
