import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarPlus, Check, Clock3, Copy, IdCard, MapPin, MessageCircle, Plus, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { clinic } from '../config';
import { capitalize, formatBRL, formatLongDate } from '../format';
import { downloadIcs, whatsappLink } from '../share';
import ProfessionalAvatar from '../components/ProfessionalAvatar';
import type { Appointment, Professional } from '../types';

type Props = { appointment: Appointment; professional: Professional; onNew: () => void };

export default function ConfirmationStep({ appointment, professional, onNew }: Props) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const copyProtocol = async () => {
    try {
      await navigator.clipboard.writeText(appointment.protocol);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const tele = appointment.modality === 'telemedicina';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <motion.span
          initial={reduce ? false : { scale: .6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-success-soft text-success ring-8 ring-success-soft/50"
        >
          <Check className="size-8" strokeWidth={3} aria-hidden="true" />
        </motion.span>
        <h2 id="booking-step-heading" tabIndex={-1} className="font-display text-3xl font-semibold tracking-tight outline-none">Consulta solicitada!</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Enviamos sua solicitação para a clínica. A confirmação final chega pelo WhatsApp informado — se preferir, adiante pelo botão abaixo.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-brand-950 to-brand-800 px-5 py-4 text-white">
          <div>
            <p className="text-xs font-bold tracking-wider text-leaf-300 uppercase">Protocolo</p>
            <p className="font-mono text-lg font-bold tracking-wider" aria-label={`Protocolo ${appointment.protocol}`}>{appointment.protocol}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="coral"><Clock3 aria-hidden="true" /> Aguardando confirmação</Badge>
            <Button size="sm" variant="secondary" onClick={copyProtocol} aria-live="polite">{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? 'Copiado' : 'Copiar'}</Button>
          </div>
        </div>

        <CardContent className="flex flex-col gap-5 pb-5">
          <div className="flex items-center gap-3.5">
            <ProfessionalAvatar name={professional.name} tone={professional.tone} />
            <div>
              <p className="text-lg font-bold">{appointment.professionalName}</p>
              <p className="text-sm font-semibold text-leaf-800">{appointment.specialty}</p>
            </div>
          </div>

          <dl className="grid gap-4 rounded-xl bg-muted/70 p-4 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-muted-foreground">Data</dt><dd className="font-bold">{capitalize(formatLongDate(appointment.date))}</dd></div>
            <div><dt className="text-xs font-semibold text-muted-foreground">Horário</dt><dd className="font-bold">{appointment.time} · {appointment.durationMin} min</dd></div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Atendimento</dt>
              <dd className="inline-flex items-center gap-1.5 font-bold">{tele ? <Video className="size-4 text-leaf-700" aria-hidden="true" /> : <MapPin className="size-4 text-leaf-700" aria-hidden="true" />}{tele ? 'Telemedicina' : 'Presencial'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">Valor</dt>
              <dd className="font-bold">{appointment.paymentType === 'convenio' ? <span className="inline-flex items-center gap-1.5"><IdCard className="size-4 text-leaf-700" aria-hidden="true" />Convênio {appointment.insuranceName}</span> : formatBRL(appointment.price)}</dd>
            </div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold text-muted-foreground">Paciente</dt><dd className="font-bold">{appointment.patient.name}</dd></div>
          </dl>

          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-leaf-700" aria-hidden="true" />{tele ? 'O link da videochamada será enviado pela clínica antes do horário.' : <>Chegue 15 minutos antes{clinic.address ? ` em ${clinic.address}` : ' (o endereço será enviado na confirmação)'}.</>}</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-leaf-700" aria-hidden="true" />Leve documento com foto{appointment.paymentType === 'convenio' ? ' e a carteirinha do convênio' : ''}.</li>
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-leaf-700" aria-hidden="true" />Precisa remarcar ou cancelar? Avise pelo WhatsApp com o protocolo acima.</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button size="lg" variant="accent" asChild>
          <a href={whatsappLink(appointment)} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" /> Confirmar pelo WhatsApp</a>
        </Button>
        <Button size="lg" variant="outline" onClick={() => downloadIcs(appointment)}><CalendarPlus aria-hidden="true" /> Adicionar ao calendário</Button>
      </div>
      <Button variant="ghost" className="self-center" onClick={onNew}><Plus aria-hidden="true" /> Agendar outra consulta</Button>
    </div>
  );
}
