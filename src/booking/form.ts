import { phoneDigits } from '../phone';
import { dateKey } from './format';
import type { PaymentType } from './types';

export type PatientForm = {
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  paymentType: PaymentType;
  insuranceName: string;
  insuranceCard: string;
  reason: string;
  consent: boolean;
};

export const emptyForm: PatientForm = {
  name: '',
  phone: '',
  email: '',
  birthDate: '',
  paymentType: 'particular',
  insuranceName: '',
  insuranceCard: '',
  reason: '',
  consent: false
};

export type FormErrors = Partial<Record<keyof PatientForm, string>>;

export function validateForm(form: PatientForm, today = new Date()): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();
  if (name.length < 5 || !name.includes(' ')) errors.name = 'Informe nome e sobrenome.';

  const digits = phoneDigits(form.phone);
  if (digits.length < 10 || (digits.length === 11 && digits[2] !== '9')) errors.phone = 'Informe um telefone válido com DDD.';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Informe um e-mail válido.';

  if (form.birthDate && (form.birthDate > dateKey(today) || form.birthDate < '1900-01-01')) errors.birthDate = 'Data de nascimento inválida.';

  if (form.paymentType === 'convenio') {
    if (form.insuranceName.trim().length < 2) errors.insuranceName = 'Informe o nome do convênio.';
    if (form.insuranceCard.trim().length < 4) errors.insuranceCard = 'Informe o número da carteirinha.';
  }

  if (!form.consent) errors.consent = 'É necessário concordar para continuar.';
  return errors;
}
