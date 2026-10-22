const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const formatBRL = (value: number) => brl.format(value);

export function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** Converte Date -> YYYY-MM-DD no fuso local (toISOString usaria UTC). */
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM-DD -> Date no início do dia local. */
export function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number) {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayMonthYear = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatLongDate = (key: string) => longDate.format(parseDateKey(key));
export const formatShortDate = (key: string) => shortDate.format(parseDateKey(key)).replace(/\./g, '');
export const formatMonthYear = (date: Date) => monthYear.format(date);
export const formatFullDate = (key: string) => dayMonthYear.format(parseDateKey(key));

export function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1);
}

export function initialsOf(name: string) {
  return name
    .replace(/^(dr|dra)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}
