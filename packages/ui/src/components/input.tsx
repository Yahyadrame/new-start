import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from '../lib/cn';

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={cn(
        'min-h-11 w-full rounded-full border border-line bg-surface-1 px-4 text-[15px] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text aria-invalid:border-danger disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
