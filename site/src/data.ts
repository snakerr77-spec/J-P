import type { ProcessStep, Service, Testimonial } from './types';

export const BOOKING_STORAGE_KEY = 'goutePendingAppointments_v1';

export const clinicInfo = {
  name: 'Clínica Goute',
  tagline: 'Dermatologia, estética e bem-estar',
  address: 'Av. Presidente Washington Luiz, 199 — Cerquilho, SP',
  phone: '(15) 99999-0000',
  whatsapp: '5515999990000',
  email: 'contato@clinicagoute.com.br',
  instagram: '@clinicagoute',
  hours: 'Seg a Sex • 8h às 18h  |  Sáb • 8h às 13h'
};

export const services: Service[] = [
  {
    id: 'dermatologia-clinica',
    category: 'dermatologia',
    name: 'Dermatologia Clínica',
    shortDescription: 'Diagnóstico e tratamento completo da pele, da avaliação de rotina a condições específicas.',
    icon: 'Stethoscope'
  },
  {
    id: 'seroterapia',
    category: 'dermatologia',
    name: 'Seroterapia',
    shortDescription: 'Técnica pioneira da clínica para revitalização e saúde da pele.',
    icon: 'Sparkles',
    highlight: 'Pioneirismo'
  },
  {
    id: 'capillare',
    category: 'capilar',
    name: 'Capillare',
    shortDescription: 'Protocolo capilar exclusivo que une cosmética desenvolvida em clínica e tecnologia para hidratação, brilho e resistência.',
    icon: 'Wind',
    highlight: 'Exclusivo'
  },
  {
    id: 'tratamento-capilar-mmp',
    category: 'capilar',
    name: 'Tratamento Capilar (MMP)',
    shortDescription: 'Protocolo para fortalecimento e recuperação capilar.',
    icon: 'Scissors'
  },
  {
    id: 'transplante-capilar',
    category: 'capilar',
    name: 'Transplante Capilar',
    shortDescription: 'Procedimento especializado para restauração definitiva dos fios.',
    icon: 'UserRound'
  },
  {
    id: 'sculptra',
    category: 'corporal',
    name: 'Sculptra',
    shortDescription: 'Bioestimulador de colágeno para rejuvenescimento facial e corporal gradual e natural.',
    icon: 'Sparkle'
  },
  {
    id: 'lipo-enzimatica',
    category: 'corporal',
    name: 'Lipo Enzimática',
    shortDescription: 'Redução de gordura localizada de forma minimamente invasiva.',
    icon: 'Droplet'
  },
  {
    id: 'nutricao-longevidade',
    category: 'nutricao',
    name: 'Nutrição & Longevidade',
    shortDescription: 'Acompanhamento nutricional voltado a emagrecimento, saúde e qualidade de vida a longo prazo.',
    icon: 'Leaf'
  },
  {
    id: 'procedimentos-cirurgicos',
    category: 'cirurgico',
    name: 'Procedimentos Cirúrgicos',
    shortDescription: 'Intervenções especializadas conduzidas por equipe experiente, com acompanhamento completo.',
    icon: 'ShieldCheck'
  }
];

export const processSteps: ProcessStep[] = [
  {
    id: 'avaliacao',
    title: 'Avaliação',
    description: 'Consulta inicial para entender sua pele, histórico e objetivos.'
  },
  {
    id: 'plano',
    title: 'Plano personalizado',
    description: 'Sua especialista monta um protocolo sob medida, com prazos e expectativas claras.'
  },
  {
    id: 'tratamento',
    title: 'Tratamento',
    description: 'Sessões conduzidas com tecnologia e produtos desenvolvidos pela clínica.'
  },
  {
    id: 'acompanhamento',
    title: 'Acompanhamento',
    description: 'Retorno e ajustes contínuos até o resultado desejado.'
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Fernanda A.',
    treatment: 'Capillare',
    quote: 'Depois de anos tentando resolver a queda capilar, foi na Goute que finalmente vi resultado — e o atendimento é impecável do início ao fim.'
  },
  {
    id: 't2',
    name: 'Renata S.',
    treatment: 'Seroterapia',
    quote: 'Equipe extremamente atenciosa. Cada etapa foi explicada com calma, sem pressa nenhuma pra eu decidir.'
  },
  {
    id: 't3',
    name: 'Camila O.',
    treatment: 'Sculptra',
    quote: 'Resultado natural e gradual, exatamente como me explicaram na avaliação. Recomendo de olhos fechados.'
  }
];

export const navLinks = [
  { label: 'Início', hash: '#home' },
  { label: 'Especialidades', hash: '#especialidades' },
  { label: 'Sobre', hash: '#sobre' },
  { label: 'Depoimentos', hash: '#depoimentos' },
  { label: 'Contato', hash: '#contato' }
];
