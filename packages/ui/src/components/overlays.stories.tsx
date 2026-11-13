import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from './sheet';
import { Toaster, toast } from './toast';

const meta = { title: 'Primitives/Calques' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Modale: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ouvrir la modale</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="text-lg font-bold">Quitter la série ?</DialogTitle>
        <DialogDescription className="mt-2 text-text-muted">
          Ta progression est gardée.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  ),
};
export const FeuilleDuBas: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Ouvrir la feuille</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="text-lg font-bold">Options</SheetTitle>
        <SheetDescription className="mt-2 text-text-muted">
          Glisse vers le bas pour fermer.
        </SheetDescription>
      </SheetContent>
    </Sheet>
  ),
};
export const Notification: Story = {
  render: () => (
    <>
      <Toaster />
      <Button onClick={() => toast('Message envoyé')}>Afficher une notification</Button>
    </>
  ),
};
