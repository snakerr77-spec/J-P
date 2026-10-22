import { useEffect, useMemo, useState } from 'react';
import Sidebar, { type ModuleKey, type ThemeMode } from './Sidebar';
import Topbar from './Topbar';
import Hero from './Hero';
import StatCards from './StatCards';
import CandidateTable from './CandidateTable';
import CandidateModal from './CandidateModal';
import NewCandidateModal from './NewCandidateModal';
import ProcessBoard from './ProcessBoard';
import Reports from './Reports';
import Agenda from './Agenda';
import Interviews from './Interviews';
import Settings from './Settings';
import HiringDecision from './HiringDecision';
import ApplicationLinks from './ApplicationLinks';
import { AUTH_KEY, SIDEBAR_KEY, THEME_KEY, STORAGE_KEY, AGENDA_KEY, statusMap } from '../data';
import { loadCandidates, loadInterviewEvents, loadProfile, saveCandidates, saveInterviewEvents, saveProfile, updateCandidateStatus } from '../storage';
import type { Candidate, CandidateStatus, CandidateType, InterviewEvent, InterviewLogEntry, InterviewStatus, UserProfile } from '../types';
import { buildNotifications, type AppNotification } from '../notifications';

const moduleCopy: Record<ModuleKey, { eyebrow: string; title: string; subtitle: string }> = {
  candidates: { eyebrow: 'Recrutamento', title: 'Candidatos', subtitle: 'Acompanhe médicos e colaboradores em fluxos separados, sem misturar especialidades clínicas com vagas administrativas e operacionais.' },
  applications: { eyebrow: 'Candidatura pública', title: 'Links de candidatura', subtitle: 'Compartilhe formulários separados para médicos e colaboradores sem expor dados internos do painel.' },
  reviews: { eyebrow: 'Análise curricular', title: 'Currículos em avaliação', subtitle: 'Revise médicos e colaboradores em análise, usando o filtro de perfil para manter cada processo organizado.' },
  waiting: { eyebrow: 'Decisão final', title: 'Decisão de contratação', subtitle: 'Perfis que chegaram à etapa final e aguardam a definição entre contratação ou encerramento do processo.' },
  approved: { eyebrow: 'Perfis validados', title: 'Perfis aprovados', subtitle: 'Consulte médicos e colaboradores aprovados para contratação e revise rapidamente as principais informações profissionais.' },
  processes: { eyebrow: 'Fluxo seletivo', title: 'Processos', subtitle: 'Arraste médicos e colaboradores entre as etapas do processo seletivo e acompanhe cada fluxo separadamente.' },
  interviews: { eyebrow: 'Gestão de entrevistas', title: 'Entrevistas', subtitle: 'Controle entrevistas de médicos e colaboradores, com confirmação, reagendamento, cronômetro, logs e histórico.' },
  agenda: { eyebrow: 'Agenda de recrutamento', title: 'Agenda de entrevistas', subtitle: 'Reserve horários para médicos e colaboradores. Entrevistas concluídas deixam o calendário e permanecem no histórico da Central de Entrevistas.' },
  reports: { eyebrow: 'Indicadores de recrutamento', title: 'Relatórios', subtitle: 'Analise médicos e colaboradores separadamente, com distribuição por etapa, áreas e resultado do processo.' },
  settings: { eyebrow: 'Preferências do portal', title: 'Configurações', subtitle: 'Atualize as informações do usuário e mantenha os dados de acesso da equipe organizados.' }
};

type Props = { onLogout: () => void; onPublicApplication: (type: CandidateType) => void };

const NOTIFICATION_READ_KEY = 'jpRecruitNotificationRead_v1';

