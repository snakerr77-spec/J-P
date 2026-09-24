import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { clearSessionCookie, createSessionCookie, hashPassword, requireAuth, verifyPassword } from '../lib/auth';

const auth = new Hono<AppEnv>();

auth.get('/status', async c => {
  const row = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  return c.json({ hasAdmin: (row?.count ?? 0) > 0 });
});

auth.post('/setup', async c => {
  const existing = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return c.json({ error: 'Já existe um administrador configurado.' }, 403);

  const body = await c.req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const name = String(body?.name || '').trim() || 'Administrador';

  if (!email.includes('@')) return c.json({ error: 'Informe um e-mail válido.' }, 400);
  if (password.length < 8) return c.json({ error: 'A senha deve ter ao menos 8 caracteres.' }, 400);

  const passwordHash = await hashPassword(password);
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
  ).bind(email, passwordHash, name).run();

  const userId = result.meta.last_row_id as number;
  await createSessionCookie(c, userId);
  return c.json({ profile: { name, role: 'Equipe de recrutamento', email, phone: '' } }, 201);
});

auth.post('/login', async c => {
  const body = await c.req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  if (!email || !password) return c.json({ error: 'Informe e-mail e senha.' }, 400);

  const user = await c.env.DB.prepare(
    'SELECT id, password_hash FROM users WHERE email = ?'
  ).bind(email).first<{ id: number; password_hash: string }>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'E-mail ou senha inválidos.' }, 401);
  }

  await createSessionCookie(c, user.id);
  return c.json({ ok: true });
});

auth.post('/logout', async c => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

auth.get('/me', requireAuth, async c => {
  const user = await c.env.DB.prepare(
    'SELECT name, role, email, phone FROM users WHERE id = ?'
  ).bind(c.get('userId')).first<{ name: string; role: string; email: string; phone: string }>();
  if (!user) return c.json({ error: 'Usuário não encontrado.' }, 404);
  return c.json({ profile: user });
});

auth.put('/me', requireAuth, async c => {
  const body = await c.req.json().catch(() => null);
  const name = String(body?.name || '').trim();
  const role = String(body?.role || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const phone = String(body?.phone || '').trim();
  if (!name || !role || !email) return c.json({ error: 'Preencha nome, cargo e e-mail.' }, 400);

  await c.env.DB.prepare(
    'UPDATE users SET name = ?, role = ?, email = ?, phone = ? WHERE id = ?'
  ).bind(name, role, email, phone, c.get('userId')).run();

  return c.json({ profile: { name, role, email, phone } });
});

export default auth;
