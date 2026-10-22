import { slotsFor } from './availability';
import { defaultProfessionals, normalizeProfessional } from './professionals';
import type { Appointment, AppointmentStatus, Professional } from './types';

export const APPOINTMENTS_KEY = 'gouteAppointments_v1';
export const PROFESSIONALS_KEY = 'gouteProfessionals_v1';

const STATUSES: AppointmentStatus[] = ['agendada', 'confirmada', 'concluida', 'cancelada', 'faltou'];

function isAppointment(value: unknown): value is Appointment {
  const a = value as Appointment | null;
  return Boolean(
    a && typeof a === 'object' &&
    typeof a.id === 'string' && typeof a.protocol === 'string' &&
    typeof a.professionalId === 'string' && typeof a.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.date) &&
    typeof a.time === 'string' && /^\d{2}:\d{2}$/.test(a.time) &&
    STATUSES.includes(a.status) && a.patient && typeof a.patient.name === 'string'
  );
}

export function loadAppointments(): Appointment[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isAppointment) : [];
  } catch {
    return [];
  }
}

export function saveAppointments(appointments: Appointment[]) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

/** Profissionais salvos no navegador; sem dados (ou dados inválidos) usa o conjunto inicial de exemplo. */
export function loadProfessionals(): Professional[] {
  try {
    const raw = localStorage.getItem(PROFESSIONALS_KEY);
    if (raw === null) return defaultProfessionals();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultProfessionals();
    const list = parsed.map(normalizeProfessional).filter((item): item is Professional => item !== null);
    // ids repetidos quebrariam a agenda; mantém o primeiro de cada
    return list.filter((item, index) => list.findIndex(other => other.id === item.id) === index);
  } catch {
    return defaultProfessionals();
  }
}

export function saveProfessionals(professionals: Professional[]) {
  localStorage.setItem(PROFESSIONALS_KEY, JSON.stringify(professionals));
}

/** Volta ao conjunto inicial de exemplo. */
export function resetProfessionals() {
  localStorage.removeItem(PROFESSIONALS_KEY);
  return defaultProfessionals();
}

const PROTOCOL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newProtocol(now = new Date()) {
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, byte => PROTOCOL_ALPHABET[byte % PROTOCOL_ALPHABET.length]).join('');
  return `CON-${stamp}-${code}`;
}

export type NewAppointment = Omit<Appointment, 'id' | 'protocol' | 'status' | 'createdAt' | 'consentAt'>;

export type CreateResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; reason: 'slot_taken' | 'professional_unavailable' };

/**
 * Registra a consulta relendo o armazenamento e revalidando o horário no momento
 * da gravação, para não sobrescrever uma reserva feita em outra aba.
 */
export function createAppointment(input: NewAppointment, now = new Date()): CreateResult {
  const professional = loadProfessionals().find(item => item.id === input.professionalId);
  if (!professional || !professional.active) return { ok: false, reason: 'professional_unavailable' };

  const current = loadAppointments();
  const slot = slotsFor(professional, input.date, current, now).find(item => item.time === input.time);
  if (!slot || slot.state !== 'free') return { ok: false, reason: 'slot_taken' };

  const appointment: Appointment = {
    ...input,
    id: crypto.randomUUID(),
    protocol: newProtocol(now),
    status: 'agendada',
    createdAt: now.toISOString(),
    consentAt: now.toISOString()
  };
  saveAppointments([appointment, ...current]);
  return { ok: true, appointment };
}

export function updateAppointmentStatus(appointments: Appointment[], id: string, status: AppointmentStatus) {
  const next = appointments.map(item => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
  saveAppointments(next);
  return next;
}

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  agendada: 'Aguardando confirmação',
  confirmada: 'Confirmada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  faltou: 'Não compareceu'
};
