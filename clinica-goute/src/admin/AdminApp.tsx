import { useState } from 'react';
import { loadAppointments, loadProfessionals, resetProfessionals, saveProfessionals, updateAppointmentStatus } from '@/booking/storage';
import type { Appointment, Professional } from '@/booking/types';
import AppointmentsView from './AppointmentsView';
import ProfessionalsView from './ProfessionalsView';

// STUB — substituído pela implementação completa (acesso, layout, rotas, toasts, sincronização).
export default function AdminApp() {
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadAppointments());
  const [professionals, setProfessionals] = useState<Professional[]>(() => loadProfessionals());
  const toast = (message: string) => console.info(message);
  return (
    <div className="clinic-theme p-6">
      <AppointmentsView appointments={appointments} professionals={professionals} onStatus={(id, status) => setAppointments(updateAppointmentStatus(appointments, id, status))} onToast={toast} />
      <ProfessionalsView professionals={professionals} appointments={appointments} onSave={next => { saveProfessionals(next); setProfessionals(next); }} onReset={() => setProfessionals(resetProfessionals())} onToast={toast} />
    </div>
  );
}
