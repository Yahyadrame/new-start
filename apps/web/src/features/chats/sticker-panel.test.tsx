import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { STICKERS } from '@newstart/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { StickerPanel } from './sticker-panel';

afterEach(cleanup);
const c = fr.conversation;

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
