import type { Professional, Weekday } from './types';

/**
 * ====== CONFIGURAÇÃO DA CLÍNICA ======
 * Contatos, profissionais e valores abaixo são EXEMPLOS para demonstração.
 * Os profissionais e valores podem ser editados em Painel > Profissionais
 * (ficam salvos no navegador); este arquivo define apenas o conjunto inicial.
 */
export const clinic = {
  name: 'Clínica Goute',
  /** Número com DDI+DDD, só dígitos. Usado no botão de WhatsApp. EXEMPLO — troque pelo real. */
  whatsapp: '5511999990000',
  phoneLabel: '(11) 99999-0000',
  /** Deixe vazio até definir; a confirmação então informa que o endereço será enviado pela clínica. */
  address: '',
  hoursLabel: 'Seg a Sex, 8h às 18h · Sáb, 8h às 12h',
  /** Mostra o aviso de "valores e profissionais ilustrativos". Desligue ao publicar com dados reais. */
  demoNotice: true,
  /** Prazo (dias) em que a consulta de retorno vale com o valor reduzido. */
  returnWindowDays: 30,
  /** Texto exibido no resumo do valor. EXEMPLO — ajuste à política da clínica. */
  paymentNote: 'Pagamento direto na clínica, no dia da consulta.'
};

/** Quantos dias à frente o paciente pode agendar. */
export const BOOKING_HORIZON_DAYS = 60;
/** Antecedência mínima para agendar (minutos). */
export const MIN_LEAD_MINUTES = 90;
/**
 * Sem servidor ainda, a agenda só conhece as consultas feitas neste navegador.
 * Com `true`, ~28% dos horários aparecem como ocupados (resultado determinístico)
 * para demonstrar o fluxo. Coloque `false` quando houver API de agenda real.
 */
export const SIMULATE_BUSY_SLOTS = true;

/** Sugestões de especialidade no cadastro de profissionais (o campo aceita texto livre). */
export const specialtySuggestions = [
  'Clínica Geral', 'Cardiologia', 'Dermatologia', 'Ginecologia', 'Pediatria', 'Ortopedia',
  'Neurologia', 'Psiquiatria', 'Endocrinologia', 'Oftalmologia', 'Otorrinolaringologia',
  'Urologia', 'Reumatologia', 'Nutrição', 'Psicologia'
];

const weekdays = (days: Weekday[], blocks: { start: string; end: string }[]) =>
  Object.fromEntries(days.map(day => [day, blocks])) as Professional['schedule'];

const morning = { start: '08:00', end: '12:00' };
const afternoon = { start: '14:00', end: '18:00' };

