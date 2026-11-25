import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { Composer } from './composer';

afterEach(cleanup);
const c = fr.conversation;
const form = () => field().closest('form') as HTMLFormElement;
const field = () => screen.getByLabelText(c.composerLabel) as HTMLTextAreaElement;

describe('Composer', () => {
  it('garde le bouton désactivé tant que le champ est vide ou ne contient que des espaces', () => {
    render(<Composer onSend={vi.fn()} />);
    const button = screen.getByRole('button', { name: c.send }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(field(), { target: { value: '   ' } });
    expect(button.disabled).toBe(true);
    fireEvent.change(field(), { target: { value: 'Hi' } });
    expect(button.disabled).toBe(false);
  });

  it('envoie le texte sans espaces autour puis vide le champ', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: '  Hello there  ' } });
    fireEvent.submit(form());
    expect(onSend).toHaveBeenCalledWith('Hello there');
    expect(field().value).toBe('');
  });

  it("n'envoie rien quand le champ est vide", () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    fireEvent.submit(form());
    expect(onSend).not.toHaveBeenCalled();
  });

  it('envoie avec Entrée et passe à la ligne avec Maj+Entrée', () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    fireEvent.change(field(), { target: { value: 'Hello' } });
    fireEvent.keyDown(field(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Hello');
    expect(field().value).toBe('');
  });

  // Sous 16 px, Safari sur iPhone zoome la page au toucher du champ : bulles et bouton coupés.
  it('écrit en 16 px pour que le téléphone ne zoome pas au toucher', () => {
    render(<Composer onSend={vi.fn()} />);
    expect(field().className).toContain('text-base');
  });
});
