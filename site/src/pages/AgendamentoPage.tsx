import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2 } from 'lucide-react';
import StepIndicator from '../components/booking/StepIndicator';
import { services, BOOKING_STORAGE_KEY } from '../data';
import { formatPhoneBR } from '../phone';
import type { BookingRequest } from '../types';

const stepLabels = ['Serviço', 'Data', 'Contato', 'Confirmar'];

const periods: { id: 'manha' | 'tarde' | 'noite'; label: string }[] = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' }
];

type FormState = {
  serviceId: string;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '';
  name: string;
  phone: string;
  email: string;
  notes: string;
};

const emptyForm: FormState = { serviceId: '', date: '', period: '', name: '', phone: '', email: '', notes: '' };

function saveBooking(request: BookingRequest) {
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    const list: BookingRequest[] = raw ? JSON.parse(raw) : [];
    list.unshift(request);
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage indisponível neste navegador — segue sem persistir */
  }
}

export default function AgendamentoPage() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [step, done]);

  const selectedService = services.find(s => s.id === form.serviceId);
  const todayIso = new Date().toISOString().slice(0, 10);

  const canContinue =
    step === 1 ? Boolean(form.serviceId) :
    step === 2 ? Boolean(form.date && form.period) :
    step === 3 ? Boolean(form.name.trim() && form.phone.replace(/\D/g, '').length >= 10 && /\S+@\S+\.\S+/.test(form.email)) :
    true;

  const goNext = () => canContinue && setStep(s => Math.min(s + 1, 4));
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  const submit = () => {
    if (!selectedService || !form.period) return;
    const request: BookingRequest = {
      id: `req-${Date.now()}`,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: form.date,
      period: form.period,
      name: form.name.trim(),
      phone: form.phone,
      email: form.email.trim(),
      notes: form.notes.trim(),
      status: 'pendente',
      createdAt: new Date().toISOString()
    };
    saveBooking(request);
    setDone(true);
  };

  if (done) {
    return (
      <section className="booking-shell">
        <div className="container scroll-anchor" ref={topRef}>
          <div className="booking-card">
            <motion.div
              className="booking-success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="success-icon"><CheckCircle2 size={34} /></span>
              <h3>Pedido de agendamento enviado</h3>
              <p>
                Recebemos sua solicitação para <strong>{selectedService?.name}</strong>. Nossa equipe entra em
                contato pelo telefone {formatPhoneBR(form.phone)} para confirmar o horário.
              </p>
              <Link to="/" className="btn btn-primary">Voltar para o início</Link>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="booking-shell">
      <div className="container scroll-anchor" ref={topRef}>
        <div className="booking-head">
          <span className="eyebrow"><Calendar size={13} /> Agendamento</span>
          <h2>Vamos marcar sua avaliação</h2>
          <p>Leva menos de um minuto — nossa equipe confirma o horário com você em seguida.</p>
        </div>

        <StepIndicator labels={stepLabels} current={step} />

        <div className="booking-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: [0.2, 0.75, 0.25, 1] }}
            >
              {step === 1 && (
                <>
                  <h3>Qual especialidade você procura?</h3>
                  <p className="step-sub">Escolha o serviço de interesse para essa avaliação.</p>
                  <div className="service-option-grid">
                    {services.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        className={`service-option ${form.serviceId === s.id ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, serviceId: s.id }))}
                      >
                        <strong>{s.name}</strong>
                        <span>{s.shortDescription}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h3>Quando fica melhor para você?</h3>
                  <p className="step-sub">Escolha uma data e o período de preferência.</p>
                  <div className="field">
                    <label htmlFor="date">Data preferida</label>
                    <input
                      id="date"
                      type="date"
                      min={todayIso}
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label>Período</label>
                    <div className="period-grid">
                      {periods.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className={`period-option ${form.period === p.id ? 'selected' : ''}`}
                          onClick={() => setForm(f => ({ ...f, period: p.id }))}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h3>Seus dados de contato</h3>
                  <p className="step-sub">Usamos essas informações só para confirmar o seu horário.</p>
                  <div className="field">
                    <label htmlFor="name">Nome completo</label>
                    <input
                      id="name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="phone">Telefone / WhatsApp</label>
                      <input
                        id="phone"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: formatPhoneBR(e.target.value) }))}
                        placeholder="(15) 99999-0000"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="email">E-mail</label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="voce@email.com"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="notes">Observações (opcional)</label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Conte um pouco sobre o que você procura"
                    />
                  </div>
                </>
              )}

              {step === 4 && selectedService && (
                <>
                  <h3>Confirme seu agendamento</h3>
                  <p className="step-sub">Revise as informações antes de enviar.</p>
                  <div className="booking-summary">
                    <div className="booking-summary-row"><span>Serviço</span><strong>{selectedService.name}</strong></div>
                    <div className="booking-summary-row"><span>Data</span><strong>{new Date(`${form.date}T00:00:00`).toLocaleDateString('pt-BR')}</strong></div>
                    <div className="booking-summary-row"><span>Período</span><strong>{periods.find(p => p.id === form.period)?.label}</strong></div>
                    <div className="booking-summary-row"><span>Nome</span><strong>{form.name}</strong></div>
                    <div className="booking-summary-row"><span>Contato</span><strong>{form.phone} · {form.email}</strong></div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="booking-nav">
            {step > 1 ? (
              <button className="btn btn-ghost" onClick={goBack}><ArrowLeft size={15} /> Voltar</button>
            ) : <span />}

            {step < 4 ? (
              <button className="btn btn-primary" disabled={!canContinue} style={{ opacity: canContinue ? 1 : 0.5 }} onClick={goNext}>
                Continuar <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={submit}>
                Confirmar agendamento <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
