import { describe, expect, it } from 'vitest';
import { PlanItem, PlansQuery } from './plans';

describe('PlansQuery', () => {
  it('met le pays en majuscules', () => {
    expect(PlansQuery.parse({ country: 'sn' })).toEqual({ country: 'SN' });
  });

  it('accepte l’absence de pays', () => {
    expect(PlansQuery.parse({})).toEqual({});
  });

  it.each(['S', 'SEN', ''])('refuse « %s »', (country) =>
    expect(PlansQuery.safeParse({ country }).success).toBe(false),
  );
});

describe('PlanItem', () => {
  const plan = {
    code: 'PLUS_MONTHLY',
    nameFr: 'Plus mensuel',
    periodDays: 30,
    renews: true,
    currency: 'XOF',
    amountMinor: 2000,
  };

  it('accepte une offre valide', () => {
    expect(PlanItem.safeParse(plan).success).toBe(true);
  });

  it.each([{ currency: 'EUR' }, { amountMinor: -1 }, { periodDays: 1.5 }])('refuse %j', (bad) =>
    expect(PlanItem.safeParse({ ...plan, ...bad }).success).toBe(false),
  );
});
