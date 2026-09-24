import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { requireAuth } from '../lib/auth';
import { INTERVIEW_STATUSES, mapInterview } from '../lib/mappers';
import type { InterviewLogRow, InterviewRow } from '../lib/mappers';
import type { InterviewLogEntry, InterviewStatus } from '../../shared/types';

const interviews = new Hono<AppEnv>();
interviews.use('*', requireAuth);

async function loadAll(env: AppEnv['Bindings']) {
  const { results: rows } = await env.DB.prepare('SELECT * FROM interviews ORDER BY date ASC, time ASC').all<InterviewRow>();
  const { results: logs } = await env.DB.prepare('SELECT * FROM interview_logs ORDER BY at ASC').all<InterviewLogRow>();
  return rows.map(row => mapInterview(row, logs));
}

async function replaceLogs(env: AppEnv['Bindings'], interviewId: string, logs: InterviewLogEntry[]) {
  const statements = [
    env.DB.prepare('DELETE FROM interview_logs WHERE interview_id = ?').bind(interviewId),
    ...logs.map(log => env.DB.prepare(
      'INSERT INTO interview_logs (id, interview_id, at, action, label, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(log.id, interviewId, log.at, log.action, log.label, log.details ?? null))
  ];
  await env.DB.batch(statements);
}

interviews.get('/', async c => c.json({ interviews: await loadAll(c.env) }));

interviews.post('/', async c => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Corpo inválido.' }, 400);

  const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID();
  const now = new Date().toISOString();
  const status: InterviewStatus = (INTERVIEW_STATUSES as string[]).includes(body.status) ? body.status : 'agendada';

  await c.env.DB.prepare(
    `INSERT INTO interviews (id, audience, candidate_id, person_name, role, email, phone, date, time, duration, interviewer, location, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    body.audience === 'colaborador' ? 'colaborador' : 'medico',
    body.candidateId ?? null,
    String(body.personName || '').trim() || 'Entrevista',
    String(body.role || '').trim(),
    String(body.email || ''),
    String(body.phone || ''),
    String(body.date || now.slice(0, 10)),
    String(body.time || '09:00'),
    Number(body.duration) || 30,
    String(body.interviewer || 'Equipe de recrutamento'),
    String(body.location || 'A definir'),
    String(body.notes || ''),
    status,
    now
  ).run();

  const logs: InterviewLogEntry[] = Array.isArray(body.logs) && body.logs.length
    ? body.logs
    : [{ id: `log-${id}-created`, at: now, action: 'criada', label: 'Entrevista agendada', details: `${body.personName || ''} • ${body.date || ''} às ${body.time || ''}` }];
  await replaceLogs(c.env, id, logs);

  const row = await c.env.DB.prepare('SELECT * FROM interviews WHERE id = ?').bind(id).first<InterviewRow>();
  const { results: logRows } = await c.env.DB.prepare('SELECT * FROM interview_logs WHERE interview_id = ? ORDER BY at ASC').bind(id).all<InterviewLogRow>();
  return c.json({ interview: mapInterview(row as InterviewRow, logRows) }, 201);
});

interviews.put('/:id', async c => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Corpo inválido.' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM interviews WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Entrevista não encontrada.' }, 404);

  const status: InterviewStatus = (INTERVIEW_STATUSES as string[]).includes(body.status) ? body.status : 'agendada';
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE interviews SET audience=?, candidate_id=?, person_name=?, role=?, email=?, phone=?, date=?, time=?, duration=?, interviewer=?, location=?, notes=?, status=?, updated_at=?, started_at=?, completed_at=?, actual_duration_sec=? WHERE id=?`
  ).bind(
    body.audience === 'colaborador' ? 'colaborador' : 'medico',
    body.candidateId ?? null,
    String(body.personName || '').trim() || 'Entrevista',
    String(body.role || ''),
    String(body.email || ''),
    String(body.phone || ''),
    String(body.date || ''),
    String(body.time || ''),
    Number(body.duration) || 30,
    String(body.interviewer || ''),
    String(body.location || ''),
    String(body.notes || ''),
    status,
    now,
    body.startedAt ?? null,
    body.completedAt ?? null,
    body.actualDurationSec ?? null,
    id
  ).run();

  if (Array.isArray(body.logs)) await replaceLogs(c.env, id, body.logs);

  const row = await c.env.DB.prepare('SELECT * FROM interviews WHERE id = ?').bind(id).first<InterviewRow>();
  const { results: logRows } = await c.env.DB.prepare('SELECT * FROM interview_logs WHERE interview_id = ? ORDER BY at ASC').bind(id).all<InterviewLogRow>();
  return c.json({ interview: mapInterview(row as InterviewRow, logRows) });
});

interviews.delete('/:id', async c => {
  const id = c.req.param('id');
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM interview_logs WHERE interview_id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM interviews WHERE id = ?').bind(id)
  ]);
  return c.json({ ok: true });
});

export default interviews;
