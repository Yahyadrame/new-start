import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmojiPanel } from './emoji-panel';

type Options = {
  data: { emojis: Record<string, unknown> };
  i18n: { search: string };
  theme: string;
  emojiButtonSize: number;
  onEmojiSelect: (emoji: { native: string }) => void;
};

const built: Options[] = [];

// La bibliothèque dessine dans un composant web : on la remplace par un élément vide et on garde ses réglages.
vi.mock('emoji-mart', () => ({
  Picker: function (options: Options) {
    built.push(options);
    return document.createElement('em-emoji-picker');
  },
}));

afterEach(() => {
  cleanup();
  built.length = 0;
  document.documentElement.removeAttribute('data-theme');
});

const picker = () => document.querySelector('em-emoji-picker');
const last = () => built.at(-1) as Options;

describe('EmojiPanel', () => {
  it('affiche la liste complète en français, sans rien charger d’un serveur tiers', async () => {
    render(<EmojiPanel onPick={vi.fn()} />);
    await waitFor(() => expect(picker()).toBeTruthy());
    expect(Object.keys(last().data.emojis).length).toBeGreaterThan(1800);
    expect(last().i18n.search).toBe('Rechercher');
    expect(last().emojiButtonSize).toBeGreaterThanOrEqual(44);
  });

  it('envoie l’émoji touché au dernier onPick reçu, sans reconstruire la liste', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<EmojiPanel onPick={first} />);
    await waitFor(() => expect(picker()).toBeTruthy());
    view.rerender(<EmojiPanel onPick={second} />);
    last().onEmojiSelect({ native: '👍🏽' });
    expect(second).toHaveBeenCalledWith('👍🏽');
    expect(first).not.toHaveBeenCalled();
    expect(built).toHaveLength(1);
  });

  it('suit le thème choisi et ne garde qu’une liste quand il change', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<EmojiPanel onPick={vi.fn()} />);
    await waitFor(() => expect(picker()).toBeTruthy());
    expect(last().theme).toBe('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    await waitFor(() => expect(last().theme).toBe('light'));
    expect(document.querySelectorAll('em-emoji-picker')).toHaveLength(1);
  });

  it('ne construit rien si le panneau se ferme pendant le chargement', async () => {
    render(<EmojiPanel onPick={vi.fn()} />).unmount();
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(built).toHaveLength(0);
  });
});
