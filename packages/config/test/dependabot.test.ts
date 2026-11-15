import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const config = parse(readFileSync('../../.github/dependabot.yml', 'utf8')) as {
  version: number;
  updates: { 'package-ecosystem': string; directory: string; schedule: { interval: string } }[];
};

describe('dependabot.yml', () => {
  it('met à jour les actions GitHub chaque semaine depuis la racine', () => {
    expect(config.version).toBe(2);
    expect(config.updates).toHaveLength(1);
    expect(config.updates[0]).toMatchObject({
      'package-ecosystem': 'github-actions',
      directory: '/',
      schedule: { interval: 'weekly' },
    });
  });
});
