import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../lib/auth';
import {
  clearPendingMfaCookie,
  createPendingMfaCookie,
  createSession,
  destroySession,
  getPendingMfaUserId,
  hashPassword,
  requireAuth,
  verifyPassword
} from '../lib/auth';
import { timingSafeEqual } from '../lib/crypto';
import { generateOtpCode, hashOtpCode } from '../lib/otp';
import { sendOtpEmail } from '../lib/email';
import { isRateLimited, recordLoginAttempt } from '../lib/rate-limit';

const auth = new Hono<AppEnv>();

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;

async function issueMfaChallenge(c: Context<AppEnv>, userId: number, email: string): Promise<void> {
  const code = generateOtpCode();
  // Envia primeiro: se falhar, nada é gravado e o cliente pode tentar de novo
  // sem ficar com um código "fantasma" que nunca chegou à caixa de entrada.
  await sendOtpEmail(c.env, email, code);

  const codeHash = await hashOtpCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000).toISOString();

  await c.env.DB.prepare('DELETE FROM mfa_codes WHERE user_id = ?').bind(userId).run();
  await c.env.DB.prepare(
    'INSERT INTO mfa_codes (user_id, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(userId, codeHash, expiresAt, now.toISOString()).run();

  await createPendingMfaCookie(c, userId);
}

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
    'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)'
  ).bind(email, passwordHash, name, new Date().toISOString()).run();

  const userId = result.meta.last_row_id as number;
  try {
    await issueMfaChallenge(c, userId, email);
  } catch (err) {
    // Sem o e-mail de verificação não há como entrar: desfaz a criação para
    // que o setup possa ser tentado de novo em vez de deixar uma conta travada.
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    throw err;
  }

  return c.json({ mfaRequired: true, email }, 201);
});

auth.post('/login', async c => {
  const body = await c.req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  if (!email || !password) return c.json({ error: 'Informe e-mail e senha.' }, 400);

  if (await isRateLimited(c.env, email)) {
    return c.json({ error: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.' }, 429);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, password_hash FROM users WHERE email = ?'
  ).bind(email).first<{ id: number; password_hash: string }>();

  const valid = user ? await verifyPassword(password, user.password_hash) : false;
  await recordLoginAttempt(c.env, email, valid);

  if (!user || !valid) {
    return c.json({ error: 'E-mail ou senha inválidos.' }, 401);
  }

  await issueMfaChallenge(c, user.id, email);
  return c.json({ mfaRequired: true, email });
});

auth.post('/verify-mfa', async c => {
  const userId = await getPendingMfaUserId(c);
  if (!userId) return c.json({ error: 'Verificação expirada. Faça login novamente.' }, 401);

  const body = await c.req.json().catch(() => null);
  const code = String(body?.code || '').trim();
  if (!/^\d{6}$/.test(code)) return c.json({ error: 'Informe o código de 6 dígitos.' }, 400);

  const row = await c.env.DB.prepare(
    'SELECT id, code_hash, attempts, expires_at FROM mfa_codes WHERE user_id = ?'
  ).bind(userId).first<{ id: number; code_hash: string; attempts: number; expires_at: string }>();

  if (!row) return c.json({ error: 'Nenhum código pendente. Faça login novamente.' }, 401);

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await c.env.DB.prepare('DELETE FROM mfa_codes WHERE id = ?').bind(row.id).run();
    clearPendingMfaCookie(c);
    return c.json({ error: 'Código expirado. Faça login novamente.' }, 401);
  }

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    await c.env.DB.prepare('DELETE FROM mfa_codes WHERE id = ?').bind(row.id).run();
    clearPendingMfaCookie(c);
    return c.json({ error: 'Muitas tentativas incorretas. Faça login novamente.' }, 401);
  }

  const codeHash = await hashOtpCode(code);
  if (!timingSafeEqual(codeHash, row.code_hash)) {
    await c.env.DB.prepare('UPDATE mfa_codes SET attempts = attempts + 1 WHERE id = ?').bind(row.id).run();
    const remaining = OTP_MAX_ATTEMPTS - (row.attempts + 1);
    return c.json({ error: remaining > 0 ? `Código incorreto. Restam ${remaining} tentativa(s).` : 'Código incorreto.' }, 401);
  }

  await c.env.DB.prepare('DELETE FROM mfa_codes WHERE id = ?').bind(row.id).run();
  clearPendingMfaCookie(c);
  await createSession(c, userId);

  const user = await c.env.DB.prepare(
    'SELECT name, role, email, phone FROM users WHERE id = ?'
  ).bind(userId).first<{ name: string; role: string; email: string; phone: string }>();
  if (!user) return c.json({ error: 'Usuário não encontrado.' }, 404);
  return c.json({ profile: user });
});

auth.post('/resend-mfa', async c => {
  const userId = await getPendingMfaUserId(c);
  if (!userId) return c.json({ error: 'Verificação expirada. Faça login novamente.' }, 401);

  const existing = await c.env.DB.prepare(
    'SELECT created_at FROM mfa_codes WHERE user_id = ?'
  ).bind(userId).first<{ created_at: string }>();

  if (existing) {
    const elapsedSeconds = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      return c.json({ error: `Aguarde ${wait}s para solicitar um novo código.` }, 429);
    }
  }

  const user = await c.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>();
  if (!user) return c.json({ error: 'Usuário não encontrado.' }, 404);

  await issueMfaChallenge(c, userId, user.email);
  return c.json({ ok: true });
});

auth.post('/logout', async c => {
  await destroySession(c);
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
