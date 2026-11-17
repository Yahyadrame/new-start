import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// jsdom n'a ni ResizeObserver ni scrollIntoView, que Radix et cmdk utilisent.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(cleanup);

function Picker({ onPick }: { onPick: (value: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger>Pays</PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput aria-label="Chercher" />
          <CommandList>
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandItem value="Sénégal" onSelect={onPick}>
              Sénégal
            </CommandItem>
            <CommandItem value="France" onSelect={onPick}>
              France
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

describe('Popover + Command', () => {
  it('s’ouvre, filtre la liste et renvoie le choix', () => {
    const onPick = vi.fn();
    render(<Picker onPick={onPick} />);
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(screen.getByText('Pays'));
    fireEvent.change(screen.getByLabelText('Chercher'), { target: { value: 'fra' } });
    expect(screen.queryByText('Sénégal')).toBeNull();
    fireEvent.click(screen.getByText('France'));
    expect(onPick).toHaveBeenCalledWith('France');
  });
  it('dit quand rien ne correspond', () => {
    render(<Picker onPick={() => {}} />);
    fireEvent.click(screen.getByText('Pays'));
    fireEvent.change(screen.getByLabelText('Chercher'), { target: { value: 'zzz' } });
    expect(screen.getByText('Aucun résultat')).toBeTruthy();
  });
});
