import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, CalendarCheck2, CircleAlert, HandCoins, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatPhoneBR } from '../../phone';
import OptionCard from '../components/OptionCard';
import { priceFor } from '../availability';
import { formatBRL, dateKey } from '../format';
import { validateForm, type FormErrors, type PatientForm } from '../form';
import type { Modality, Professional, VisitType } from '../types';

type Props = {
  form: PatientForm;
  onChange: (patch: Partial<PatientForm>) => void;
  professional: Professional;
  modality: Modality;
  visitType: VisitType;
  submitError: string | null;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

function Field({ id, label, error, hint, optional, children }: { id: string; label: string; error?: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}{optional && <span className="font-medium text-muted-foreground">(opcional)</span>}</Label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><CircleAlert className="size-3.5" aria-hidden="true" />{error}</p>}
    </div>
  );
}

export default function DetailsStep({ form, onChange, professional, modality, visitType, submitError, submitting, onBack, onSubmit }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof PatientForm, boolean>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const errors: FormErrors = validateForm(form);
  const show = (key: keyof PatientForm) => (submitted || touched[key]) ? errors[key] : undefined;
  const touch = (key: keyof PatientForm) => setTouched(current => ({ ...current, [key]: true }));
  const aria = (key: keyof PatientForm, hint = false) => ({
    'aria-invalid': show(key) ? true : undefined,
    'aria-describedby': show(key) ? `${String(key)}-error` : hint ? `${String(key)}-hint` : undefined,
    onBlur: () => touch(key)
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    onSubmit();
  };

  const price = priceFor(professional, modality, visitType);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 id="booking-step-heading" tabIndex={-1} className="font-display text-2xl font-semibold tracking-tight outline-none sm:text-3xl">Quase lá! Seus dados</h2>
        <p className="mt-1.5 text-muted-foreground">Usamos estas informações para confirmar a consulta pelo WhatsApp.</p>
      </div>

      {submitError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-semibold text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{submitError}
        </div>
      )}

      <Card>
        <CardContent className="grid gap-5 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="name" label="Nome completo" error={show('name')}>
              <Input id="name" autoComplete="name" value={form.name} onChange={event => onChange({ name: event.target.value })} placeholder="Como está no seu documento" {...aria('name')} />
            </Field>
          </div>
          <Field id="phone" label="WhatsApp / telefone" error={show('phone')} hint="Enviaremos a confirmação neste número.">
            <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={event => onChange({ phone: formatPhoneBR(event.target.value) })} placeholder="(00) 00000-0000" {...aria('phone', true)} />
          </Field>
          <Field id="email" label="E-mail" error={show('email')}>
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={event => onChange({ email: event.target.value })} placeholder="voce@email.com" {...aria('email')} />
          </Field>
          <Field id="birthDate" label="Data de nascimento" optional error={show('birthDate')}>
            <Input id="birthDate" type="date" autoComplete="bday" max={dateKey(new Date())} value={form.birthDate} onChange={event => onChange({ birthDate: event.target.value })} {...aria('birthDate')} />
          </Field>
        </CardContent>
      </Card>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-bold">Forma de atendimento</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            name="paymentType" value="particular" checked={form.paymentType === 'particular'} onChange={() => onChange({ paymentType: 'particular' })}
            icon={<HandCoins className="size-5" />} title="Particular" description="Pagamento na clínica" aside={formatBRL(price)}
          />
          <OptionCard
            name="paymentType" value="convenio" checked={form.paymentType === 'convenio'} onChange={() => onChange({ paymentType: 'convenio' })}
            icon={<IdCard className="size-5" />} title="Convênio" description="Informe a carteirinha" aside={<span className="text-xs font-semibold text-muted-foreground">Conforme plano</span>}
          />
        </div>
        {form.paymentType === 'convenio' && (
          <Card>
            <CardContent className="grid gap-5 py-5 sm:grid-cols-2">
              <Field id="insuranceName" label="Nome do convênio" error={show('insuranceName')}>
                <Input id="insuranceName" value={form.insuranceName} onChange={event => onChange({ insuranceName: event.target.value })} {...aria('insuranceName')} />
              </Field>
              <Field id="insuranceCard" label="Número da carteirinha" error={show('insuranceCard')}>
                <Input id="insuranceCard" value={form.insuranceCard} onChange={event => onChange({ insuranceCard: event.target.value })} {...aria('insuranceCard')} />
              </Field>
              <p className="text-xs text-muted-foreground sm:col-span-2">A clínica confirma a cobertura e eventual coparticipação antes da consulta.</p>
            </CardContent>
          </Card>
        )}
      </fieldset>

      <Card>
        <CardContent className="flex flex-col gap-5 py-5">
          <Field id="reason" label="Motivo da consulta ou observações" optional hint={`${form.reason.length}/300`}>
            <Textarea id="reason" maxLength={300} value={form.reason} onChange={event => onChange({ reason: event.target.value })} placeholder="Conte rapidamente o que está sentindo ou o que deseja avaliar." aria-describedby="reason-hint" />
          </Field>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox" id="consent" checked={form.consent} onChange={event => onChange({ consent: event.target.checked })}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-aqua-700" {...aria('consent')}
              />
              <span>Li e concordo que meus dados sejam usados para agendar e confirmar esta consulta, conforme a LGPD.</span>
            </label>
            {show('consent') && <p id="consent-error" className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><CircleAlert className="size-3.5" aria-hidden="true" />{show('consent')}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}><ArrowLeft aria-hidden="true" /> Voltar</Button>
        <Button type="submit" size="lg" variant="accent" disabled={submitting}>
          <CalendarCheck2 aria-hidden="true" /> {submitting ? 'Agendando…' : 'Confirmar agendamento'}
        </Button>
      </div>
    </form>
  );
}
