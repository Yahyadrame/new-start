import { CHAT_BACKGROUNDS } from '@newstart/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../i18n/fr.json';
import { ChatBackdrop, ChatBackgroundPicker } from '.';
import { TILES } from './patterns';

afterEach(cleanup);

describe('ChatBackdrop', () => {
  it("n'affiche rien pour le fond uni", () => {
    const { container } = render(<ChatBackdrop value="NONE" />);
    expect(container.firstChild).toBeNull();
  });

  it('teinte le fond Citron doux sans motif', () => {
    const { container } = render(<ChatBackdrop value="TINT" />);
    expect(container.querySelector('pattern')).toBeNull();
    expect(container.firstElementChild?.className).toContain('bg-accent/10');
  });

  it.each(Object.keys(TILES))('dessine le motif %s, décoratif et derrière le contenu', (key) => {
    const { container } = render(<ChatBackdrop value={key as (typeof CHAT_BACKGROUNDS)[number]} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('class')).toContain('-z-10');
    expect(container.querySelector('pattern')).not.toBeNull();
  });

  it('couvre chaque fond de la liste partagée', () => {
    const covered = new Set(['NONE', 'TINT', ...Object.keys(TILES)]);
    expect([...CHAT_BACKGROUNDS].every((k) => covered.has(k))).toBe(true);
  });
});

describe('ChatBackgroundPicker', () => {
  it('propose les dix fonds, celui du compte enfoncé', () => {
    render(<ChatBackgroundPicker value="DOTS" onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.map((b) => b.textContent)).toEqual([fr.chatBackground.names.DOTS]);
  });

  it('renvoie le fond touché', () => {
    const onChange = vi.fn();
    render(<ChatBackgroundPicker value="NONE" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: fr.chatBackground.names.WAVES }));
    expect(onChange).toHaveBeenCalledWith('WAVES');
  });
});
