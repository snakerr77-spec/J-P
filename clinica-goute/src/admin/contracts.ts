import type { Appointment, AppointmentStatus, Professional } from '@/booking/types';

export type AdminSection = 'agendamentos' | 'profissionais';

/** Contrato de props entre AdminApp (estado/rotas) e as telas do painel. Não altere sem atualizar os três lados. */
export type AppointmentsViewProps = {
  appointments: Appointment[];
  professionals: Professional[];
  /** Persiste a mudança de status e atualiza o estado do painel. */
  onStatus: (id: string, status: AppointmentStatus) => void;
  onToast: (message: string) => void;
};

export type ProfessionalsViewProps = {
  professionals: Professional[];
  appointments: Appointment[];
  /** Recebe a lista COMPLETA já validada (normalizeProfessional); persiste e atualiza o estado do painel. */
  onSave: (next: Professional[]) => void;
  /** Restaura os profissionais de exemplo (seedProfessionals). */
  onReset: () => void;
  onToast: (message: string) => void;
};
