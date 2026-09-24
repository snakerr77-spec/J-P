import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { requireAuth } from '../lib/auth';
import { CANDIDATE_STATUSES, initialsFromName, mapCandidate } from '../lib/mappers';
import { storeDocument } from '../lib/documents';
import { HttpError } from '../lib/http-error';
import type { CandidateRow, DocumentRow } from '../lib/mappers';
import type { CandidateStatus, CandidateType } from '../../shared/types';

const candidates = new Hono<AppEnv>();
candidates.use('*', requireAuth);

const PROFILE_TYPES: CandidateType[] = ['medico', 'colaborador'];

candidates.get('/', async c => {
  const { results: rows } = await c.env.DB.prepare('SELECT * FROM candidates ORDER BY created_at DESC').all<CandidateRow>();
  const { results: docs } = await c.env.DB.prepare('SELECT * FROM documents').all<DocumentRow>();
  return c.json({ candidates: rows.map(row => mapCandidate(row, docs)) });
});

candidates.post('/', async c => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Corpo inválido.' }, 400);

  const profileType: CandidateType = PROFILE_TYPES.includes(body.profileType) ? body.profileType : 'medico';
  const name = String(body.name || '').trim();
  if (!name) return c.json({ error: 'Informe o nome do candidato.' }, 400);

  const status: CandidateStatus = (CANDIDATE_STATUSES as string[]).includes(body.status) ? body.status : 'novo';
  const createdAt = new Date().toISOString();
  const curriculum = Array.isArray(body.curriculum) && body.curriculum.length
    ? body.curriculum.map(String)
    : [`${profileType === 'medico' ? 'Médico' : 'Colaborador'} cadastrado manualmente no painel administrativo.`];

  const result = await c.env.DB.prepare(
    `INSERT INTO candidates (profile_type, name, initials, specialty, city, crm, rqe, status, email, phone, experience, availability, notes, curriculum, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    profileType,
    name,
    initialsFromName(name),
    String(body.specialty || '').trim(),
    String(body.city || '').trim(),
    profileType === 'medico' ? String(body.crm || '').trim() : 'Não se aplica',
    profileType === 'medico' ? (String(body.rqe || '').trim() || 'Não informado') : 'Não se aplica',
    status,
    String(body.email || '').trim(),
    String(body.phone || '').trim(),
    String(body.experience || '').trim() || 'Não informado',
    String(body.availability || '').trim(),
    String(body.notes || '').trim() || 'Candidato adicionado manualmente pelo painel.',
    JSON.stringify(curriculum),
    createdAt
  ).run();

  const id = result.meta.last_row_id as number;
  const row = await c.env.DB.prepare('SELECT * FROM candidates WHERE id = ?').bind(id).first<CandidateRow>();
  return c.json({ candidate: mapCandidate(row as CandidateRow, []) }, 201);
});

candidates.patch('/:id', async c => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Corpo inválido.' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM candidates WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Candidato não encontrado.' }, 404);

  const fields: string[] = [];
  const values: unknown[] = [];
  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (typeof body.status === 'string' && (CANDIDATE_STATUSES as string[]).includes(body.status)) {
    assign('status', body.status);
    assign('status_updated_at', new Date().toISOString());
  }
  if (typeof body.name === 'string' && body.name.trim()) {
    assign('name', body.name.trim());
    assign('initials', initialsFromName(body.name.trim()));
  }
  for (const key of ['specialty', 'city', 'crm', 'rqe', 'email', 'phone', 'experience', 'availability', 'notes'] as const) {
    if (typeof body[key] === 'string') assign(key, body[key]);
  }
  if (Array.isArray(body.curriculum)) assign('curriculum', JSON.stringify(body.curriculum.map(String)));

  if (!fields.length) return c.json({ error: 'Nada para atualizar.' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  const row = await c.env.DB.prepare('SELECT * FROM candidates WHERE id = ?').bind(id).first<CandidateRow>();
  const { results: docs } = await c.env.DB.prepare('SELECT * FROM documents WHERE candidate_id = ?').bind(id).all<DocumentRow>();
  return c.json({ candidate: mapCandidate(row as CandidateRow, docs) });
});

candidates.post('/:id/documents', async c => {
  const candidateId = Number(c.req.param('id'));
  const candidate = await c.env.DB.prepare('SELECT id FROM candidates WHERE id = ?').bind(candidateId).first();
  if (!candidate) return c.json({ error: 'Candidato não encontrado.' }, 404);

  const form = await c.req.formData();
  const file = form.get('file');
  const type = String(form.get('type') || 'documento');
  const label = String(form.get('label') || 'Documento');
  if (!(file instanceof File) || !file.size) return c.json({ error: 'Selecione um arquivo para enviar.' }, 400);

  try {
    const document = await storeDocument(c.env, candidateId, type, label, file);
    return c.json({ document }, 201);
  } catch (err) {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status as any);
    throw err;
  }
});

export default candidates;
