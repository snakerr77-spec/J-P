import { clinic } from './config';
import { formatFullDate, formatLongDate, capitalize, pad, parseDateKey, toMinutes } from './format';
import type { Appointment } from './types';

const modalityLabel = (appointment: Appointment) => appointment.modality === 'telemedicina' ? 'Telemedicina' : 'Presencial';

/** Mensagem pronta para o paciente enviar à clínica pelo WhatsApp. */
export function whatsappLink(appointment: Appointment) {
  const lines = [
    `Olá! Acabei de solicitar uma consulta pelo site (protocolo ${appointment.protocol}).`,
    '',
    `Profissional: ${appointment.professionalName} (${appointment.specialty})`,
    `Data: ${capitalize(formatLongDate(appointment.date))}, ${formatFullDate(appointment.date)} às ${appointment.time}`,
    `Modalidade: ${modalityLabel(appointment)}`,
    `Paciente: ${appointment.patient.name}`,
    '',
    'Poderiam confirmar o horário, por favor?'
  ];
  return `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export const supportLink = `https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de ajuda para agendar uma consulta.')}`;

const icsStamp = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;

const icsEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Arquivo .ics (horário local flutuante) com lembrete 1 dia e 1 hora antes. */
export function buildIcs(appointment: Appointment) {
  const day = parseDateKey(appointment.date);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, toMinutes(appointment.time));
  const end = new Date(start.getTime() + appointment.durationMin * 60000);
  const where = appointment.modality === 'telemedicina'
    ? 'Telemedicina (o link será enviado pela clínica)'
    : clinic.address || clinic.name;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${icsEscape(clinic.name)}//Agendamento//PT-BR`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@agendamento`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(`Consulta - ${appointment.professionalName}`)}`,
    `DESCRIPTION:${icsEscape(`${appointment.specialty} (${modalityLabel(appointment)}). Protocolo ${appointment.protocol}. Chegue 15 minutos antes.`)}`,
    `LOCATION:${icsEscape(where)}`,
    'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Consulta amanhã', 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Consulta em 1 hora', 'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcs(appointment: Appointment) {
  const blob = new Blob([buildIcs(appointment)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `consulta-${appointment.protocol}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Contato do painel com o paciente (assume número brasileiro: DDD + telefone). */
export function patientWhatsappLink(appointment: Appointment) {
  const digits = appointment.patient.phone.replace(/\D/g, '');
  const first = appointment.patient.name.split(' ')[0];
  const text = `Olá, ${first}! Aqui é da ${clinic.name}. Sobre sua consulta com ${appointment.professionalName} em ${formatFullDate(appointment.date)} às ${appointment.time} (protocolo ${appointment.protocol}):`;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(text)}`;
}
