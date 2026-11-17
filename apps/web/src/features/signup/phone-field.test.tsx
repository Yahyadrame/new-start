import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { COUNTRIES, composePhone, PhoneField } from './phone-field';

const t = fr.signup;
// jsdom n'a ni ResizeObserver ni scrollIntoView, que Radix et cmdk utilisent.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe('composePhone', () => {
  it('ramène un numéro local au format E.164 du pays choisi', () => {
    expect(composePhone('77 123 45 67', 'SN')).toBe('+221771234567');
    expect(composePhone('06 12 34 56 78', 'FR')).toBe('+33612345678');
  });
  it('garde un numéro déjà international et laisse passer le vide', () => {
    expect(composePhone('+33 6 12 34 56 78', 'SN')).toBe('+33 6 12 34 56 78');
    expect(composePhone('  ', 'SN')).toBe('');
  });
  it('préfixe l’indicatif quand le numéro est invalide, pour que le schéma le refuse', () => {
    expect(composePhone('123', 'SN')).toBe('+221123');
  });
});

describe('COUNTRIES', () => {
  it('liste les pays en français, avec leur indicatif', () => {
    const senegal = COUNTRIES.find((c) => c.code === 'SN');
    expect(senegal).toEqual({ code: 'SN', name: 'Sénégal', dial: '+221' });
  });
});

describe('PhoneField', () => {
  it('démarre sur le Sénégal et envoie le numéro complet', () => {
    const onChange = vi.fn();
    render(<PhoneField id="phone" onChange={onChange} />);
    expect(screen.getByRole('button', { name: /Sénégal, indicatif \+221/ })).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '77 123 45 67' } });
    expect(onChange).toHaveBeenLastCalledWith('+221771234567');
  });
  it('change de pays depuis la liste et garde le numéro saisi', () => {
    const onChange = vi.fn();
    render(<PhoneField id="phone" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '06 12 34 56 78' } });
    fireEvent.click(screen.getByRole('button', { name: /Sénégal/ }));
    fireEvent.change(screen.getByLabelText(t.countrySearch), { target: { value: 'france' } });
    fireEvent.click(screen.getByText('France'));
    expect(onChange).toHaveBeenLastCalledWith('+33612345678');
    expect(screen.getByRole('button', { name: /France, indicatif \+33/ })).toBeTruthy();
  });
  it('dit quand aucun pays ne correspond', async () => {
    render(<PhoneField id="phone" onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Sénégal/ }));
    fireEvent.change(screen.getByLabelText(t.countrySearch), { target: { value: 'xqxqx' } });
    expect(await screen.findByText(t.countryEmpty)).toBeTruthy();
  });
});
