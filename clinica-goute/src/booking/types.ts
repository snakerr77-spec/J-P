export type Modality = 'presencial' | 'telemedicina';
export type VisitType = 'primeira' | 'retorno';
export type PaymentType = 'particular' | 'convenio';
export type AppointmentStatus = 'agendada' | 'confirmada' | 'concluida' | 'cancelada' | 'faltou';

/** Faixa de atendimento no formato 24h, ex.: { start: '08:00', end: '12:00' }. */
export type WorkBlock = { start: string; end: string };

/** 0 = domingo ... 6 = sábado. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Professional = {
  id: string;
  name: string;
  /** Especialidade em texto livre (ex.: "Cardiologia"); agrupa os filtros da página pública. */
  specialty: string;
  /** Registro profissional (CRM/CRP...). Valor de exemplo — substitua pelo real. */
  council: string;
  rqe?: string;
  /** Tom (0-5) do avatar com iniciais. */
  tone: number;
  bio: string;
  focus: string[];
  /** Valores em reais. `telePrice` ausente = não atende por telemedicina. */
  price: number;
  returnPrice: number;
  telePrice?: number;
  slotMinutes: number;
  schedule: Partial<Record<Weekday, WorkBlock[]>>;
  active: boolean;
};

export type PatientInfo = {
  name: string;
  phone: string;
  email: string;
  birthDate?: string;
};

export type Appointment = {
  id: string;
  protocol: string;
  professionalId: string;
  professionalName: string;
  specialty: string;
  /** Data local no formato YYYY-MM-DD. */
  date: string;
  /** Horário local no formato HH:MM. */
  time: string;
  durationMin: number;
  modality: Modality;
  visitType: VisitType;
  paymentType: PaymentType;
  insuranceName?: string;
  insuranceCard?: string;
  /** Valor cobrado no momento do agendamento (0 quando por convênio). */
  price: number;
  patient: PatientInfo;
  reason?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
  consentAt: string;
};

export type SlotState = 'free' | 'busy' | 'past';
export type Slot = { time: string; state: SlotState };
