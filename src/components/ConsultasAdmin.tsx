import { useMemo, useState } from 'react';
import { BellRing, CalendarCheck2, Check, CheckCheck, Copy, ExternalLink, Link2, MessageCircle, RotateCcw, Save, UserX, Wallet, X } from 'lucide-react';
import { applyOverride, appointmentStatusLabel, loadProfessionals } from '../booking/storage';
import { baseProfessionals, clinic, specialties } from '../booking/config';
import { dateKey, formatBRL, formatFullDate, initialsOf } from '../booking/format';
import { patientWhatsappLink } from '../booking/share';
import type { Appointment, AppointmentStatus, ProfessionalOverride } from '../booking/types';
import './consultas.css';

type Props = {
  appointments: Appointment[];
  overrides: Record<string, ProfessionalOverride>;
  onStatus: (id: string, status: AppointmentStatus) => void;
  onSaveOverrides: (next: Record<string, ProfessionalOverride>) => void;
  onToast: (message: string) => void;
};

const statusClass: Record<AppointmentStatus, string> = {
  agendada: 'status-review',
  confirmada: 'status-new',
  concluida: 'status-approved',
  cancelada: 'status-rejected',
  faltou: 'status-rejected'
};

const specialtyLabel = (id: string) => specialties.find(item => item.id === id)?.label ?? id;
const bookingBase = () => `${window.location.origin}${window.location.pathname}#/agendar`;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

type Draft = { price: string; returnPrice: string; telePrice: string; active: boolean };

