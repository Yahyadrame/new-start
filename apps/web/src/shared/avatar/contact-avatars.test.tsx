import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getContactAvatars = vi.fn();
const saveContactAvatar = vi.fn();
vi.mock('./contact-avatars-api', () => ({ getContactAvatars, saveContactAvatar }));
const { chooseContactAvatar, loadContactAvatars, resetContactAvatars, useContactChoice } =
  await import('./contact-avatars');

function Probe({ slug }: Readonly<{ slug: string }>) {
  return <p>{useContactChoice(slug)?.id ?? 'origine'}</p>;
}

beforeEach(() => {
  getContactAvatars.mockReset();
  saveContactAvatar.mockReset().mockResolvedValue(undefined);
  act(() => resetContactAvatars());
});
afterEach(cleanup);

describe('choix d’avatar par contact', () => {
  it('montre l’origine tant que rien n’est chargé', () => {
    render(<Probe slug="jade" />);
    expect(screen.getByText('origine')).toBeTruthy();
  });

  it('charge les choix et prévient les écrans ouverts', async () => {
    render(<Probe slug="jade" />);
    getContactAvatars.mockResolvedValue({ jade: { id: 'a010' } });
    await act(() => loadContactAvatars('tok'));
    expect(screen.getByText('a010')).toBeTruthy();
  });

  it('garde l’origine si le chargement échoue', async () => {
    render(<Probe slug="jade" />);
    getContactAvatars.mockRejectedValue(new Error('réseau'));
    await act(() => loadContactAvatars('tok'));
    expect(screen.getByText('origine')).toBeTruthy();
  });

  it('enregistre un choix puis le retire', async () => {
    render(<Probe slug="jade" />);
    await act(() => chooseContactAvatar('tok', 'jade', { id: 'a020' }));
    expect(saveContactAvatar).toHaveBeenCalledWith('tok', 'jade', { id: 'a020' });
    expect(screen.getByText('a020')).toBeTruthy();
    await act(() => chooseContactAvatar('tok', 'jade', null));
    expect(screen.getByText('origine')).toBeTruthy();
  });

  it('ne change rien si l’API refuse', async () => {
    render(<Probe slug="jade" />);
    saveContactAvatar.mockRejectedValue(new Error('403'));
    await expect(chooseContactAvatar('tok', 'jade', { id: 'a020' })).rejects.toThrow();
    expect(screen.getByText('origine')).toBeTruthy();
  });
});
