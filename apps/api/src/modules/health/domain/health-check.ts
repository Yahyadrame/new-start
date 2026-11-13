/** Port : une dépendance dont l'état conditionne la disponibilité. Lève une erreur si elle est hors service. */
export interface HealthCheck {
  readonly name: string;
  check(): Promise<void>;
}

export const HEALTH_CHECKS = Symbol('HEALTH_CHECKS');

export type Readiness = { ready: boolean; checks: Record<string, 'up' | 'down'> };