export default function ConsultasAdmin({ appointments, overrides, onStatus, onSaveOverrides, onToast }: Props) {
  const [tab, setTab] = useState<'agenda' | 'valores'>('agenda');
  const [query, setQuery] = useState('');
  const [professionalFilter, setProfessionalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all' | 'abertas'>('abertas');

  const professionals = useMemo(() => loadProfessionals(overrides), [overrides]);
  const today = dateKey(new Date());

  const kpis = useMemo(() => {
    const live = appointments.filter(item => item.status === 'agendada' || item.status === 'confirmada');
    const upcoming = live.filter(item => item.date >= today);
    return {
      today: appointments.filter(item => item.date === today && item.status !== 'cancelada').length,
      pending: appointments.filter(item => item.status === 'agendada').length,
      upcoming: upcoming.length,
      revenue: upcoming.filter(item => item.paymentType === 'particular').reduce((sum, item) => sum + item.price, 0)
    };
  }, [appointments, today]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR');
    const stamp = (item: Appointment) => `${item.date} ${item.time}`;
    const filtered = appointments.filter(item => {
      const haystack = `${item.patient.name} ${item.patient.phone} ${item.patient.email} ${item.protocol} ${item.professionalName}`.toLocaleLowerCase('pt-BR');
      const statusOk = statusFilter === 'all' ? true : statusFilter === 'abertas' ? item.status === 'agendada' || item.status === 'confirmada' : item.status === statusFilter;
      return (!q || haystack.includes(q)) && (professionalFilter === 'all' || item.professionalId === professionalFilter) && statusOk;
    });
    const upcoming = filtered.filter(item => item.date >= today).sort((a, b) => stamp(a).localeCompare(stamp(b)));
    const past = filtered.filter(item => item.date < today).sort((a, b) => stamp(b).localeCompare(stamp(a)));
    return [...upcoming, ...past];
  }, [appointments, query, professionalFilter, statusFilter, today]);

  const change = (item: Appointment, status: AppointmentStatus, message: string) => {
    if (status === 'cancelada' && !window.confirm(`Cancelar a consulta de ${item.patient.name}? O horário volta a ficar livre.`)) return;
    onStatus(item.id, status);
    onToast(message);
  };

  const dayTag = (date: string) => {
    if (date === today) return 'Hoje';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date === dateKey(tomorrow) ? 'Amanhã' : '';
  };

  // ---- Profissionais e valores ----
  const toDraft = (id: string): Draft => {
    const professional = professionals.find(item => item.id === id)!;
    return { price: String(professional.price), returnPrice: String(professional.returnPrice), telePrice: professional.telePrice === undefined ? '' : String(professional.telePrice), active: professional.active };
  };
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftOf = (id: string) => drafts[id] ?? toDraft(id);
  const patchDraft = (id: string, patch: Partial<Draft>) => setDrafts(current => ({ ...current, [id]: { ...draftOf(id), ...patch } }));
  const dirty = Object.keys(drafts).length > 0;

  const parseMoney = (value: string) => (/^\d{1,6}$/.test(value.trim()) ? Number(value) : null);
  const draftErrors = (draft: Draft) => ({
    price: parseMoney(draft.price) === null || Number(draft.price) === 0,
    returnPrice: parseMoney(draft.returnPrice) === null,
    telePrice: draft.telePrice.trim() !== '' && parseMoney(draft.telePrice) === null
  });
  const hasErrors = Object.values(drafts).some(draft => Object.values(draftErrors(draft)).some(Boolean));

  const saveDrafts = () => {
    if (hasErrors) { onToast('Corrija os valores destacados antes de salvar.'); return; }
    const next = { ...overrides };
    for (const [id, draft] of Object.entries(drafts)) {
      next[id] = {
        price: Number(draft.price),
        returnPrice: Number(draft.returnPrice),
        telePrice: draft.telePrice.trim() === '' ? null : Number(draft.telePrice),
        active: draft.active
      };
    }
    onSaveOverrides(next);
    setDrafts({});
    onToast('Valores e disponibilidade atualizados.');
  };

  const restoreExamples = () => {
    if (!window.confirm('Restaurar todos os valores e profissionais para os exemplos originais?')) return;
    onSaveOverrides({});
    setDrafts({});
    onToast('Valores de exemplo restaurados.');
  };

  const link = bookingBase();
  const [copied, setCopied] = useState('');
  const copy = async (text: string, key: string) => {
    await copyText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(current => current === key ? '' : current), 1800);
  };

  return (
    <div className="consultas-module">
      <section className="consultas-link-panel">
        <span className="consultas-link-icon"><Link2 size={19}/></span>
        <div className="consultas-link-copy">
          <strong>Página pública de agendamento</strong>
          <small>Envie ao paciente ou publique no site. Ele escolhe o profissional, vê o valor e reserva o horário.</small>
          <code>{link}</code>
        </div>
        <div className="consultas-link-actions">
          <button type="button" className="link-action-button" onClick={() => copy(link, 'main')}>{copied === 'main' ? <Check size={15}/> : <Copy size={15}/>}<span>{copied === 'main' ? 'Copiado' : 'Copiar'}</span></button>
          <a className="link-action-button primary" href={link} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/><span>Abrir</span></a>
        </div>
      </section>

      <div className="stats-grid">
        <article className="stat-card metric-total"><span className="stat-icon"><CalendarCheck2 size={25}/></span><div className="stat-copy"><small>HOJE</small><strong>{kpis.today}</strong><span>Consultas no dia</span></div></article>
        <article className="stat-card metric-review"><span className="stat-icon"><BellRing size={25}/></span><div className="stat-copy"><small>AGUARDANDO</small><strong>{kpis.pending}</strong><span>Pendentes de confirmação</span></div></article>
        <article className="stat-card metric-approved"><span className="stat-icon"><CheckCheck size={25}/></span><div className="stat-copy"><small>PRÓXIMAS</small><strong>{kpis.upcoming}</strong><span>Agendadas e confirmadas</span></div></article>
        <article className="stat-card metric-total"><span className="stat-icon"><Wallet size={25}/></span><div className="stat-copy"><small>RECEITA PREVISTA</small><strong>{formatBRL(kpis.revenue)}</strong><span>Particulares futuros</span></div></article>
      </div>

      <div className="consultas-tabs" role="tablist" aria-label="Seções de consultas">
        <button type="button" role="tab" aria-selected={tab === 'agenda'} className={tab === 'agenda' ? 'active' : ''} onClick={() => setTab('agenda')}>Agendamentos <em>{appointments.length}</em></button>
        <button type="button" role="tab" aria-selected={tab === 'valores'} className={tab === 'valores' ? 'active' : ''} onClick={() => setTab('valores')}>Profissionais e valores</button>
      </div>

      {tab === 'agenda' && (
        <section className="table-panel">
          <div className="table-toolbar table-toolbar-split">
            <label className="search-control"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por paciente, telefone, e-mail, protocolo ou profissional..." aria-label="Buscar consultas"/></label>
            <div className="table-toolbar-filters">
              <label className="profile-filter"><select value={professionalFilter} onChange={event => setProfessionalFilter(event.target.value)} aria-label="Filtrar por profissional"><option value="all">Todos os profissionais</option>{professionals.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="status-filter"><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrar por status"><option value="abertas">Em aberto</option><option value="all">Todos os status</option>{(Object.keys(appointmentStatusLabel) as AppointmentStatus[]).map(key => <option key={key} value={key}>{appointmentStatusLabel[key]}</option>)}</select></label>
            </div>
          </div>

          <div className="consultas-list" role="table" aria-label="Consultas agendadas">
            <div className="consultas-head consultas-grid" role="row"><span>DATA</span><span>PACIENTE</span><span>PROFISSIONAL</span><span>VALOR</span><span>STATUS</span><span>AÇÕES</span></div>
            {rows.map(item => (
              <article className="consultas-row consultas-grid" key={item.id} role="row">
                <div className="consultas-cell" role="cell">
                  <strong>{formatFullDate(item.date)}</strong>
                  <small>{item.time} · {item.durationMin} min {dayTag(item.date) && <b className="consultas-day-tag">{dayTag(item.date)}</b>}</small>
                </div>
                <div className="consultas-cell" role="cell">
                  <strong>{item.patient.name}</strong>
                  <small>{item.patient.phone} · {item.patient.email}</small>
                  {item.reason && <small className="consultas-reason" title={item.reason}>“{item.reason}”</small>}
                </div>
                <div className="consultas-cell" role="cell">
                  <strong>{item.professionalName}</strong>
                  <small>{item.specialty} · {item.modality === 'telemedicina' ? 'Telemedicina' : 'Presencial'} · {item.visitType === 'retorno' ? 'Retorno' : '1ª consulta'}</small>
                </div>
                <div className="consultas-cell" role="cell">
                  <strong>{item.paymentType === 'convenio' ? 'Convênio' : formatBRL(item.price)}</strong>
                  <small>{item.paymentType === 'convenio' ? `${item.insuranceName} · ${item.insuranceCard}` : item.protocol}</small>
                </div>
                <div role="cell"><span className={`status-pill ${statusClass[item.status]}`}>{appointmentStatusLabel[item.status]}</span></div>
                <div className="consultas-actions" role="cell">
                  {item.status === 'agendada' && <button type="button" className="link-action-button primary" onClick={() => change(item, 'confirmada', 'Consulta confirmada.')}><Check size={14}/><span>Confirmar</span></button>}
                  {item.status === 'confirmada' && <button type="button" className="link-action-button primary" onClick={() => change(item, 'concluida', 'Consulta concluída.')}><CheckCheck size={14}/><span>Concluir</span></button>}
                  {item.status === 'confirmada' && <button type="button" className="link-action-button" onClick={() => change(item, 'faltou', 'Falta registrada.')}><UserX size={14}/><span>Faltou</span></button>}
                  {(item.status === 'agendada' || item.status === 'confirmada') && <button type="button" className="link-action-button" onClick={() => change(item, 'cancelada', 'Consulta cancelada e horário liberado.')}><X size={14}/><span>Cancelar</span></button>}
                  {(item.status === 'cancelada' || item.status === 'faltou') && <button type="button" className="link-action-button" onClick={() => change(item, 'agendada', 'Consulta reaberta.')}><RotateCcw size={14}/><span>Reabrir</span></button>}
                  <a className="link-action-button" href={patientWhatsappLink(item)} target="_blank" rel="noopener noreferrer" aria-label={`Falar com ${item.patient.name} no WhatsApp`} title="WhatsApp do paciente"><MessageCircle size={14}/></a>
                </div>
              </article>
            ))}
            {!rows.length && (
              <div className="empty-row consultas-empty">
                {appointments.length ? 'Nenhuma consulta encontrada com esses filtros.' : 'Nenhuma consulta agendada ainda. Quando um paciente reservar pela página pública, ela aparece aqui.'}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'valores' && (
        <section className="table-panel">
          <div className="panel-inline-title"><strong>Profissionais, valores e disponibilidade</strong><span>Valores em reais • {clinic.name}</span></div>
          <div className="consultas-list" role="table" aria-label="Valores por profissional">
            <div className="consultas-head consultas-values-grid" role="row"><span>PROFISSIONAL</span><span>CONSULTA (R$)</span><span>RETORNO (R$)</span><span>TELEMEDICINA (R$)</span><span>ATIVO</span><span>LINK</span></div>
            {baseProfessionals.map(base => {
              const draft = draftOf(base.id);
              const errors = draftErrors(draft);
              const professional = applyOverride(base, overrides[base.id]);
              return (
                <article className="consultas-row consultas-values-grid" key={base.id} role="row">
                  <div className="doctor-cell">
                    <span className={`doctor-avatar avatar-${professional.tone % 4}`}>{initialsOf(professional.name)}</span>
                    <span className="doctor-copy"><strong>{professional.name}</strong><small>{specialtyLabel(professional.specialtyId)} · {professional.slotMinutes} min</small></span>
                  </div>
                  <label className="consultas-field"><span className="consultas-field-label">Consulta (R$)</span><input className={`consultas-money ${errors.price ? 'invalid' : ''}`} inputMode="numeric" value={draft.price} onChange={event => patchDraft(base.id, { price: event.target.value })} aria-label={`Consulta (R$) de ${professional.name}`} aria-invalid={errors.price}/></label>
                  <label className="consultas-field"><span className="consultas-field-label">Retorno (R$)</span><input className={`consultas-money ${errors.returnPrice ? 'invalid' : ''}`} inputMode="numeric" value={draft.returnPrice} onChange={event => patchDraft(base.id, { returnPrice: event.target.value })} aria-label={`Retorno (R$) de ${professional.name}`} aria-invalid={errors.returnPrice}/></label>
                  <label className="consultas-field"><span className="consultas-field-label">Telemedicina (R$)</span><input className={`consultas-money ${errors.telePrice ? 'invalid' : ''}`} inputMode="numeric" placeholder="Não atende" value={draft.telePrice} onChange={event => patchDraft(base.id, { telePrice: event.target.value })} aria-label={`Telemedicina (R$) de ${professional.name}`} aria-invalid={errors.telePrice}/></label>
                  <label className="consultas-switch"><input type="checkbox" checked={draft.active} onChange={event => patchDraft(base.id, { active: event.target.checked })} aria-label={`Exibir ${professional.name} no agendamento`}/><span>{draft.active ? 'Visível' : 'Oculto'}</span></label>
                  <button type="button" className="link-action-button" onClick={() => copy(`${link}/${base.id}`, base.id)} title="Copiar link direto para este profissional">{copied === base.id ? <Check size={14}/> : <Copy size={14}/>}<span>{copied === base.id ? 'Copiado' : 'Copiar'}</span></button>
                </article>
              );
            })}
          </div>
          <div className="consultas-footer">
            <small>Os valores são salvos neste navegador e refletem na página pública. A agenda semanal de cada profissional é definida em <code>src/booking/config.ts</code>.</small>
            <div className="consultas-footer-actions">
              <button type="button" className="link-action-button" onClick={restoreExamples}><RotateCcw size={14}/><span>Restaurar exemplos</span></button>
              <button type="button" className="link-action-button" disabled={!dirty} onClick={() => setDrafts({})}><span>Descartar</span></button>
              <button type="button" className="link-action-button primary" disabled={!dirty} onClick={saveDrafts}><Save size={14}/><span>Salvar alterações</span></button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