export default function Dashboard({ onLogout, onPublicApplication }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(() => loadCandidates());
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [interviewEvents, setInterviewEvents] = useState<InterviewEvent[]>(() => loadInterviewEvents());
  const [active, setActive] = useState<ModuleKey>('candidates');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === '1');
  const [theme, setTheme] = useState<ThemeMode>(() => localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [agendaCandidateId, setAgendaCandidateId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(NOTIFICATION_READ_KEY) || '[]') as string[]; } catch { return []; }
  });
  const [clockTick, setClockTick] = useState(() => Date.now());

  const contentCopy = moduleCopy[active];

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncExternalChanges = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const next = loadCandidates();
        setCandidates(next);
        const newest = [...next].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        if (newest?.status === 'novo') setToast(`Novo currículo recebido: ${newest.name}`);
      }
      if (event.key === AGENDA_KEY) setInterviewEvents(loadInterviewEvents());
    };
    window.addEventListener('storage', syncExternalChanges);
    return () => window.removeEventListener('storage', syncExternalChanges);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeCandidate = useMemo(() => selected ? candidates.find(candidate => candidate.id === selected.id) || selected : null, [candidates, selected]);
  const notifications = useMemo(() => buildNotifications(candidates, interviewEvents, new Date(clockTick)), [candidates, interviewEvents, clockTick]);

  const openNotification = (notification: AppNotification) => {
    setReadNotificationIds(current => current.includes(notification.id) ? current : [...current, notification.id]);
    setActive(notification.module);
  };

  const markAllNotificationsRead = () => setReadNotificationIds(notifications.map(item => item.id));

  const replaceCandidates = (next: Candidate[]) => {
    saveCandidates(next);
    setCandidates(next);
    setSelected(current => current ? next.find(candidate => candidate.id === current.id) || current : null);
  };

  const syncCandidateFromInterview = (event: InterviewEvent, sourceCandidates = candidates) => {
    if (!event.candidateId) return sourceCandidates;
    const candidate = sourceCandidates.find(item => item.id === event.candidateId);
    if (!candidate || ['aprovado', 'reprovado'].includes(candidate.status)) return sourceCandidates;

    let nextStatus: CandidateStatus | null = null;
    if (event.status === 'confirmada' || event.status === 'concluida') nextStatus = 'aguardando';
    else if (event.status === 'em_andamento') nextStatus = candidate.status === 'aguardando' ? 'aguardando' : 'entrevista';
    else if (['agendada', 'reagendada'].includes(event.status)) nextStatus = 'entrevista';
    else if (event.status === 'cancelada' && ['entrevista', 'aguardando'].includes(candidate.status)) nextStatus = 'analise';

    if (!nextStatus || candidate.status === nextStatus) return sourceCandidates;
    return sourceCandidates.map(item => item.id === candidate.id
      ? { ...item, status: nextStatus!, statusLabel: statusMap[nextStatus!].label, statusUpdatedAt: new Date().toISOString() }
      : item);
  };

  useEffect(() => {
    let next = candidates;
    interviewEvents.forEach(event => {
      if (event.status === 'confirmada' || event.status === 'concluida') next = syncCandidateFromInterview(event, next);
    });
    if (next !== candidates) replaceCandidates(next);
    // Sincroniza confirmações antigas salvas no navegador com a nova etapa de decisão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewEvents]);

  const persistInterview = (event: InterviewEvent, isNew = false) => {
    const exists = interviewEvents.some(item => item.id === event.id);
    const nextEvents = exists
      ? interviewEvents.map(item => item.id === event.id ? event : item)
      : [...interviewEvents, event];
    saveInterviewEvents(nextEvents);
    setInterviewEvents(nextEvents);

    const nextCandidates = syncCandidateFromInterview(event, candidates);
    if (nextCandidates !== candidates) replaceCandidates(nextCandidates);
    if (isNew) setToast('Entrevista agendada com sucesso.');
  };

  const handleStatus = (id: number, status: CandidateStatus) => {
    const next = updateCandidateStatus(candidates, id, status);
    setCandidates(next);
    const updated = next.find(candidate => candidate.id === id) || null;
    setSelected(updated);
    setToast('Status do perfil atualizado.');
  };

  const handleBoardMove = (candidate: Candidate, status: CandidateStatus) => {
    if (candidate.status === status) return;
    const next = updateCandidateStatus(candidates, candidate.id, status);
    setCandidates(next);
    setToast(`${candidate.name} movido para ${statusMap[status].label}.`);
  };

  const handleCreate = (candidate: Candidate) => {
    const next = [candidate, ...candidates];
    saveCandidates(next);
    setCandidates(next);
    setNewOpen(false);
    setActive('candidates');
    setToast(`${candidate.profileType === 'medico' ? 'Médico' : 'Colaborador'} cadastrado com sucesso.`);
  };

  const handleSaveInterview = (event: InterviewEvent) => {
    const existing = interviewEvents.find(item => item.id === event.id);
    let nextEvent = event;
    if (!existing && (!event.logs || !event.logs.length)) {
      const createdLog: InterviewLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: event.createdAt || new Date().toISOString(),
        action: 'criada',
        label: 'Entrevista agendada',
        details: `${event.personName} • ${event.date} às ${event.time}`
      };
      nextEvent = { ...event, logs: [createdLog] };
    }
    persistInterview(nextEvent, !existing);
  };

  const handleDeleteInterview = (id: string) => {
    const next = interviewEvents.filter(event => event.id !== id);
    saveInterviewEvents(next);
    setInterviewEvents(next);
    setToast('Agendamento removido da agenda.');
  };

  const handleInterviewStatus = (id: string, status: InterviewStatus) => {
    const current = interviewEvents.find(event => event.id === id);
    if (!current) return;
    const now = new Date().toISOString();
    const labels: Partial<Record<InterviewStatus, { action: InterviewLogEntry['action']; label: string }>> = {
      confirmada: { action: 'confirmada', label: 'Entrevista confirmada' },
      reagendada: { action: 'reagendada', label: 'Entrevista reagendada' },
      em_andamento: { action: 'iniciada', label: 'Entrevista iniciada' },
      concluida: { action: 'concluida', label: 'Entrevista concluída' },
      cancelada: { action: 'cancelada', label: 'Entrevista cancelada' }
    };
    const meta = labels[status];
    const nextEvent: InterviewEvent = {
      ...current,
      status,
      updatedAt: now,
      logs: meta ? [...(current.logs || []), { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: now, action: meta.action, label: meta.label } as InterviewLogEntry] : current.logs
    };
    persistInterview(nextEvent);
    setToast(status === 'confirmada' ? 'Entrevista confirmada e perfil enviado para Decisão de contratação.' : status === 'concluida' ? 'Entrevista concluída e removida do calendário.' : 'Status do agendamento atualizado.');
  };

  const handleSaveProfile = (next: UserProfile) => {
    saveProfile(next);
    setProfile(next);
    setToast('Perfil atualizado com sucesso.');
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    onLogout();
  };

  const renderModule = () => {
    switch (active) {
      case 'applications': return <ApplicationLinks onOpen={onPublicApplication}/>;
      case 'reviews': return <><StatCards candidates={candidates}/><CandidateTable candidates={candidates} forcedStatus="analise" onOpen={setSelected}/></>;
      case 'waiting': return <><StatCards candidates={candidates}/><HiringDecision candidates={candidates} onOpen={setSelected} onDecision={handleStatus}/></>;
      case 'approved': return <><StatCards candidates={candidates}/><CandidateTable candidates={candidates} forcedStatus="aprovado" title="Perfis aprovados para contratação" onOpen={setSelected}/></>;
      case 'interviews': return <Interviews candidates={candidates} events={interviewEvents} onOpenAgenda={(candidateId) => { setAgendaCandidateId(candidateId ?? null); setActive('agenda'); }} onOpenCandidate={setSelected} onSave={handleSaveInterview} onToast={setToast}/>;
      case 'processes': return <><StatCards candidates={candidates}/><ProcessBoard candidates={candidates} onOpen={setSelected} onMove={handleBoardMove}/></>;
      case 'agenda': return <Agenda candidates={candidates} events={interviewEvents} initialCandidateId={agendaCandidateId} onInitialCandidateConsumed={() => setAgendaCandidateId(null)} onSave={handleSaveInterview} onDelete={handleDeleteInterview} onOpenCandidate={setSelected}/>;
      case 'reports': return <Reports candidates={candidates}/>;
      case 'settings': return <Settings profile={profile} theme={theme} onThemeChange={setTheme} onSave={handleSaveProfile} onLogout={logout} onPublicApplication={onPublicApplication}/>;
      default: return <><StatCards candidates={candidates}/><CandidateTable candidates={candidates} onOpen={setSelected}/></>;
    }
  };

  return (
    <div className={`dashboard-shell theme-${theme} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} active={active} profile={profile} theme={theme} onSelect={setActive} onThemeToggle={() => setTheme(value => value === 'dark' ? 'light' : 'dark')} onLogout={logout}/>
      <div className="dashboard-main">
        <Topbar onMenu={() => setCollapsed(value => !value)} onProfile={() => setActive('settings')} notifications={notifications} readNotificationIds={readNotificationIds} onNotificationOpen={openNotification} onMarkAllRead={markAllNotificationsRead}/>
        <main className="dashboard-content">
          <Hero
            eyebrow={contentCopy.eyebrow}
            title={contentCopy.title}
            subtitle={contentCopy.subtitle}
            candidates={candidates}
            onNewCandidate={active === 'candidates' ? () => setNewOpen(true) : undefined}
            compact={active !== 'candidates'}
          />
          <div className="module-content">{renderModule()}</div>
        </main>
      </div>

      <CandidateModal candidate={activeCandidate} interviewEvents={interviewEvents} onClose={() => setSelected(null)} onToast={setToast}/>
      <NewCandidateModal open={newOpen} onClose={() => setNewOpen(false)} onCreate={handleCreate}/>
      {toast && <div className="toast-message">{toast}</div>}
    </div>
  );
}
