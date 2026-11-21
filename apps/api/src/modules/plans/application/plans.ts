import type { PlanItem } from '@newstart/shared';

export const PLANS_STORE = Symbol('PLANS_STORE');

export interface PlansStore {
  /** Les offres dans l'ordre d'affichage, avec leur prix dans cette devise. */
  list(currency: PlanItem['currency']): Promise<PlanItem[]>;
}

/** Pays qui paient en francs CFA (UEMOA) ; les autres paient en dollars. */
export const XOF_COUNTRIES: ReadonlySet<string> = new Set([
  'SN',
  'CI',
  'BF',
  'ML',
  'NE',
  'TG',
  'BJ',
  'GW',
]);

export const currencyFor = (country?: string): PlanItem['currency'] =>
  country && XOF_COUNTRIES.has(country) ? 'XOF' : 'USD';

export class PlansService {
  constructor(private readonly store: PlansStore) {}

  list(country?: string) {
    return this.store.list(currencyFor(country));
  }
}
