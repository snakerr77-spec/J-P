import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Building2, CalendarSearch, Moon, RotateCcw, Stethoscope, Sun, Sunset, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { priceFor, slotsFor } from '../availability';
import BookingCalendar from '../components/BookingCalendar';
import OptionCard from '../components/OptionCard';
import { clinic } from '../config';
import { capitalize, formatBRL, formatLongDate, toMinutes } from '../format';
import type { Appointment, Modality, Professional, VisitType } from '../types';

type Props = {
  professional: Professional;
  appointments: Appointment[];
  date: string | null;
  time: string | null;
  modality: Modality;
  visitType: VisitType;
  onChange: (patch: Partial<{ date: string | null; time: string | null; modality: Modality; visitType: VisitType }>) => void;
  onBack: () => void;
  onNext: () => void;
};

const periods = [
  { id: 'manha', label: 'Manhã', icon: Sun, test: (minutes: number) => minutes < 12 * 60 },
  { id: 'tarde', label: 'Tarde', icon: Sunset, test: (minutes: number) => minutes >= 12 * 60 && minutes < 18 * 60 },
  { id: 'noite', label: 'Noite', icon: Moon, test: (minutes: number) => minutes >= 18 * 60 }
];

export default function ScheduleStep({ professional, appointments, date, time, modality, visitType, onChange, onBack, onNext }: Props) {
  const slots = useMemo(
    () => (date ? slotsFor(professional, date, appointments).filter(slot => slot.state !== 'past') : []),
    [professional, appointments, date]
  );
  const supportsTele = professional.telePrice !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 id="booking-step-heading" tabIndex={-1} className="font-display text-2xl font-semibold tracking-tight outline-none sm:text-3xl">
          Escolha o melhor dia e horário
        </h2>
        <p className="mt-1.5 text-muted-foreground">
          Consulta com <strong className="text-foreground">{professional.name}</strong> · duração aproximada de {professional.slotMinutes} minutos.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-bold">Como prefere ser atendido?</legend>
          <OptionCard
            name="modality" value="presencial" checked={modality === 'presencial'}
            onChange={() => onChange({ modality: 'presencial' })}
            icon={<Building2 className="size-5" />} title="Presencial" description={clinic.address || 'Na clínica'}
            aside={formatBRL(priceFor(professional, 'presencial', visitType))}
          />
          <OptionCard
            name="modality" value="telemedicina" checked={modality === 'telemedicina'} disabled={!supportsTele}
            onChange={() => onChange({ modality: 'telemedicina' })}
            icon={<Video className="size-5" />} title="Telemedicina" description={supportsTele ? 'Consulta por vídeo' : 'Indisponível para este profissional'}
            aside={supportsTele ? formatBRL(priceFor(professional, 'telemedicina', visitType)) : undefined}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-bold">Tipo de consulta</legend>
          <OptionCard
            name="visitType" value="primeira" checked={visitType === 'primeira'}
            onChange={() => onChange({ visitType: 'primeira' })}
            icon={<Stethoscope className="size-5" />} title="Primeira consulta" description="Nova avaliação"
            aside={formatBRL(priceFor(professional, modality, 'primeira'))}
          />
          <OptionCard
            name="visitType" value="retorno" checked={visitType === 'retorno'}
            onChange={() => onChange({ visitType: 'retorno' })}
            icon={<RotateCcw className="size-5" />} title="Retorno" description={`Até ${clinic.returnWindowDays} dias da última consulta`}
            aside={formatBRL(priceFor(professional, modality, 'retorno'))}
          />
        </fieldset>
      </div>

      <Card className="gap-0 overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,22rem)_1fr]">
          <CardContent className="border-b py-5 md:border-r md:border-b-0">
            <BookingCalendar
              professional={professional}
              appointments={appointments}
              selected={date}
              onSelect={key => onChange({ date: key, time: null })}
            />
          </CardContent>

          <div className="flex flex-col py-5">
            <CardHeader className="pb-3">
              <h3 className="text-base font-bold" aria-live="polite">
                {date ? capitalize(formatLongDate(date)) : 'Horários disponíveis'}
              </h3>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {!date && (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <div><CalendarSearch className="mx-auto mb-2 size-7 text-leaf-700" aria-hidden="true" />Selecione um dia no calendário para ver os horários.</div>
                </div>
              )}
              {date && !slots.length && (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Sem horários neste dia. Escolha outra data.</div>
              )}
              {date && periods.map(period => {
                const group = slots.filter(slot => period.test(toMinutes(slot.time)));
                if (!group.length) return null;
                const Icon = period.icon;
                return (
                  <section key={period.id} aria-label={period.label}>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase"><Icon className="size-3.5" aria-hidden="true" />{period.label}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.map(slot => {
                        const selected = slot.time === time;
                        const busy = slot.state === 'busy';
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={busy}
                            aria-pressed={selected}
                            aria-label={busy ? `${slot.time}, indisponível` : `${slot.time}${selected ? ', selecionado' : ''}`}
                            onClick={() => onChange({ time: slot.time })}
                            className={cn(
                              'h-11 rounded-lg border text-sm font-bold tabular-nums transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                              selected && 'border-primary bg-primary text-primary-foreground shadow-md',
                              !selected && !busy && 'border-input bg-card hover:border-leaf-600 hover:bg-accent',
                              busy && 'cursor-not-allowed border-transparent bg-muted text-muted-foreground/60 line-through'
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </CardContent>
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" /> Trocar profissional</Button>
        <Button size="lg" onClick={onNext} disabled={!date || !time}>Continuar <ArrowRight aria-hidden="true" /></Button>
      </div>
    </div>
  );
}
