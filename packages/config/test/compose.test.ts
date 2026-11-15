import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Service = {
  image?: string;
  mem_limit?: string;
  build?: unknown;
  profiles?: string[];
  user?: string;
  command?: string;
  depends_on?: Record<string, { condition: string }>;
};
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
  it.each(['web', 'api'])('%s (dev) : tourne avec UID:GID de la machine, pas en root', (name) => {
    expect(compose.services[name]?.user).toBe('${UID:-1000}:${GID:-1000}');
  });
  it('init-perms remet les volumes à l’utilisateur avant web et api', () => {
    const init = compose.services['init-perms'];
    expect(init?.user).toBe('0:0');
    expect(init?.command).toContain('chown -R ${UID:-1000}:${GID:-1000}');
    for (const name of ['web', 'api']) {
      expect(compose.services[name]?.depends_on?.['init-perms']?.condition).toBe(
        'service_completed_successfully',
      );
    }
  });
});
