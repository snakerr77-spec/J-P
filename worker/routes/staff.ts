import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { hashPassword, requireAuth } from '../lib/auth';

type StaffRow = { id: number; name: string; role: string; email: string; phone: string; created_at: string };

const staff = new Hono<AppEnv>();
staff.use('*', requireAuth);

function toStaffMember(row: StaffRow) {
  return { id: row.id, name: row.name, role: row.role, email: row.email, phone: row.phone, createdAt: row.created_at };
}

staff.get('/', async c => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, role, email, phone, created_at FROM users ORDER BY created_at ASC'
  ).all<StaffRow>();
  return c.json({ staff: results.map(toStaffMember) });
});

staff.post('/', async c => {
  const body = await c.req.json().catch(() => null);
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const role = String(body?.role || '').trim() || 'Equipe de recrutamento';
  const phone = String(body?.phone || '').trim();

  if (!name) return c.json({ error: 'Informe o nome.' }, 400);
  if (!email.includes('@')) return c.json({ error: 'Informe um e-mail válido.' }, 400);
  if (password.length < 8) return c.json({ error: 'A senha deve ter ao menos 8 caracteres.' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Já existe uma conta com esse e-mail.' }, 409);

  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, password_hash, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(email, passwordHash, name, role, phone, createdAt).run();

  const id = result.meta.last_row_id as number;
  return c.json({ staff: { id, name, role, email, phone, createdAt } }, 201);
});

staff.patch('/:id', async c => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Corpo inválido.' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Conta não encontrada.' }, 404);

  const fields: string[] = [];
  const values: unknown[] = [];
  const assign = (column: string, value: unknown) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (typeof body.name === 'string' && body.name.trim()) assign('name', body.name.trim());
  if (typeof body.role === 'string' && body.role.trim()) assign('role', body.role.trim());
  if (typeof body.phone === 'string') assign('phone', body.phone.trim());

  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    const collision = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(email, id).first();
    if (collision) return c.json({ error: 'Já existe uma conta com esse e-mail.' }, 409);
    assign('email', email);
  }

  if (typeof body.password === 'string' && body.password) {
    if (body.password.length < 8) return c.json({ error: 'A senha deve ter ao menos 8 caracteres.' }, 400);
    assign('password_hash', await hashPassword(body.password));
  }

  if (!fields.length) return c.json({ error: 'Nada para atualizar.' }, 400);

  values.push(id);
  await c.env.DB.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  const row = await c.env.DB.prepare(
    'SELECT id, name, role, email, phone, created_at FROM users WHERE id = ?'
  ).bind(id).first<StaffRow>();
  return c.json({ staff: toStaffMember(row as StaffRow) });
});

export default staff;
