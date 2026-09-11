import { AGENDA_KEY, PROFILE_KEY, seedCandidates, seedInterviewEvents, statusMap, STORAGE_KEY } from './data';
import type { Candidate, CandidateDocument, CandidateStatus, CandidateType, InterviewEvent, InterviewLogEntry, InterviewStatus, UserProfile } from './types';
import { formatPhoneBR } from './phone';

const LEGACY_STORAGE_KEYS = ['medRecruitCandidates_v2'];
const FILE_DB_NAME = 'jpMedicalRecruitFiles_v2';
const FILE_DB_VERSION = 1;
const FILE_STORE = 'documents';

export const initialsFromName = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');

export const normalizeCandidate = (candidate: Partial<Candidate>, index = 0): Candidate => {
  const status = (candidate.status && statusMap[candidate.status]) ? candidate.status : 'novo';
  const createdAt = candidate.createdAt || new Date(Date.now() - index * 86400000).toISOString();
  return {
    id: candidate.id ?? Date.now(),
    profileType: candidate.profileType === 'colaborador' ? 'colaborador' : 'medico',
    name: candidate.name ?? 'Candidato',
    initials: candidate.initials || initialsFromName(candidate.name ?? 'Candidato'),
    specialty: candidate.specialty || 'Especialidade não informada',
    city: candidate.city || 'Cidade não informada',
    crm: candidate.crm || 'CRM não informado',
    rqe: candidate.rqe || 'Não informado',
    status,
    statusLabel: statusMap[status].label,
    email: candidate.email || 'E-mail não informado',
    phone: formatPhoneBR(candidate.phone || '') || candidate.phone || 'Não informado',
    experience: candidate.experience || 'Não informado',
    availability: candidate.availability || 'Não informado',
    createdAt,
    statusUpdatedAt: candidate.statusUpdatedAt,
    notes: candidate.notes || 'Sem observações.',
    curriculum: Array.isArray(candidate.curriculum) ? candidate.curriculum : [],
    documents: Array.isArray(candidate.documents) ? candidate.documents : []
  };
};

export function loadCandidates(): Candidate[] {
  let raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (const key of LEGACY_STORAGE_KEYS) {
      raw = localStorage.getItem(key);
      if (raw) break;
    }
  }
  if (!raw) {
    const initial = seedCandidates.map(normalizeCandidate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = (JSON.parse(raw) as Partial<Candidate>[]).map(normalizeCandidate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCandidates));
    return seedCandidates;
  }
}

export function saveCandidates(candidates: Candidate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

export function updateCandidateStatus(candidates: Candidate[], id: number, status: CandidateStatus) {
  const next = candidates.map(candidate => candidate.id === id
    ? { ...candidate, status, statusLabel: statusMap[status].label, statusUpdatedAt: new Date().toISOString() }
    : candidate);
  saveCandidates(next);
  return next;
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function loadProfile(): UserProfile {
  const defaults: UserProfile = {
    name: 'Administrador',
    role: 'Equipe de recrutamento',
    email: 'admin@jpmedicos.com.br',
    phone: ''
  };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function openFileDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB indisponível'));
    const request = indexedDB.open(FILE_DB_NAME, FILE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir armazenamento'));
  });
}

export async function saveCandidateDocument(candidateId: number, type: string, label: string, file: File, index = 0): Promise<CandidateDocument> {
  const db = await openFileDatabase();
  const key = `${candidateId}:${type}:${index}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readwrite');
    tx.objectStore(FILE_STORE).put({ key, candidateId, type, label, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, blob: file });
    tx.oncomplete = () => {
      db.close();
      resolve({ key, type, label, name: file.name, mime: file.type || '', size: file.size });
    };
    tx.onerror = () => {
      const error = tx.error;
      db.close();
      reject(error || new Error('Falha ao salvar documento'));
    };
  });
}

export async function openStoredDocument(meta: CandidateDocument) {
  if (!meta || meta.legacy || meta.key.startsWith('legacy:')) throw new Error('Arquivo antigo indisponível');
  const db = await openFileDatabase();
  const record = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, 'readonly');
    const req = tx.objectStore(FILE_STORE).get(meta.key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('Falha ao carregar documento'));
  });
  db.close();
  if (!record?.blob) throw new Error('Arquivo não encontrado');
  const url = URL.createObjectURL(record.blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}


export function loadInterviewEvents(): InterviewEvent[] {
  const raw = localStorage.getItem(AGENDA_KEY);
  if (!raw) {
    localStorage.setItem(AGENDA_KEY, JSON.stringify(seedInterviewEvents));
    return seedInterviewEvents;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<InterviewEvent>[];
    const normalized = parsed.map((event, index): InterviewEvent => ({
      id: event.id || `agenda-${Date.now()}-${index}`,
      audience: (event.audience === 'colaborador' || event.audience === ('funcionario' as any)) ? 'colaborador' : 'medico',
      candidateId: event.candidateId,
      personName: event.personName || 'Entrevista',
      role: event.role || 'Não informado',
      email: event.email || '',
      phone: formatPhoneBR(event.phone || ''),
      date: event.date || new Date().toISOString().slice(0, 10),
      time: event.time || '09:00',
      duration: Number(event.duration) || 30,
      interviewer: event.interviewer || 'Equipe de recrutamento',
      location: event.location || 'A definir',
      notes: event.notes || '',
      status: (['agendada', 'confirmada', 'reagendada', 'em_andamento', 'concluida', 'cancelada'] as InterviewStatus[]).includes(event.status as InterviewStatus) ? event.status as InterviewStatus : 'agendada',
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: event.updatedAt,
      startedAt: event.startedAt,
      completedAt: event.completedAt,
      actualDurationSec: Number(event.actualDurationSec) || undefined,
      logs: Array.isArray(event.logs) && event.logs.length
        ? event.logs as InterviewLogEntry[]
        : [{
            id: `log-${event.id || index}-legacy`,
            at: event.createdAt || new Date().toISOString(),
            action: 'criada',
            label: 'Agendamento registrado',
            details: 'Registro migrado para o histórico da entrevista.'
          }]
    }));
    localStorage.setItem(AGENDA_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    localStorage.setItem(AGENDA_KEY, JSON.stringify(seedInterviewEvents));
    return seedInterviewEvents;
  }
}

export function saveInterviewEvents(events: InterviewEvent[]) {
  localStorage.setItem(AGENDA_KEY, JSON.stringify(events));
}
