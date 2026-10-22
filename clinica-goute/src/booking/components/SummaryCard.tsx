import type { ReactNode } from 'react';
import { CalendarClock, CreditCard, MapPin, ShieldCheck, Stethoscope, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clinic } from '../config';
import { capitalize, formatBRL, formatLongDate } from '../format';
import { priceFor } from '../availability';
import ProfessionalAvatar from './ProfessionalAvatar';
import type { Modality, PaymentType, Professional, VisitType } from '../types';

type Props = {
  professional: Professional | null;
  specialtyLabel?: string;
  date: string | null;
  time: string | null;
  modality: Modality;
  visitType: VisitType;
  paymentType: PaymentType;
};

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-brand-800" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{children}</p>
      </div>
    </li>
  );
}

export default function SummaryCard({ professional, specialtyLabel, date, time, modality, visitType, paymentType }: Props) {
  const price = professional ? priceFor(professional, modality, visitType) : null;
  const empty = <span className="font-medium text-muted-foreground">A escolher</span>;

  return (
    <Card className="overflow-hidden" aria-label="Resumo da consulta">
      <CardHeader className="bg-gradient-to-br from-brand-950 to-brand-800 pb-4 text-white">
        <p className="text-xs font-bold tracking-wider text-leaf-300 uppercase">Resumo da consulta</p>
        {professional ? (
          <div className="mt-1 flex items-center gap-3">
            <ProfessionalAvatar name={professional.name} tone={professional.tone} size="sm" className="ring-2 ring-white/30" />
            <div className="min-w-0">
              <CardTitle className="truncate text-white">{professional.name}</CardTitle>
              <p className="text-sm text-brand-100">{specialtyLabel}</p>
            </div>
          </div>
        ) : (
          <CardTitle className="font-display text-lg text-white">Escolha um profissional para começar</CardTitle>
        )}
      </CardHeader>

      <CardContent>
        <ul className="flex flex-col gap-3.5">
          <Row icon={<CalendarClock className="size-4" />} label="Data e horário">
            {date && time ? `${capitalize(formatLongDate(date))} · ${time}` : empty}
          </Row>
          <Row icon={modality === 'telemedicina' ? <Video className="size-4" /> : <MapPin className="size-4" />} label="Atendimento">
            {professional ? (modality === 'telemedicina' ? 'Telemedicina (vídeo)' : 'Presencial') : empty}
          </Row>
          <Row icon={<Stethoscope className="size-4" />} label="Tipo de consulta">
            {professional ? (visitType === 'retorno' ? `Retorno (até ${clinic.returnWindowDays} dias)` : 'Primeira consulta') : empty}
          </Row>
        </ul>
      </CardContent>

      <div className="mx-5 mb-5 rounded-xl border border-coral/40 bg-coral-soft/70 p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-coral-foreground">
          <CreditCard className="size-3.5" aria-hidden="true" /> Valor da consulta
        </div>
        {price === null ? (
          <p className="mt-1 text-sm font-medium text-coral-foreground">Disponível após escolher o profissional.</p>
        ) : paymentType === 'convenio' ? (
          <>
            <p className="mt-1 font-display text-xl font-bold text-brand-900">Conforme convênio</p>
            <p className="mt-0.5 text-xs text-coral-foreground">Referência particular: {formatBRL(price)}</p>
          </>
        ) : (
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-brand-900">{formatBRL(price)}</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-coral-foreground">{clinic.paymentNote}</p>
      </div>

      <p className="mx-5 mb-5 -mt-2 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-leaf-700" aria-hidden="true" />
        Seus dados são usados apenas para agendar e confirmar sua consulta.
      </p>
    </Card>
  );
}
