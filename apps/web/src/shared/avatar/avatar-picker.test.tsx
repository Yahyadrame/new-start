import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';
import { AvatarPicker } from './avatar-picker';

const t = fr.avatar;

beforeAll(() => {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});
afterEach(cleanup);

const open = (value = null as Parameters<typeof AvatarPicker>[0]['value']) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<AvatarPicker value={value} name="Awa" onSave={onSave} onClose={onClose} />);
  return { onSave, onClose };
};
const sil = (n: string) => screen.getByRole('button', { name: t.silhouetteN.replace('{id}', n) });

describe('AvatarPicker', () => {
  it('montre 20 silhouettes puis 40 de plus', () => {
    open();
    expect(screen.getAllByRole('button', { name: /^Silhouette / })).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: t.more.replace('{n}', '340') }));
    expect(screen.getAllByRole('button', { name: /^Silhouette / })).toHaveLength(60);
  });

  it('enregistre silhouette, couleur et style choisis', async () => {
    const { onSave, onClose } = open();
    fireEvent.click(sil('005'));
    fireEvent.click(screen.getByRole('button', { name: 'Corail' }));
    fireEvent.click(screen.getByRole('button', { name: t.styles.noir }));
    fireEvent.click(screen.getByRole('button', { name: t.save }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith({ id: 'a005', palette: 'Corail', variant: 'noir' });
  });

  it('repart du choix déjà enregistré', () => {
    open({ id: 'a007', variant: 'anneau' });
    expect(sil('007').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: t.styles.anneau }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it("retire l'avatar", async () => {
    const { onSave, onClose } = open({ id: 'a007' });
    fireEvent.click(screen.getByRole('button', { name: t.remove }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(null);
  });
});
