import type { Ref, SelectHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

/** Liste native : sur mobile, le téléphone ouvre sa propre roue de choix. */
export function Select({
  className,
  ref,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <select
      ref={ref}
      className={cn(
        'min-h-11 w-full rounded-full border border-line bg-surface-1 px-4 text-[15px] text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text aria-invalid:border-danger disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
