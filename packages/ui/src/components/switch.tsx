import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** La zone cliquable dépasse le dessin (after:-inset-2) pour atteindre 44 px. */
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-surface-2 transition-colors after:absolute after:-inset-2 data-[state=checked]:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-1 rounded-full bg-text transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-accent" />
    </SwitchPrimitive.Root>
  );
}
