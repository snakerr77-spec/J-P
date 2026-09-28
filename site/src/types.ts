export type ServiceCategory = 'dermatologia' | 'corporal' | 'capilar' | 'nutricao' | 'cirurgico';

export type Service = {
  id: string;
  category: ServiceCategory;
  name: string;
  shortDescription: string;
  icon: string;
  highlight?: string;
};

export type Testimonial = {
  id: string;
  name: string;
  treatment: string;
  quote: string;
};

export type ProcessStep = {
  id: string;
  title: string;
  description: string;
};

export type BookingRequest = {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  period: 'manha' | 'tarde' | 'noite';
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: 'pendente';
  createdAt: string;
};
