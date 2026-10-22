import * as React from 'react';
import { cn } from '@/lib/utils';

type SwitchProps = Omit<React.ComponentProps<'button'>, 'onChange' | 'role' | 'type'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/** Interruptor acessível (role="switch"). Forneça `aria-label` ou associe um <label htmlFor>. */
function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-leaf-700' : 'bg-input',
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn('block size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5')} />
    </button>
  );
}

export { Switch };
