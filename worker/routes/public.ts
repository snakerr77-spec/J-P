import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { initialsFromName } from '../lib/mappers';
import { storeDocument, validateFile } from '../lib/documents';
import type { CandidateType } from '../../shared/types';

type DocumentField = { name: string; type: string; label: string; required: boolean };

const DOCUMENT_FIELDS: Record<CandidateType, DocumentField[]> = {
  medico: [
    { name: 'cv', type: 'curriculo', label: 'Currículo profissional', required: true },
    { name: 'photoId', type: 'documento_foto', label: 'Documento com foto', required: true },
    { name: 'residence', type: 'comprovante_residencia', label: 'Comprovante de residência', required: true },
    { name: 'crmCard', type: 'carteirinha_crm', label: 'Carteirinha CRM', required: true },
    { name: 'diplomas', type: 'diploma_certificado', label: 'Diploma e certificados', required: true },
    { name: 'practice', type: 'declaracao_atuacao', label: 'Declaração de atuação na área', required: true },
    { name: 'clearance', type: 'certidao_crm', label: 'Certidão Negativa', required: true }
  ],
  colaborador: [
    { name: 'cv', type: 'curriculo', label: 'Currículo profissional', required: true }
  ]
};

const publicRoutes = new Hono<AppEnv>();

publicRoutes.post('/applications', async c => {
  const form = await c.req.formData();
  const profileType: CandidateType = form.get('profileType') === 'colaborador' ? 'colaborador' : 'medico';
  const fields = DOCUMENT_FIELDS[profileType];

  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const phone = String(form.get('phone') || '').trim();
  const specialty = String(form.get('specialty') || '').trim();
  const availability = String(form.get('availability') || '').trim();
  const crm = String(form.get('crm') || '').trim();

  const requiredOk = profileType === 'medico'
    ? Boolean(name && email && phone && crm && specialty && availability)
    : Boolean(name && email && phone && specialty && availability);
  if (!requiredOk) {
    return c.json({ error: profileType === 'medico'
      ? 'Preencha Nome, Especialidade, CRM, Telefone, E-mail e Disponibilidade.'
      : 'Preencha Nome, Cargo/Área, Telefone, E-mail e Disponibilidade.' }, 400);
  }

  const filesByField = new Map<DocumentField, File[]>();
  for (const field of fields) {
    const files = form.getAll(field.name).filter((value): value is File => value instanceof File && value.size > 0);
    if (field.required && !files.length) return c.json({ error: `Anexe ${field.label} para continuar.` }, 400);
    for (const file of files) {
      const error = validateFile(file);
      if (error) return c.json({ error }, 400);
    }
    filesByField.set(field, files);
  }

  const createdAt = new Date().toISOString();
  const summary = String(form.get('summary') || '').trim();
  const documentCount = [...filesByField.values()].reduce((total, files) => total + files.length, 0);

  const result = await c.env.DB.prepare(
    `INSERT INTO candidates (profile_type, name, initials, specialty, city, crm, rqe, status, email, phone, experience, availability, notes, curriculum, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'novo', ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    profileType,
    name,
    initialsFromName(name),
    specialty || (profileType === 'medico' ? 'Especialidade não informada' : 'Área não informada'),
    String(form.get('city') || '').trim() || 'Cidade não informada',
    profileType === 'medico' ? crm : 'Não se aplica',
    profileType === 'medico' ? (String(form.get('rqe') || '').trim() || 'Não informado') : 'Não se aplica',
    email,
    phone,
    String(form.get('experience') || '').trim() || 'Não informado',
    availability,
    `${documentCount} documento(s) anexado(s) na candidatura de ${profileType === 'medico' ? 'médico' : 'colaborador'}.`,
    JSON.stringify([summary || 'Resumo profissional não informado.', `Disponibilidade: ${availability}.`, `${documentCount} documento(s) anexado(s).`]),
    createdAt
  ).run();

  const candidateId = result.meta.last_row_id as number;

  for (const [field, files] of filesByField) {
    for (const file of files) {
      await storeDocument(c.env, candidateId, field.type, field.label, file);
    }
  }

  return c.json({ ok: true }, 201);
});

export default publicRoutes;
