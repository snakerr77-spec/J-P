import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context, Next } from 'hono';
import type { Env } from '../env';
import { fromHex, randomToken, sha256Hex, timingSafeEqual, toHex } from './crypto';

export type AppEnv = { Bindings: Env; Variables: { userId: number } };
type AppContext = Context<AppEnv>;

const SESSION_COOKIE = 'jp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PENDING_MFA_COOKIE = 'jp_mfa_pending';
const PENDING_MFA_TTL_SECONDS = 60 * 10;
const PBKDF2_ITERATIONS = 100_000;

function isHttps(c: AppContext) {
  return new URL(c.req.url).protocol === 'https:';
}

// ---- Senha (PBKDF2, salgada e com hash lento) ----

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  const salt = fromHex(parts[2]);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return timingSafeEqual(toHex(bits), parts[3]);
}

// ---- Sessão: token aleatório no cookie, só o hash dele fica no D1.
// Permite revogar sessões de verdade (logout apaga a linha; comprometer o banco
// não dá acesso a nenhuma sessão válida). ----

export async function createSession(c: AppContext, userId: number): Promise<void> {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();
  await c.env.DB.prepare(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(tokenHash, userId, now.toISOString(), expiresAt).run();
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function destroySession(c: AppContext): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

async function getSessionUserId(c: AppContext): Promise<number | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?'
  ).bind(tokenHash).first<{ user_id: number; expires_at: string }>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return row.user_id;
}

export async function requireAuth(c: AppContext, next: Next) {
  const userId = await getSessionUserId(c);
  if (!userId) return c.json({ error: 'Sessão expirada. Faça login novamente.' }, 401);
  c.set('userId', userId);
  await next();
}

// ---- Desafio de MFA pendente: token assinado de vida curta (10 min), guardado
// num cookie separado do de sessão. Não precisa de revogação (expira rápido
// e vale só para uma tentativa de login), então continua stateless (JWT). ----

export async function createPendingMfaCookie(c: AppContext, userId: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + PENDING_MFA_TTL_SECONDS;
  const token = await sign({ uid: userId, purpose: 'mfa-pending', exp }, c.env.AUTH_SECRET, 'HS256');
  setCookie(c, PENDING_MFA_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Lax',
    path: '/',
    maxAge: PENDING_MFA_TTL_SECONDS
  });
}

export function clearPendingMfaCookie(c: AppContext): void {
  deleteCookie(c, PENDING_MFA_COOKIE, { path: '/' });
}

export async function getPendingMfaUserId(c: AppContext): Promise<number | null> {
  const token = getCookie(c, PENDING_MFA_COOKIE);
  if (!token) return null;
  try {
    const payload = await verify(token, c.env.AUTH_SECRET, 'HS256');
    if (payload.purpose !== 'mfa-pending') return null;
    const uid = Number(payload.uid);
    return Number.isFinite(uid) ? uid : null;
  } catch {
    return null;
  }
}
