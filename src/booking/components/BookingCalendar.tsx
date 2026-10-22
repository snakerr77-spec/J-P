import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bookableRange, freeCount, nextAvailable, slotsFor } from '../availability';
import { capitalize, dateKey, formatLongDate, formatMonthYear, parseDateKey } from '../format';
import type { Appointment, Professional } from '../types';

const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const weekdayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

type Props = {
  professional: Professional;
  appointments: Appointment[];
  selected: string | null;
  onSelect: (key: string) => void;
};

export default function BookingCalendar({ professional, appointments, selected, onSelect }: Props) {
  const now = useMemo(() => new Date(), []);
  const { first, last } = bookableRange(now);
  const [cursor, setCursor] = useState(() => {
    const base = selected ? parseDateKey(selected) : parseDateKey(nextAvailable(professional, appointments, now)?.date ?? dateKey(first));
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const todayKey = dateKey(now);
  const month = cursor.getMonth();
  const cells = useMemo(() => {
    const total = new Date(cursor.getFullYear(), month + 1, 0).getDate();
    const lead = new Date(cursor.getFullYear(), month, 1).getDay();
    const days = Array.from({ length: total }, (_, index) => {
      const date = new Date(cursor.getFullYear(), month, index + 1);
      const key = dateKey(date);
      return { key, day: index + 1, free: freeCount(slotsFor(professional, key, appointments, now)), weekday: date.getDay() };
    });
    return { lead, days };
  }, [cursor, month, professional, appointments, now]);

  const canPrev = new Date(cursor.getFullYear(), month, 0) >= first;
  const canNext = new Date(cursor.getFullYear(), month + 1, 1) <= last;
  const shift = (delta: number) => setCursor(new Date(cursor.getFullYear(), month + delta, 1));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold" aria-live="polite">{capitalize(formatMonthYear(cursor))}</h3>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mês anterior" className="grid size-9 place-items-center rounded-lg border border-input bg-card transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-card">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Próximo mês" className="grid size-9 place-items-center rounded-lg border border-input bg-card transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-card">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="group" aria-label={`Dias de ${formatMonthYear(cursor)}`}>
        {weekdayLabels.map((label, index) => (
          <span key={index} className="pb-1 text-xs font-bold text-muted-foreground" aria-hidden="true">{label}</span>
        ))}
        {Array.from({ length: cells.lead }, (_, index) => <span key={`lead-${index}`} />)}
        {cells.days.map(({ key, day, free, weekday }) => {
          const isSelected = key === selected;
          const disabled = free === 0;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={disabled ? `${formatLongDate(key)}, sem horários` : `${formatLongDate(key)}, ${free} ${free === 1 ? 'horário livre' : 'horários livres'}`}
              onClick={() => onSelect(key)}
              title={disabled ? `Sem horários (${weekdayNames[weekday]})` : undefined}
              className={cn(
                'relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all',
                'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                isSelected && 'bg-primary text-primary-foreground shadow-md',
                !isSelected && !disabled && 'bg-accent/60 text-foreground hover:bg-aqua-100',
                disabled && 'cursor-not-allowed text-muted-foreground/55',
                key === todayKey && !isSelected && 'ring-1 ring-navy-200'
              )}
            >
              {day}
              {!disabled && <span aria-hidden="true" className={cn('absolute bottom-1.5 size-1 rounded-full', isSelected ? 'bg-aqua-300' : 'bg-aqua-600')} />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded bg-accent ring-1 ring-aqua-300" aria-hidden="true" />Com horários</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded bg-primary" aria-hidden="true" />Selecionado</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded bg-muted ring-1 ring-border" aria-hidden="true" />Indisponível</span>
      </div>
    </div>
  );
}
