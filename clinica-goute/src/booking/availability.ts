import { BOOKING_HORIZON_DAYS, MIN_LEAD_MINUTES, SIMULATE_BUSY_SLOTS } from './config';
import { dateKey, fromMinutes, parseDateKey, toMinutes } from './format';
import type { Appointment, Professional, Slot, Weekday } from './types';

/** Hash estável (FNV-1a) para simular ocupação sem aleatoriedade entre renders. */
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const isSimulatedBusy = (professionalId: string, key: string, time: string) =>
  SIMULATE_BUSY_SLOTS && hash(`${professionalId}|${key}|${time}`) % 100 < 28;

export function bookableRange(now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(first);
  last.setDate(last.getDate() + BOOKING_HORIZON_DAYS);
  return { first, last };
}

/** Horários de um profissional em uma data, já marcados como livre/ocupado/passado. */
export function slotsFor(professional: Professional, key: string, appointments: Appointment[], now = new Date()): Slot[] {
  const day = parseDateKey(key);
  const { first, last } = bookableRange(now);
  if (!professional.active || day < first || day > last) return [];

  const blocks = professional.schedule[day.getDay() as Weekday] ?? [];
  const taken = new Set(
    appointments
      .filter(item => item.professionalId === professional.id && item.date === key && item.status !== 'cancelada')
      .map(item => item.time)
  );
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60000;

  const slots: Slot[] = [];
  for (const block of blocks) {
    for (let t = toMinutes(block.start); t + professional.slotMinutes <= toMinutes(block.end); t += professional.slotMinutes) {
      const time = fromMinutes(t);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(t / 60), t % 60).getTime();
      const state = start < earliest ? 'past' : taken.has(time) || isSimulatedBusy(professional.id, key, time) ? 'busy' : 'free';
      slots.push({ time, state });
    }
  }
  return slots;
}

export const freeCount = (slots: Slot[]) => slots.filter(slot => slot.state === 'free').length;

/** Próximo horário livre do profissional (ou null se não houver no período). */
export function nextAvailable(professional: Professional, appointments: Appointment[], now = new Date()) {
  const { first } = bookableRange(now);
  for (let offset = 0; offset <= BOOKING_HORIZON_DAYS; offset++) {
    const day = new Date(first);
    day.setDate(first.getDate() + offset);
    const key = dateKey(day);
    const free = slotsFor(professional, key, appointments, now).find(slot => slot.state === 'free');
    if (free) return { date: key, time: free.time };
  }
  return null;
}

export function priceFor(
  professional: Professional,
  modality: 'presencial' | 'telemedicina',
  visitType: 'primeira' | 'retorno'
) {
  if (modality === 'telemedicina' && professional.telePrice !== undefined) {
    return visitType === 'retorno' ? Math.round(professional.telePrice / 2) : professional.telePrice;
  }
  return visitType === 'retorno' ? professional.returnPrice : professional.price;
}
