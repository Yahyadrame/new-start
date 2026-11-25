import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChoiceChips } from './choice-chips';

afterEach(cleanup);
const choices = ['A', 'B', 'C'].map((v) => ({ value: v, label: `Choix ${v}` }));

function Demo({ max }: { max: number }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ChoiceChips legend="Test" choices={choices} value={value} max={max} onChange={setValue} />
  );
}
const chip = (n: string) => screen.getByRole('button', { name: `Choix ${n}` });

describe('ChoiceChips', () => {
  it('coche et décoche plusieurs puces, et compte les choix', () => {
    render(<Demo max={2} />);
    fireEvent.click(chip('A'));
    fireEvent.click(chip('B'));
    expect(chip('A').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('2 sur 2 choisis');
    fireEvent.click(chip('A'));
    expect(chip('A').getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 choisis');
  });
  it('grise les autres puces une fois le maximum atteint', () => {
    render(<Demo max={1} />);
    fireEvent.click(chip('A'));
    expect((chip('B') as HTMLButtonElement).disabled).toBe(true);
    expect((chip('A') as HTMLButtonElement).disabled).toBe(false);
  });
  it('affiche l’aide sous le libellé quand il y en a une', () => {
    render(
      <ChoiceChips
        legend="Test"
        choices={[{ value: 'A', label: 'Choix A', hint: 'Une aide' }]}
        value={[]}
        max={1}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Une aide/ })).toBeTruthy();
  });
});