/** Conjunto inicial (exemplos fictícios). */
export const seedProfessionals: Professional[] = [
  {
    id: 'helena-duarte',
    name: 'Dra. Helena Duarte',
    specialty: 'Clínica Geral',
    council: 'CRM/SP 000001',
    tone: 0,
    bio: 'Acompanhamento clínico completo do adulto, com foco em prevenção e check-up.',
    focus: ['Check-up', 'Hipertensão', 'Diabetes'],
    price: 220,
    returnPrice: 110,
    telePrice: 190,
    slotMinutes: 30,
    schedule: weekdays([1, 2, 3, 4, 5], [morning, afternoon]),
    active: true
  },
  {
    id: 'marcos-oliveira',
    name: 'Dr. Marcos Oliveira',
    specialty: 'Clínica Geral',
    council: 'CRM/SP 000002',
    tone: 1,
    bio: 'Clínica médica e medicina de família, com atendimento acolhedor e sem pressa.',
    focus: ['Medicina de família', 'Queixas gerais', 'Atestados'],
    price: 200,
    returnPrice: 100,
    telePrice: 170,
    slotMinutes: 30,
    schedule: { ...weekdays([1, 3, 5], [morning, afternoon]), 6: [morning] },
    active: true
  },
  {
    id: 'rafael-menezes',
    name: 'Dr. Rafael Menezes',
    specialty: 'Cardiologia',
    council: 'CRM/SP 000003',
    rqe: 'RQE 00001',
    tone: 2,
    bio: 'Cardiologista com atuação em prevenção, avaliação pré-operatória e check-up cardiológico.',
    focus: ['Check-up cardíaco', 'Arritmias', 'Pressão alta'],
    price: 380,
    returnPrice: 190,
    telePrice: 340,
    slotMinutes: 40,
    schedule: weekdays([2, 4], [morning, afternoon]),
    active: true
  },
  {
    id: 'camila-nogueira',
    name: 'Dra. Camila Nogueira',
    specialty: 'Dermatologia',
    council: 'CRM/SP 000004',
    rqe: 'RQE 00002',
    tone: 3,
    bio: 'Dermatologia clínica e estética: pele, cabelos e unhas em todas as idades.',
    focus: ['Acne', 'Manchas', 'Queda de cabelo'],
    price: 420,
    returnPrice: 210,
    telePrice: 380,
    slotMinutes: 30,
    schedule: weekdays([1, 3, 4], [morning, afternoon]),
    active: true
  },
  {
    id: 'beatriz-falcao',
    name: 'Dra. Beatriz Falcão',
    specialty: 'Ginecologia',
    council: 'CRM/SP 000005',
    rqe: 'RQE 00003',
    tone: 4,
    bio: 'Saúde da mulher em todas as fases: pré-natal, planejamento familiar e climatério.',
    focus: ['Pré-natal', 'Preventivo', 'Menopausa'],
    price: 350,
    returnPrice: 175,
    telePrice: 310,
    slotMinutes: 40,
    schedule: weekdays([2, 3, 5], [morning, afternoon]),
    active: true
  },
  {
    id: 'andre-tavares',
    name: 'Dr. André Tavares',
    specialty: 'Pediatria',
    council: 'CRM/SP 000006',
    rqe: 'RQE 00004',
    tone: 5,
    bio: 'Pediatra com acompanhamento do recém-nascido ao adolescente, puericultura e vacinas.',
    focus: ['Puericultura', 'Recém-nascidos', 'Vacinação'],
    price: 300,
    returnPrice: 150,
    telePrice: 270,
    slotMinutes: 30,
    schedule: { ...weekdays([1, 2, 3, 4, 5], [afternoon]), 6: [morning] },
    active: true
  },
  {
    id: 'gustavo-lacerda',
    name: 'Dr. Gustavo Lacerda',
    specialty: 'Ortopedia',
    council: 'CRM/SP 000007',
    rqe: 'RQE 00005',
    tone: 1,
    bio: 'Ortopedia e traumatologia: coluna, joelho, ombro e lesões do esporte.',
    focus: ['Coluna', 'Joelho', 'Lesões esportivas'],
    price: 380,
    returnPrice: 190,
    slotMinutes: 30,
    schedule: weekdays([1, 4], [morning, afternoon]),
    active: true
  },
  {
    id: 'isabela-prado',
    name: 'Dra. Isabela Prado',
    specialty: 'Neurologia',
    council: 'CRM/SP 000008',
    rqe: 'RQE 00006',
    tone: 2,
    bio: 'Neurologia clínica: cefaleias, distúrbios do sono, memória e doenças neurodegenerativas.',
    focus: ['Enxaqueca', 'Sono', 'Memória'],
    price: 450,
    returnPrice: 225,
    telePrice: 400,
    slotMinutes: 50,
    schedule: weekdays([3, 5], [morning, afternoon]),
    active: true
  },
  {
    id: 'thiago-moura',
    name: 'Dr. Thiago Moura',
    specialty: 'Psiquiatria',
    council: 'CRM/SP 000009',
    rqe: 'RQE 00007',
    tone: 4,
    bio: 'Psiquiatria adulta com escuta qualificada: ansiedade, depressão e saúde mental no trabalho.',
    focus: ['Ansiedade', 'Depressão', 'Burnout'],
    price: 480,
    returnPrice: 240,
    telePrice: 430,
    slotMinutes: 50,
    schedule: weekdays([2, 4, 5], [afternoon]),
    active: true
  }
];
