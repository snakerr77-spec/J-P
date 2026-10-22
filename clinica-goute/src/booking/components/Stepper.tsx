import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const bookingSteps = ['Profissional', 'Data e horário', 'Seus dados', 'Confirmação'] as const;

type Props = {
  current: number;
  /** Etapas que o paciente pode revisitar (já concluídas). */
  maxReached: number;
  onGo: (step: number) => void;
};

export default function Stepper({ current, maxReached, onGo }: Props) {
  return (
    <nav aria-label="Etapas do agendamento">
      <ol className="flex items-center">
        {bookingSteps.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          const clickable = step < current && step <= maxReached && current < 4;
          return (
            <li key={label} className={cn('flex items-center', index < bookingSteps.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onGo(step)}
                className={cn('group flex items-center gap-2.5 rounded-full py-1 pr-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:pr-3', clickable ? 'cursor-pointer' : 'cursor-default')}
              >
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
                    done && 'bg-leaf-700 text-white',
                    active && 'bg-primary text-primary-foreground shadow-md ring-4 ring-brand-100',
                    !done && !active && 'bg-muted text-muted-foreground'
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : step}
                </span>
                <span className={cn('hidden text-sm font-semibold sm:block', active ? 'text-foreground' : done ? 'text-leaf-800' : 'text-muted-foreground')}>
                  {label}
                </span>
                <span className="sr-only sm:hidden">{label}</span>
              </button>
              {index < bookingSteps.length - 1 && (
                <span aria-hidden="true" className={cn('mx-1 h-0.5 flex-1 rounded-full sm:mx-2', done ? 'bg-leaf-600' : 'bg-border')} />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-foreground sm:hidden" aria-hidden="true">
        Etapa {current} de {bookingSteps.length} · <span className="text-leaf-800">{bookingSteps[current - 1]}</span>
      </p>
    </nav>
  );
}
