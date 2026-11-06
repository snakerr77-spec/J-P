import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { initialsFromName } from '../lib/mappers';
import type { CandidateRow } from '../lib/mappers';
import { storeDocument, validateFile } from '../lib/documents';
import { randomToken, sha256Hex } from '../lib/crypto';
import type { CandidateType, PublicApplicationView } from '../../shared/types';

type DocumentField = { name: string; type: string; label: string };

// Todos os anexos são opcionais: o candidato pode enviar os dados agora e
// completar os documentos depois pela tela de revisão.
const DOCUMENT_FIELDS: Record<CandidateType, DocumentField[]> = {
  medico: [
    { name: 'cv', type: 'curriculo', label: 'Currículo profissional' },
    { name: 'photoId', type: 'documento_foto', label: 'Documento com foto' },
    { name: 'residence', type: 'comprovante_residencia', label: 'Comprovante de residência' },
    { name: 'crmCard', type: 'carteirinha_crm', label: 'Carteirinha CRM' },
    { name: 'diplomas', type: 'diploma_certificado', label: 'Diploma e certificados' },
    { name: 'practice', type: 'declaracao_atuacao', label: 'Declaração de atuação na área' },
    { name: 'clearance', type: 'certidao_crm', label: 'Certidão Negativa' }
  ],
  colaborador: [
    { name: 'cv', type: 'curriculo', label: 'Currículo profissional' }
  ]
};

function collectFiles(form: FormData, fields: DocumentField[]): { files: Map<DocumentField, File[]>; error: string | null } {
  const files = new Map<DocumentField, File[]>();
  for (const field of fields) {
    const selected = form.getAll(field.name).filter((value): value is File => value instanceof File && value.size > 0);
    for (const file of selected) {
      const error = validateFile(file);
      if (error) return { files, error };
    }
    files.set(field, selected);
  }
  return { files, error: null };
}

async function findByToken(env: AppEnv['Bindings'], token: string) {
  if (!token || token.length < 20) return null;
  const tokenHash = await sha256Hex(token);
  return env.DB.prepare('SELECT * FROM candidates WHERE access_token_hash = ?').bind(tokenHash).first<CandidateRow>();
}

const publicRoutes = new Hono<AppEnv>();

publicRoutes.post('/applications', async c => {
  const form = await c.req.formData();
  const profileType: CandidateType = form.get('profileType') === 'colaborador' ? 'colaborador' : 'medico';

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

  const { files: filesByField, error } = collectFiles(form, DOCUMENT_FIELDS[profileType]);
  if (error) return c.json({ error }, 400);

  const createdAt = new Date().toISOString();
  const summary = String(form.get('summary') || '').trim();
  const documentCount = [...filesByField.values()].reduce((total, files) => total + files.length, 0);
  const token = randomToken();
  const tokenHash = await sha256Hex(token);

  const result = await c.env.DB.prepare(
    `INSERT INTO candidates (profile_type, name, initials, specialty, city, crm, rqe, status, email, phone, experience, availability, notes, curriculum, created_at, access_token_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'novo', ?, ?, ?, ?, ?, ?, ?, ?)`
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
    documentCount
      ? `${documentCount} documento(s) anexado(s) na candidatura de ${profileType === 'medico' ? 'médico' : 'colaborador'}.`
      : `Candidatura de ${profileType === 'medico' ? 'médico' : 'colaborador'} enviada sem anexos (podem ser enviados depois).`,
    JSON.stringify([summary || 'Resumo profissional não informado.', `Disponibilidade: ${availability}.`]),
    createdAt,
    tokenHash
  ).run();

  const candidateId = result.meta.last_row_id as number;

  for (const [field, files] of filesByField) {
    for (const file of files) {
      await storeDocument(c.env, candidateId, field.type, field.label, file);
    }
  }

  return c.json({ ok: true, token }, 201);
});

publicRoutes.get('/applications/:token', async c => {
  const row = await findByToken(c.env, c.req.param('token'));
  if (!row) return c.json({ error: 'Candidatura não encontrada.' }, 404);

  const { results: docs } = await c.env.DB.prepare(
    'SELECT type, label, name FROM documents WHERE candidate_id = ? ORDER BY created_at ASC'
  ).bind(row.id).all<{ type: string; label: string; name: string }>();

  const application: PublicApplicationView = {
    profileType: row.profile_type === 'colaborador' ? 'colaborador' : 'medico',
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    specialty: row.specialty,
    crm: row.crm,
    rqe: row.rqe,
    experience: row.experience,
    availability: row.availability,
    documents: docs
  };
  return c.json({ application });
});

publicRoutes.post('/applications/:token/documents', async c => {
  const row = await findByToken(c.env, c.req.param('token'));
  if (!row) return c.json({ error: 'Candidatura não encontrada.' }, 404);

  const profileType: CandidateType = row.profile_type === 'colaborador' ? 'colaborador' : 'medico';
  const form = await c.req.formData();
  const { files: filesByField, error } = collectFiles(form, DOCUMENT_FIELDS[profileType]);
  if (error) return c.json({ error }, 400);

  let count = 0;
  for (const [field, files] of filesByField) {
    for (const file of files) {
      await storeDocument(c.env, row.id, field.type, field.label, file);
      count++;
    }
  }
  if (!count) return c.json({ error: 'Selecione ao menos um arquivo para enviar.' }, 400);

  return c.json({ ok: true, uploaded: count }, 201);
});

export default publicRoutes;
