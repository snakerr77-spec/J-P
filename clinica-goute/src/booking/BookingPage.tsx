import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarHeart, CircleAlert, Clock, MapPin, MessageCircle, Phone, ShieldCheck, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { priceFor } from './availability';
import Stepper from './components/Stepper';
import SummaryCard from './components/SummaryCard';
import Logo from '@/brand/Logo';
import { clinic } from './config';
import { emptyForm, type PatientForm } from './form';
import { supportLink } from './share';
import ConfirmationStep from './steps/ConfirmationStep';
import DetailsStep from './steps/DetailsStep';
import ProfessionalStep from './steps/ProfessionalStep';
import ScheduleStep from './steps/ScheduleStep';
import { APPOINTMENTS_KEY, PROFESSIONALS_KEY, createAppointment, loadAppointments, loadProfessionals } from './storage';
import type { Appointment, Modality, VisitType } from './types';

type Draft = { date: string | null; time: string | null; modality: Modality; visitType: VisitType };
const emptyDraft: Draft = { date: null, time: null, modality: 'presencial', visitType: 'primeira' };

type Props = { initialProfessionalId?: string };

export default function BookingPage({ initialProfessionalId }: Props) {
  const reduceMotion = useReducedMotion();
  const [professionals, setProfessionals] = useState(() => loadProfessionals());
  const [appointments, setAppointments] = useState(() => loadAppointments());

  const preselected = professionals.find(item => item.id === initialProfessionalId && item.active);
  const [step, setStep] = useState(preselected ? 2 : 1);
  const [maxReached, setMaxReached] = useState(preselected ? 2 : 1);
  const [professionalId, setProfessionalId] = useState<string | null>(preselected?.id ?? null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mounted = useRef(false);

  const professional = useMemo(() => professionals.find(item => item.id === professionalId) ?? null, [professionals, professionalId]);
  const specialtyLabel = professional?.specialty;

  useEffect(() => {
    const previous = document.title;
    document.title = `Agendamento de consultas | ${clinic.name}`;
    return () => { document.title = previous; };
  }, []);

  // Mantém a agenda e os valores em dia quando o painel (outra aba) altera algo.
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === APPOINTMENTS_KEY) setAppointments(loadAppointments());
      if (event.key === PROFESSIONALS_KEY) setProfessionals(loadProfessionals());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    document.getElementById('booking-stepper')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [step, reduceMotion]);

  const goTo = (next: number) => {
    setNotice(null);
    setSubmitError(null);
    setStep(next);
    setMaxReached(current => Math.max(current, next));
  };

  const selectProfessional = (id: string) => {
    const next = professionals.find(item => item.id === id);
    if (!next) return;
    if (id !== professionalId) {
      setDraft(current => ({ ...emptyDraft, visitType: current.visitType, modality: next.telePrice === undefined ? 'presencial' : current.modality }));
    }
    setProfessionalId(id);
    goTo(2);
  };

  const patchDraft = (patch: Partial<Draft>) => setDraft(current => ({ ...current, ...patch }));

  const submit = () => {
    if (!professional || !draft.date || !draft.time) return;
    const insurance = form.paymentType === 'convenio';
    const result = createAppointment({
      professionalId: professional.id,
      professionalName: professional.name,
      specialty: specialtyLabel ?? '',
      date: draft.date,
      time: draft.time,
      durationMin: professional.slotMinutes,
      modality: draft.modality,
      visitType: draft.visitType,
      paymentType: form.paymentType,
      insuranceName: insurance ? form.insuranceName.trim() : undefined,
      insuranceCard: insurance ? form.insuranceCard.trim() : undefined,
      price: insurance ? 0 : priceFor(professional, draft.modality, draft.visitType),
      patient: {
        name: form.name.trim().replace(/\s+/g, ' '),
        phone: form.phone,
        email: form.email.trim().toLowerCase(),
        birthDate: form.birthDate || undefined
      },
      reason: form.reason.trim() || undefined
    });

    setAppointments(loadAppointments());
    if (result.ok) {
      setConfirmed(result.appointment);
      goTo(4);
    } else if (result.reason === 'slot_taken') {
      patchDraft({ time: null });
      setStep(2);
      setNotice('Esse horário acabou de ser reservado por outra pessoa. Escolha outro horário para continuar.');
    } else {
      setSubmitError('Este profissional não está disponível no momento. Volte e escolha outro.');
    }
  };

  const reset = () => {
    setProfessionalId(null);
    setDraft(emptyDraft);
    setForm(emptyForm);
    setConfirmed(null);
    setMaxReached(1);
    goTo(1);
  };

  const focusHeading = () => {
    if (!mounted.current) return;
    document.getElementById('booking-step-heading')?.focus({ preventScroll: true });
  };

  const motionProps = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.22 } };

  return (
    <div className="clinic-theme">
      <a href="#booking-main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Ir para o conteúdo</a>

      <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3.5">
            <Logo />
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <span className="hidden text-sm font-semibold text-muted-foreground sm:block">Agendamento online</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={supportLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="text-leaf-700" aria-hidden="true" /><span className="hidden sm:inline">Falar com a clínica</span><span className="sm:hidden">WhatsApp</span></a>
          </Button>
        </div>
      </header>

      <section aria-labelledby="booking-hero-title" className="relative isolate overflow-hidden bg-brand-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: 'radial-gradient(60rem 28rem at 88% -15%, rgba(47,165,111,.38), transparent 62%), radial-gradient(38rem 22rem at -5% 115%, rgba(232,115,79,.2), transparent 60%), radial-gradient(rgba(255,255,255,.07) 1px, transparent 1.2px)', backgroundSize: 'auto, auto, 22px 22px' }}
        />
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-14 sm:pb-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-leaf-300 uppercase ring-1 ring-white/20">
            <CalendarHeart className="size-3.5" aria-hidden="true" /> Agende sua consulta
          </span>
          <h1 id="booking-hero-title" className="mt-4 max-w-2xl font-display text-3xl leading-[1.12] font-semibold tracking-tight sm:text-5xl">
            Cuidar da saúde começa com um <em className="text-leaf-300 not-italic">horário na agenda</em>.
          </h1>
          <p className="mt-3 max-w-xl text-base text-brand-100 sm:mt-4 sm:text-lg">
            Escolha o profissional, veja o valor antes de agendar e reserve o melhor dia e horário em poucos cliques.
          </p>
          <ul className="mt-6 hidden flex-wrap gap-2.5 text-sm font-semibold sm:flex">
            {[
              { icon: WalletCards, label: 'Valores transparentes' },
              { icon: Clock, label: 'Horários em tempo real' },
              { icon: ShieldCheck, label: 'Dados protegidos (LGPD)' }
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/15"><Icon className="size-4 text-leaf-300" aria-hidden="true" />{label}</li>
            ))}
          </ul>
        </div>
      </section>

      <main id="booking-main" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div id="booking-stepper" className="relative z-10 -mt-10 scroll-mt-20 rounded-2xl border bg-card p-4 shadow-lg sm:px-6 sm:py-5">
          <Stepper current={step} maxReached={maxReached} onGo={goTo} />
        </div>

        <div className={cn('mt-8 grid gap-8', step < 4 && 'lg:grid-cols-[minmax(0,1fr)_21rem]')}>
          <div className="min-w-0">
            {notice && step === 2 && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-semibold text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{notice}
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} {...motionProps} onAnimationComplete={focusHeading}>
                {step === 1 && (
                  <ProfessionalStep professionals={professionals} appointments={appointments} selectedId={professionalId} onSelect={selectProfessional} />
                )}
                {step === 2 && professional && (
                  <ScheduleStep
                    professional={professional}
                    appointments={appointments}
                    date={draft.date}
                    time={draft.time}
                    modality={draft.modality}
                    visitType={draft.visitType}
                    onChange={patchDraft}
                    onBack={() => goTo(1)}
                    onNext={() => goTo(3)}
                  />
                )}
                {step === 3 && professional && (
                  <DetailsStep
                    form={form}
                    onChange={patch => setForm(current => ({ ...current, ...patch }))}
                    professional={professional}
                    modality={draft.modality}
                    visitType={draft.visitType}
                    submitError={submitError}
                    submitting={false}
                    onBack={() => goTo(2)}
                    onSubmit={submit}
                  />
                )}
                {step === 4 && confirmed && professional && (
                  <ConfirmationStep appointment={confirmed} professional={professional} onNew={reset} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < 4 && (
            <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Resumo">
              <SummaryCard
                professional={professional}
                specialtyLabel={specialtyLabel}
                date={draft.date}
                time={draft.time}
                modality={draft.modality}
                visitType={draft.visitType}
                paymentType={form.paymentType}
              />
            </aside>
          )}
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p><strong className="text-foreground">{clinic.name}</strong> · Agendamento online de consultas</p>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden="true" />{clinic.hoursLabel}</span>
            <span className="inline-flex items-center gap-1.5"><Phone className="size-4" aria-hidden="true" />{clinic.phoneLabel}</span>
            {clinic.address && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{clinic.address}</span>}
            <a href="#/painel" className="font-semibold text-brand-800 underline-offset-4 hover:underline">Área da clínica</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
