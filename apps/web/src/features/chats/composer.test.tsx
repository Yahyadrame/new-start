import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import fr from '../../shared/i18n/fr.json';
import { Composer } from './composer';

afterEach(cleanup);
const c = fr.conversation;
const form = () => field().closest('form') as HTMLFormElement;
const field = () => screen.getByLabelText(c.composerLabel) as HTMLInputElement;

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
});
