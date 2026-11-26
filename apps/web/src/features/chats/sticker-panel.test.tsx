import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { STICKERS } from '@newstart/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { StickerPanel } from './sticker-panel';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
const c = fr.conversation;
const send = (text: string) => c.stickerSend.replace('{text}', text);
/** Les légendes de la section « Récents » d'un panneau ouvert à neuf. */
const recents = () => {
  cleanup();
  render(<StickerPanel onPick={vi.fn()} />);
  const region = screen.queryByRole('region', { name: c.stickerRecent });
  return [...(region?.querySelectorAll('button') ?? [])].map((b) => b.textContent);
};
const pick = (...texts: string[]) => {
  cleanup();
  render(<StickerPanel onPick={vi.fn()} />);
  for (const text of texts) {
    fireEvent.click(screen.getAllByRole('button', { name: send(text) })[0] as HTMLElement);
  }
};

describe('StickerPanel', () => {
  it('liste tous les stickers, rangés par groupe', () => {
    render(<StickerPanel onPick={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(STICKERS.length);
    expect(screen.getByRole('region', { name: 'Politesse' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Quotidien' })).toBeTruthy();
  });

  it('envoie l’identifiant du sticker touché', () => {
    const onPick = vi.fn();
    render(<StickerPanel onPick={onPick} />);
    fireEvent.click(
      screen.getByRole('button', { name: c.stickerSend.replace('{text}', 'Thanks!') }),
    );
    expect(onPick).toHaveBeenCalledWith('thanks');
  });

  it('filtre sur la légende, sans tenir compte des majuscules', () => {
    render(<StickerPanel onPick={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(c.stickerSearch), { target: { value: ' GOOD ' } });
    const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(names.length).toBeGreaterThan(1);
    expect(names.every((n) => /good/i.test(n ?? ''))).toBe(true);
    expect(screen.queryByRole('region', { name: 'Accord' })).toBeNull();
  });

  it('dit quand rien ne correspond', () => {
    render(<StickerPanel onPick={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(c.stickerSearch), { target: { value: 'zzzz' } });
    expect(screen.getByText(c.stickerNone)).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('StickerPanel, récents', () => {
  it('n’affiche pas la section tant que rien n’a été envoyé', () => {
    expect(recents()).toEqual([]);
    expect(screen.queryByRole('region', { name: c.stickerRecent })).toBeNull();
  });

  it('montre les derniers envoyés d’abord, sans doublon', () => {
    pick('Thanks!', 'Bye!', 'Thanks!');
    expect(recents()).toEqual(['Thanks!', 'Bye!']);
    expect(screen.getAllByRole('region')[0]?.getAttribute('aria-label')).toBe(c.stickerRecent);
  });

  it('en garde huit au plus', () => {
    const texts = STICKERS.slice(0, 10).map((s) => s.text);
    pick(...texts);
    expect(recents()).toEqual(texts.slice(2).reverse());
  });

  it('ne déplace rien tant que le panneau reste ouvert', () => {
    render(<StickerPanel onPick={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: send('Bye!') }));
    expect(screen.queryByRole('region', { name: c.stickerRecent })).toBeNull();
  });

  it('cache la section pendant une recherche', () => {
    pick('Thanks!');
    recents();
    fireEvent.change(screen.getByLabelText(c.stickerSearch), { target: { value: 'thanks' } });
    expect(screen.queryByRole('region', { name: c.stickerRecent })).toBeNull();
  });

  it('ignore une valeur abîmée ou un sticker disparu', () => {
    for (const stored of ['{pas du json', '{"a":1}', '["disparu",12,"bye"]']) {
      window.localStorage.setItem('ns-recent-stickers', stored);
      expect(recents()).toEqual(stored.includes('bye') ? ['Bye!'] : []);
    }
  });

  it('envoie quand même si le stockage est refusé', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('refusé');
    });
    const onPick = vi.fn();
    render(<StickerPanel onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: send('Bye!') }));
    expect(onPick).toHaveBeenCalledWith('bye');
    spy.mockRestore();
  });
});
