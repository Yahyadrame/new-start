import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Service = { image?: string; mem_limit?: string; build?: unknown; profiles?: string[] };
const compose = parse(readFileSync('../../infra/compose/docker-compose.yml', 'utf8'), {
  merge: true,
}) as { services: Record<string, Service> };
const services = Object.entries(compose.services);

describe('docker-compose local', () => {
  it.each(services.filter(([, s]) => s.image))('%s : image épinglée, jamais latest', (_, s) => {
    expect(s.image).toMatch(/:[\w][\w.-]*$/);
    expect(s.image).not.toMatch(/:latest$/);
  });
  it.each(services)('%s : limite de mémoire définie', (_, s) => {
    expect(s.mem_limit).toBeTruthy();
  });
  it('postgres et mailpit démarrent sans profil', () => {
    expect(compose.services.postgres?.profiles).toBeUndefined();
    expect(compose.services.mailpit?.profiles).toBeUndefined();
  });
  it('redis et sonarqube restent facultatifs', () => {
    expect(compose.services.redis?.profiles).toEqual(['redis']);
    expect(compose.services.sonarqube?.profiles).toEqual(['quality']);
  });
});
