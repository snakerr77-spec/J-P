import { baseProfessionals } from './config';
import { slotsFor } from './availability';
import type { Appointment, AppointmentStatus, Professional, ProfessionalOverride } from './types';

export const APPOINTMENTS_KEY = 'jpClinicAppointments_v1';
export const PROFESSIONAL_OVERRIDES_KEY = 'jpClinicProfessionalOverrides_v1';

export function loadAppointments(): Appointment[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as Appointment[]) : [];
  } catch {
    return [];
  }
}

export function saveAppointments(appointments: Appointment[]) {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

export function loadOverrides(): Record<string, ProfessionalOverride> {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFESSIONAL_OVERRIDES_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: Record<string, ProfessionalOverride>) {
  localStorage.setItem(PROFESSIONAL_OVERRIDES_KEY, JSON.stringify(overrides));
}

const validMoney = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function applyOverride(base: Professional, override: ProfessionalOverride = {}): Professional {
  return {
    ...base,
    price: validMoney(override.price) ? override.price : base.price,
    returnPrice: validMoney(override.returnPrice) ? override.returnPrice : base.returnPrice,
    telePrice: override.telePrice === null ? undefined : validMoney(override.telePrice) ? override.telePrice : base.telePrice,
    active: typeof override.active === 'boolean' ? override.active : base.active
  };
}

/** Profissionais da configuração com os valores/ativação definidos no painel. */
export function loadProfessionals(overrides = loadOverrides()): Professional[] {
  return baseProfessionals.map(professional => applyOverride(professional, overrides[professional.id]));
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
