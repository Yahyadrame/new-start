import type { ComponentProps } from 'react';
import { Drawer } from 'vaul';
import { cn } from '../lib/cn';

export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetTitle = Drawer.Title;
export const SheetDescription = Drawer.Description;

/** Feuille du bas (Vaul) : glisser vers le bas pour fermer. Titre obligatoire (SheetTitle). */
export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Drawer.Content>) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 bg-black/60" />
      <Drawer.Content
        className={cn(
          'fixed inset-x-0 bottom-0 rounded-t-3xl bg-surface-1 p-6 pt-3 text-text',
          className,
        )}
        {...props}
      >
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-2" />
        {children}
      </Drawer.Content>
    </Drawer.Portal>
  );
}
