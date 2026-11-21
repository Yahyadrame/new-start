import { describe, expect, it, vi } from 'vitest';
import { PlansService, XOF_COUNTRIES, currencyFor } from './plans.js';

describe('currencyFor', () => {
  it.each([...XOF_COUNTRIES])('%s paie en FCFA', (country) =>
    expect(currencyFor(country)).toBe('XOF'),
  );

  it.each(['FR', 'US', 'NG'])('%s paie en dollars', (country) =>
    expect(currencyFor(country)).toBe('USD'),
  );

  it('paie en dollars sans pays', () => {
    expect(currencyFor()).toBe('USD');
  });
});

describe('PlansService', () => {
  it('lit les offres dans la devise du pays', async () => {
    const plans = [{ code: 'FREE' }];
    const list = vi.fn().mockResolvedValue(plans);
    const service = new PlansService({ list });
    expect(await service.list('SN')).toBe(plans);
    expect(list).toHaveBeenCalledWith('XOF');
    await service.list('US');
    expect(list).toHaveBeenLastCalledWith('USD');
  });
});
