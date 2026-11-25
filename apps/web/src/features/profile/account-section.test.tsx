import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Me } from '@newstart/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { AccountSection } from './account-section';

const t = fr.profile.account;
const me = { firstName: 'Awa', birthYear: 2000, interests: ['MUSIC'], avatar: null } as Me;
const year = new Date().getFullYear();

afterEach(cleanup);

describe('AccountSection', () => {
  it('enregistre un nouveau prénom, nettoyé des espaces', () => {
    const onSave = vi.fn();
    render(<AccountSection me={me} onSave={onSave} />);
    const save = screen.getByRole('button', { name: t.save }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(t.firstName), { target: { value: ' Fatou ' } });
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledWith({ firstName: 'Fatou' });
  });

  it('refuse un prénom trop court et le dit', () => {
    const onSave = vi.fn();
    render(<AccountSection me={me} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(t.firstName), { target: { value: 'A' } });
    expect(screen.getByText(t.firstNameError)).toBeTruthy();
    expect((screen.getByRole('button', { name: t.save }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(screen.getByLabelText(t.firstName).closest('form') as HTMLFormElement);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('propose les années de 13 à 100 ans et enregistre le choix', () => {
    const onSave = vi.fn();
    render(<AccountSection me={me} onSave={onSave} />);
    const select = screen.getByLabelText(t.birthYear) as HTMLSelectElement;
    expect(select.value).toBe('2000');
    expect(select.options[0]?.value).toBe(String(year - 13));
    expect(select.options).toHaveLength(88);
    fireEvent.change(select, { target: { value: '1995' } });
    expect(onSave).toHaveBeenCalledWith({ birthYear: 1995 });
  });

  it('garde une année enregistrée hors liste, et invite à choisir quand il n’y en a pas', () => {
    render(<AccountSection me={{ ...me, birthYear: 1900 } as Me} onSave={vi.fn()} />);
    expect((screen.getByLabelText(t.birthYear) as HTMLSelectElement).value).toBe('1900');
    cleanup();
    render(<AccountSection me={{ ...me, birthYear: null } as Me} onSave={vi.fn()} />);
    expect(screen.getByRole('option', { name: t.birthYearPlaceholder })).toBeTruthy();
  });

  it('coche et décoche un centre d’intérêt en gardant les autres', () => {
    const onSave = vi.fn();
    render(<AccountSection me={me} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: fr.signup.interests.ART }));
    expect(onSave).toHaveBeenLastCalledWith({ interests: ['MUSIC', 'ART'] });
    fireEvent.click(screen.getByRole('button', { name: fr.signup.interests.MUSIC }));
    expect(onSave).toHaveBeenLastCalledWith({ interests: [] });
  });
});

describe('AccountSection : avatar', () => {
  it("ouvre le choix d'avatar et enregistre la silhouette choisie", async () => {
    const onSave = vi.fn();
    render(<AccountSection me={me} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: fr.avatar.change }));
    fireEvent.click(
      screen.getByRole('button', { name: fr.avatar.silhouetteN.replace('{id}', '002') }),
    );
    fireEvent.click(screen.getByRole('button', { name: fr.avatar.save }));
    await vi.waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ avatar: { id: 'a002', variant: 'duo' } }),
    );
    await vi.waitFor(() => expect(screen.getByLabelText(t.firstName)).toBeTruthy());
  });
});
