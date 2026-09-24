import type {
  Candidate,
  CandidateStatus,
  InterviewAudience,
  InterviewEvent,
  InterviewLogEntry,
  InterviewStatus
} from '../../shared/types';

export const statusLabels: Record<CandidateStatus, string> = {
  novo: 'Novo',
  analise: 'Em análise',
  entrevista: 'Entrevista',
  aguardando: 'Decisão de contratação',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado'
};

export const CANDIDATE_STATUSES: CandidateStatus[] = ['novo', 'analise', 'entrevista', 'aguardando', 'aprovado', 'reprovado'];
export const INTERVIEW_STATUSES: InterviewStatus[] = ['agendada', 'confirmada', 'reagendada', 'em_andamento', 'concluida', 'cancelada'];

export function initialsFromName(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
}

function safeParseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export type CandidateRow = {
  id: number;
  profile_type: string;
  name: string;
  initials: string;
  specialty: string;
  city: string;
  crm: string;
  rqe: string;
  status: string;
  email: string;
  phone: string;
  experience: string;
  availability: string;
  notes: string;
  curriculum: string;
  created_at: string;
  status_updated_at: string | null;
};

export type DocumentRow = {
  id: string;
  candidate_id: number;
  type: string;
  label: string;
  name: string;
  mime: string;
  size: number;
  r2_key: string;
  created_at: string;
};

export function mapCandidate(row: CandidateRow, documents: DocumentRow[]): Candidate {
  const status = (CANDIDATE_STATUSES as string[]).includes(row.status) ? (row.status as CandidateStatus) : 'novo';
  return {
    id: row.id,
    profileType: row.profile_type === 'colaborador' ? 'colaborador' : 'medico',
    name: row.name,
    initials: row.initials,
    specialty: row.specialty,
    city: row.city,
    crm: row.crm,
    rqe: row.rqe,
    status,
    statusLabel: statusLabels[status],
    email: row.email,
    phone: row.phone,
    experience: row.experience,
    availability: row.availability,
    createdAt: row.created_at,
    statusUpdatedAt: row.status_updated_at ?? undefined,
    notes: row.notes,
    curriculum: safeParseStringArray(row.curriculum),
    documents: documents
      .filter(doc => doc.candidate_id === row.id)
      .map(doc => ({ id: doc.id, type: doc.type, label: doc.label, name: doc.name, mime: doc.mime, size: doc.size }))
  };
}

export type InterviewRow = {
  id: string;
  audience: string;
  candidate_id: number | null;
  person_name: string;
  role: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  duration: number;
  interviewer: string;
  location: string;
  notes: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  actual_duration_sec: number | null;
};

export type InterviewLogRow = {
  id: string;
  interview_id: string;
  at: string;
  action: string;
  label: string;
  details: string | null;
};

export function mapInterview(row: InterviewRow, logs: InterviewLogRow[]): InterviewEvent {
  const status = (INTERVIEW_STATUSES as string[]).includes(row.status) ? (row.status as InterviewStatus) : 'agendada';
  return {
    id: row.id,
    audience: (row.audience === 'colaborador' ? 'colaborador' : 'medico') as InterviewAudience,
    candidateId: row.candidate_id ?? undefined,
    personName: row.person_name,
    role: row.role,
    email: row.email || undefined,
    phone: row.phone || undefined,
    date: row.date,
    time: row.time,
    duration: row.duration,
    interviewer: row.interviewer,
    location: row.location,
    notes: row.notes,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    actualDurationSec: row.actual_duration_sec ?? undefined,
    logs: logs
      .filter(log => log.interview_id === row.id)
      .map((log): InterviewLogEntry => ({
        id: log.id,
        at: log.at,
        action: log.action as InterviewLogEntry['action'],
        label: log.label,
        details: log.details ?? undefined
      }))
  };
}
