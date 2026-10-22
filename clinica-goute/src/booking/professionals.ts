import { seedProfessionals } from './config';
import { fromMinutes, toMinutes } from './format';
import type { Professional, WorkBlock, Weekday } from './types';

export const weekdayShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
export const weekdayLong = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'] as const;
export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const MAX_PRICE = 100000;
export const MIN_SLOT_MINUTES = 10;
export const MAX_SLOT_MINUTES = 120;
export const MAX_BLOCKS_PER_DAY = 4;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const money = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_PRICE ? Math.round(value) : null);

/** "Dra. Ana Lúcia" -> "dra-ana-lucia" (sem acentos, só a-z0-9 e hífen). */
export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** Gera um id único a partir do nome, sem repetir ids já usados. */
export function uniqueProfessionalId(name: string, existing: string[]) {
  const base = slugify(name.replace(/^(dr|dra)\.?\s+/i, '')) || 'profissional';
  if (!existing.includes(base)) return base;
  for (let n = 2; n < 1000; n++) if (!existing.includes(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${existing.length + 1}`;
}

/** Faixas válidas (HH:MM, início < fim, sem sobreposição), ordenadas. Retorna null se algo estiver inválido. */
export function normalizeBlocks(raw: unknown): WorkBlock[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_BLOCKS_PER_DAY) return null;
  const blocks: WorkBlock[] = [];
  for (const item of raw) {
    const start = (item as WorkBlock | null)?.start;
    const end = (item as WorkBlock | null)?.end;
    if (typeof start !== 'string' || typeof end !== 'string' || !TIME_RE.test(start) || !TIME_RE.test(end)) return null;
    if (toMinutes(start) >= toMinutes(end)) return null;
    blocks.push({ start, end });
  }
  blocks.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 1; i < blocks.length; i++) if (toMinutes(blocks[i].start) < toMinutes(blocks[i - 1].end)) return null;
  return blocks;
}

/** Valida e sanitiza um profissional vindo do armazenamento ou do formulário. Retorna null se inválido. */
export function normalizeProfessional(raw: unknown): Professional | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' && ID_RE.test(r.id) && r.id.length <= 60 ? r.id : null;
  const name = text(r.name, 80);
  const specialty = text(r.specialty, 60);
  const price = money(r.price);
  const returnPrice = money(r.returnPrice);
  const telePrice = r.telePrice === undefined || r.telePrice === null ? undefined : money(r.telePrice);
  const slot = typeof r.slotMinutes === 'number' ? Math.round(r.slotMinutes) : NaN;
  if (!id || name.length < 3 || specialty.length < 2 || price === null || price === 0 || returnPrice === null || telePrice === null) return null;
  if (!(slot >= MIN_SLOT_MINUTES && slot <= MAX_SLOT_MINUTES)) return null;

  const schedule: Professional['schedule'] = {};
  const rawSchedule = (r.schedule && typeof r.schedule === 'object' ? r.schedule : {}) as Record<string, unknown>;
  for (const day of WEEKDAYS) {
    if (rawSchedule[day] === undefined) continue;
    const blocks = normalizeBlocks(rawSchedule[day]);
    if (blocks === null) return null;
    if (blocks.length) schedule[day] = blocks;
  }

  const focus = Array.isArray(r.focus) ? r.focus.map(item => text(item, 40)).filter(Boolean).slice(0, 6) : [];
  const rqe = text(r.rqe, 30);
  return {
    id,
    name,
    specialty,
    council: text(r.council, 40),
    ...(rqe ? { rqe } : {}),
    tone: Number.isInteger(r.tone) ? ((r.tone as number) % 6 + 6) % 6 : 0,
    bio: text(r.bio, 280),
    focus,
    price,
    returnPrice,
    ...(telePrice !== undefined ? { telePrice } : {}),
    slotMinutes: slot,
    schedule,
    active: typeof r.active === 'boolean' ? r.active : true
  };
}

/** Novo profissional em branco (para o formulário do painel). */
export function emptyProfessional(existingIds: string[]): Professional {
  return {
    id: uniqueProfessionalId('novo profissional', existingIds),
    name: '',
    specialty: '',
    council: '',
    tone: existingIds.length % 6,
    bio: '',
    focus: [],
    price: 250,
    returnPrice: 125,
    slotMinutes: 30,
    schedule: Object.fromEntries([1, 2, 3, 4, 5].map(day => [day, [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }]])) as Professional['schedule'],
    active: true
  };
}

/** Resumo legível da agenda semanal, ex.: "Seg, Qua · 08:00–12:00, 14:00–18:00". */
export function scheduleSummary(professional: Professional) {
  const groups = new Map<string, Weekday[]>();
  for (const day of WEEKDAYS) {
    const blocks = professional.schedule[day];
    if (!blocks?.length) continue;
    const key = blocks.map(block => `${block.start}–${block.end}`).join(', ');
    groups.set(key, [...(groups.get(key) ?? []), day]);
  }
  if (!groups.size) return 'Sem atendimento configurado';
  return [...groups.entries()].map(([hours, days]) => `${days.map(day => weekdayShort[day]).join(', ')} · ${hours}`).join(' | ');
}

/** Quantidade de horários por semana (útil para validar se a agenda faz sentido). */
export function weeklySlotCount(professional: Professional) {
  let total = 0;
  for (const day of WEEKDAYS) {
    for (const block of professional.schedule[day] ?? []) {
      total += Math.floor((toMinutes(block.end) - toMinutes(block.start)) / professional.slotMinutes);
    }
  }
  return total;
}

export const defaultProfessionals = () => seedProfessionals.map(professional => structuredClone(professional));
export { fromMinutes };
