import { Command as CommandPrimitive } from 'cmdk';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

export const Command = CommandPrimitive;
export const CommandEmpty = CommandPrimitive.Empty;

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <CommandPrimitive.Input
      className={cn(
        'min-h-11 w-full rounded-xl border-b border-line bg-transparent px-3 text-[15px] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent-text',
        className,
      )}
      {...props}
    />
  );
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List className={cn('max-h-64 overflow-y-auto p-1', className)} {...props} />
  );
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[15px] data-[selected=true]:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}
