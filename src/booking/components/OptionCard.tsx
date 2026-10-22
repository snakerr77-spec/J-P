import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  aside?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

/** Radio nativo (acessível por teclado/leitor de tela) com aparência de cartão. */
export default function OptionCard({ name, value, checked, onChange, title, description, aside, icon, disabled }: Props) {
  return (
    <label
      className={cn(
        'relative flex min-h-16 items-center gap-3 rounded-xl border bg-card p-3.5 transition-all has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:border-aqua-600/60 hover:shadow-sm',
        checked && 'border-aqua-600 bg-accent/70 shadow-sm ring-1 ring-aqua-600'
      )}
    >
      <input type="radio" className="sr-only" name={name} value={value} checked={checked} disabled={disabled} onChange={() => onChange(value)} />
      {icon && <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', checked ? 'bg-aqua-700 text-white' : 'bg-muted text-navy-800')} aria-hidden="true">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
      </span>
      {aside && <span className="shrink-0 text-right text-sm font-bold">{aside}</span>}
      <span aria-hidden="true" className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors', checked ? 'border-aqua-700 bg-aqua-700 text-white' : 'border-input bg-card')}>
        {checked && <Check className="size-3" strokeWidth={3.5} />}
      </span>
    </label>
  );
}
