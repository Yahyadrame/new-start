import { Inject, Injectable } from '@nestjs/common';
import { HEALTH_CHECKS, type HealthCheck, type Readiness } from '../domain/health-check.js';

export const CHECK_TIMEOUT_MS = 2000;

async function withTimeout(check: HealthCheck): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([check.check(), timeout]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

@Injectable()
export class CheckReadiness {
  constructor(@Inject(HEALTH_CHECKS) private readonly checks: HealthCheck[]) {}

  async execute(): Promise<Readiness> {
    const results = await Promise.all(
      this.checks.map(async (c) => [c.name, await withTimeout(c)] as const),
    );
    return {
      ready: results.every(([, ok]) => ok),
      checks: Object.fromEntries(results.map(([name, ok]) => [name, ok ? 'up' : 'down'])),
    };
  }
}
