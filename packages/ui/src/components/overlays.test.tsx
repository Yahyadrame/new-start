import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../test/a11y';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet';
import { Toaster, toast } from './toast';

// jsdom n'a pas matchMedia, que Vaul et Sonner interrogent.
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
    onchange: null,
  })) as typeof window.matchMedia;
});
afterEach(cleanup);

describe('Dialog', () => {
  it('s’ouvre au clic, expose son titre et se ferme avec Fermer', async () => {
    render(
      <Dialog>
        <DialogTrigger>Ouvrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Quitter la série ?</DialogTitle>
          <DialogDescription>Ta progression est gardée.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Ouvrir'));
    const dialog = screen.getByRole('dialog', { name: 'Quitter la série ?' });
    await expectNoA11yViolations(dialog);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Sheet', () => {
  it('s’ouvre au clic avec son titre', async () => {
    render(
      <Sheet>
        <SheetTrigger>Options</SheetTrigger>
        <SheetContent>
          <SheetTitle>Options</SheetTitle>
          <SheetDescription>Choisis une action.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.click(screen.getByText('Options'));
    const sheet = await screen.findByRole('dialog', { name: 'Options' });
    await expectNoA11yViolations(sheet);
  });
});

describe('Toast', () => {
  it('affiche le message envoyé par toast()', async () => {
    render(<Toaster />);
    act(() => {
      toast('Message envoyé');
    });
    expect(await screen.findByText('Message envoyé')).toBeTruthy();
  });
});
